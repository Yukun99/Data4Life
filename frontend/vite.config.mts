/// <reference types='vitest' />
import react from '@vitejs/plugin-react';
import { join } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const DEFAULT_API = 'http://localhost:8080';

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: './node_modules/.vite/frontend',
  server: {
    port: 4210,
    host: 'localhost',
    proxy: {
      '/api': {
        target: loadEnv(mode, import.meta.dirname, 'VITE_').VITE_API_URL ?? DEFAULT_API,
        changeOrigin: true,
      },
    },
  },
  preview: { port: 4210, host: 'localhost' },
  plugins: [react()],
  resolve: { alias: { '@': join(import.meta.dirname, 'src') } },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
  },
  test: {
    name: 'frontend',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
    reporters: ['default'],
    coverage: { reportsDirectory: './test-output/vitest/coverage', provider: 'v8' as const },
  },
}));
