import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const urlApi = process.env.VITE_API_URL ?? 'http://localhost:5263'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': { target: urlApi, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    css: true,
  },
})
