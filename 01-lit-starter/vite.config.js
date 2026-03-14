import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        drop_console: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'lit-vendor': ['lit', 'lit/directives/repeat.js', 'lit/directives/until.js']
        }
      }
    }
  },
  test: {
    environment: 'jsdom'
  }
});
