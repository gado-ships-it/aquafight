import { defineConfig } from 'vite';

export default defineConfig({
  base: '/aquafight/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
});
