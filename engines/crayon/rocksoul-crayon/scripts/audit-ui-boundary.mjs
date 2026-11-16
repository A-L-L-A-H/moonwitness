import { readFile } from 'node:fs/promises'
import { glob } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const web = resolve(root, 'apps/web/src')
const prohibited = [
  { pattern: /raw\.githubusercontent\.com\/bjo163\/rocksoul-assets\/main/g, message: 'mutable rocksoul-assets main URL' },
  { pattern: /@rocksoul\/ui\/src\//g, message: 'deep @rocksoul/ui source import' },
]
const matches = []

for await (const entry of glob('**/*.{ts,tsx,css}', { cwd: web })) {
  const file = resolve(web, entry)
  const source = await readFile(file, 'utf8')
  for (const rule of prohibited) {
    if (rule.pattern.test(source)) matches.push(`${relative(root, file)}: ${rule.message}`)
    rule.pattern.lastIndex = 0
  }
}

if (matches.length) {
  console.error('UI boundary audit failed:\n' + matches.join('\n'))
  process.exitCode = 1
} else {
  console.log('UI boundary audit passed: no mutable asset URLs or UI deep imports.')
}
