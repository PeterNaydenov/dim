import { defineConfig } from 'vitest/config'

export default defineConfig ({
  test: {
        environment: 'jsdom', 
        globals: true        // optional: allows using describe/it/expect without imports
    }
})