import { mkdir, copyFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
const output = resolve('build/chrome-mv3-prod/licenses')
await mkdir(output, { recursive: true })
const licenses = {
  dexie: ['LICENSE'],
  react: ['LICENSE'],
  'react-dom': ['LICENSE'],
  scheduler: ['LICENSE'],
  papaparse: ['LICENSE'],
  stemmer: ['license'],
  stopword: ['LICENSE'],
  'opencc-js': ['LICENSE', 'LICENSES/Apache-2.0.txt', 'THIRD_PARTY_LICENSES.md']
}
for (const [name, files] of Object.entries(licenses)) {
  for (const file of files)
    await copyFile(
      resolve('node_modules', name, file),
      join(output, name + '-' + file.replaceAll('/', '-'))
    )
}
await writeFile(
  join(output, 'NOTICE.txt'),
  'Fulltext Bookmark uses the bundled third-party components whose licenses are included in this directory. Original author copyright notices are retained in those files.\n'
)
console.log('Third-party license notices included.')
