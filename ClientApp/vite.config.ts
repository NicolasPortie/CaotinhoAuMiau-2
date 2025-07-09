import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src/js/main.ts'),
      output: {
        dir: resolve(__dirname, 'dist/js'),
        entryFileNames: 'bundle.js',
        format: 'iife',
        name: 'app'
      }
    }
  }
});
