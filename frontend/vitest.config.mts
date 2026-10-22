import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.tsx', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
