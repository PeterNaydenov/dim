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
        exports: 'named',
        globals: { global: 'global' }
      }
    },
    emptyOutDir: false
  }
})
