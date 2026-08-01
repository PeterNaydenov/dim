import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig ({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'dim',
      fileName: 'dim',
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      output: {
        // Source uses `export default dim` only — Rollup infers the
        // correct output shape (`exports.default = …` for CJS,
        // `export { … as default }` for ESM). No explicit `exports`
        // setting needed.
        globals: { global: 'global' }
      }
    },
    emptyOutDir: true
  }
})
