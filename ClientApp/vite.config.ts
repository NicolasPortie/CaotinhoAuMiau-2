import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/js',
  resolve: { extensions: ['.ts', '.js'] },
  build: {
    outDir: '../dist/js',
    emptyOutDir: true,
    rollupOptions: { input: 'main.ts' }
  },
  base: '/js/'
});
