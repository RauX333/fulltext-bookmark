import { access, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const output = resolve('build/chrome-mv3-prod')
const manifestPath = resolve(output, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const contentScripts = await Promise.all(
  (manifest.content_scripts || []).flatMap((entry) =>
    (entry.js || []).map((file) => readFile(resolve(output, file), 'utf8'))
  )
)
let removed = 0
for (const entry of manifest.web_accessible_resources || []) {
  const resources = []
  for (const file of entry.resources) {
    if (file.includes('*')) {
      resources.push(file)
      continue
    }
    try {
      await access(resolve(output, file))
      resources.push(file)
    } catch (error) {
      // Plasmo 0.90.5 lists the data-base64 Weibo icon as a PNG bundle,
      // although Parcel embeds it in capture.js and emits no separate file.
      // Leave real resources intact and fail for any other missing file.
      const inlineCaptureIcon =
        error.code === 'ENOENT' &&
        /^capture\.[a-f0-9]+\.png$/.test(file) &&
        contentScripts.some((code) =>
          code.includes('data:image/png;base64,')
        ) &&
        contentScripts.every((code) => !code.includes(file))
      if (!inlineCaptureIcon) throw error
      removed++
    }
  }
  entry.resources = resources
}
if (removed) {
  manifest.web_accessible_resources = manifest.web_accessible_resources.filter(
    (entry) => entry.resources.length
  )
  if (!manifest.web_accessible_resources.length)
    delete manifest.web_accessible_resources
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(
    `Removed ${removed} unneeded inline-icon resource declaration(s).`
  )
}
