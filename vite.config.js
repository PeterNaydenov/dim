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
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src/**/*.js'],
      exclude: ['test/**', 'demo.js'],
      insertTypesEntry: false,
      cleanVueFileName: true,
      copyDtsFiles: false,
      beforeWriteFile: (filePath, content) => {
        if (filePath.endsWith('main.d.ts')) {
          return {
            filePath: filePath.replace(/main\.d\.ts$/, 'dim.d.ts'),
            content
          }
        }
        return undefined
      }
    })
  ]
})
