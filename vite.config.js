import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
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
    }
  },
  plugins: [dts({ insertTypesEntry: true })]
})