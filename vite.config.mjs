import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: {
        'dim.es': resolve(__dirname, 'src/main.js'),
        'dim.cjs': resolve(__dirname, 'src/main.js'),
        'dim.umd': resolve(__dirname, 'src/main.js')
      },
      name: 'dim',
      fileName: (format, entryName) => `${entryName}.js`,
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