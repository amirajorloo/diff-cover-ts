import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { join } from 'node:path'

const SHEBANG = '#!/usr/bin/env node\n'
const CLI_FILES = ['dist/cli/diff-cover.js', 'dist/cli/diff-quality.js']

export default defineConfig({
  entry: {
    'cli/diff-cover': 'src/cli/diff-cover.ts',
    'cli/diff-quality': 'src/cli/diff-quality.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  splitting: true,
  sourcemap: true,
  clean: true,
  shims: true,
  async onSuccess() {
    for (const file of CLI_FILES) {
      const fullPath = join(process.cwd(), file)
      const content = readFileSync(fullPath, 'utf-8')
      if (!content.startsWith('#!')) {
        writeFileSync(fullPath, SHEBANG + content)
      }
      chmodSync(fullPath, 0o755)
    }
  },
})
