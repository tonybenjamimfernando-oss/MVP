import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./packages/core', import.meta.url)),
      '@ui': fileURLToPath(new URL('./packages/ui', import.meta.url)),
      '@modules': fileURLToPath(new URL('./packages/modules', import.meta.url)),
      '@glue': fileURLToPath(new URL('./packages/glue', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./packages/glue/__tests__/setup.ts'],
    include: ['packages/**/__tests__/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.d.ts'],
    },
  },
});
