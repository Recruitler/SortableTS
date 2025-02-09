import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './example',
  server: {
    port: 3000,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '@sortablets': path.resolve(__dirname, '../src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  }
});
