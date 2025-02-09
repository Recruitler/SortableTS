import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      external: ['@types/node']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@animation': resolve(__dirname, './src/animation'),
      '@dom': resolve(__dirname, './src/dom'),
      '@utils': resolve(__dirname, './src/utils')
    }
  },
  plugins: [dts({ rollupTypes: true })],
  server: {
    port: 3000,
    open: true,
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  }
})