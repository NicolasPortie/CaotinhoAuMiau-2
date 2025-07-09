import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'src/js/main.js'),
      output: {
        entryFileNames: 'js/bundle.js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    emptyOutDir: true,
    minify: true
  },
  server: {
    open: false
  }
});
