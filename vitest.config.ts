import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.mjs': ['.mts', '.mjs'],
    },
  },
  test: {
    root: 'src',
    globals: true,
  },
})
