import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/umporcento/',
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
