import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2021',
    minify: 'terser',
    rollupOptions: {
      input: 'index.html',
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  esbuild: {
    target: 'es2021',
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  server: {
    open: false,
  },
  preview: {
    open: false,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
