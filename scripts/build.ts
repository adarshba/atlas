import { readdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const PACKAGES_DIR = resolve(import.meta.dir, '..', 'packages')
const APPS_DIR = resolve(import.meta.dir, '..', 'apps')

const ENTRY_POINTS = [
  ...glob(`${PACKAGES_DIR}/*/src/index.ts`),
  ...glob(`${PACKAGES_DIR}/adapters/*/src/index.ts`),
  ...glob(`${APPS_DIR}/*/src/index.ts`),
]

for (const entry of ENTRY_POINTS) {
  const outDir = entry.replace('/src/index.ts', '/dist')
  const result = await Bun.build({
    entrypoints: [entry],
    outdir: outDir,
    target: 'node',
    format: 'esm',
    packages: 'external',
    sourcemap: 'linked',
  })

  if (result.success) {
    console.log(`built ${entry}`)
  } else {
    for (const log of result.logs) {
      console.error(log)
    }
  }
}

function glob(pattern: string): string[] {
  const parts = pattern.split('*')
  const base = parts[0]!
  const rest = parts.slice(1).join('*')
  if (!existsSync(base)) return []
  const entries = readdirSync(base, { withFileTypes: true })
  const results: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const matched = join(base, entry.name, rest)
      if (existsSync(matched)) {
        results.push(matched)
      }
    }
  }
  return results
}
