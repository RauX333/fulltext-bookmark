import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { deflateRawSync } from 'node:zlib'
import { Zip, ZipPassThrough, unzipSync } from 'fflate'

// Use Node's compressor: Plasmo's packaging path produced an invalid DEFLATE
// stream for a large bundle. Keep fflate for ZIP framing and independent decode.
class NodeDeflate extends ZipPassThrough {
  compression = 8
  process(chunk, final) {
    assert(final, 'Each package entry must be supplied in one chunk')
    this.ondata(null, deflateRawSync(chunk, { level: 9 }), true)
  }
}

const directory = resolve('build/chrome-mv3-prod')
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const files = new Map()
async function collect(path = '') {
  const entries = await readdir(resolve(directory, path), {
    withFileTypes: true
  })
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path ? `${path}/${entry.name}` : entry.name
    if (entry.isDirectory()) await collect(name)
    else {
      assert(entry.isFile(), `Unexpected build entry: ${name}`)
      files.set(name, await readFile(resolve(directory, name)))
    }
  }
}
await collect()
const manifest = JSON.parse(files.get('manifest.json').toString())
assert.equal(manifest.version, pkg.version, 'Build the current version first')
assert.equal(manifest.manifest_version, 3)
const chunks = []
let finished = false
const zip = new Zip((error, chunk, final) => {
  if (error) throw error
  chunks.push(chunk)
  finished = final
})
for (const [name, bytes] of files) {
  const entry = new NodeDeflate(name)
  entry.mtime = new Date('2020-01-01T00:00:00Z')
  zip.add(entry)
  entry.push(bytes, true)
}
zip.end()
assert(finished, 'ZIP archive did not finish')
const archive = Buffer.concat(chunks)
const decoded = unzipSync(archive)
assert.deepEqual(Object.keys(decoded).sort(), [...files.keys()].sort())
for (const [name, bytes] of files)
  assert(Buffer.from(decoded[name]).equals(bytes), `ZIP mismatch: ${name}`)
const output = `build/Fulltext-Bookmark-${pkg.version}-chrome.zip`
await writeFile(output, archive)
await writeFile('build/chrome-mv3-prod.zip', archive)
const checksum = createHash('sha256').update(archive).digest('hex')
await writeFile(
  `${output}.sha256`,
  `${checksum}  ${output.split('/').at(-1)}\n`
)
console.log(
  JSON.stringify({
    output,
    version: pkg.version,
    files: files.size,
    bytes: archive.length,
    sha256: checksum,
    verified: true
  })
)
