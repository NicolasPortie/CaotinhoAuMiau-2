import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/js',
  resolve: { extensions: ['.ts', '.js'] },
  build: {
    outDir: '../dist/js',
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, 'src/js/main.ts') }
  },
  base: '/js/'
});
