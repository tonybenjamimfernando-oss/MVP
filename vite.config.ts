import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./packages/core', import.meta.url)),
      '@modules': fileURLToPath(new URL('./packages/modules', import.meta.url)),
      '@glue': fileURLToPath(new URL('./packages/glue', import.meta.url)),
      '@ui': fileURLToPath(new URL('./packages/ui', import.meta.url)),
    },
  },
  server: { host: '0.0.0.0' },
  build: { sourcemap: true },
});