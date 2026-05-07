import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendProxy = {
  '/api': {
    target: 'http://localhost:5001',
    changeOrigin: true,
  },
  '/uploads': {
    target: 'http://localhost:5001',
    changeOrigin: true,
  },
  '/socket.io': {
    target: 'http://localhost:5001',
    changeOrigin: true,
    ws: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: backendProxy,
  },
  preview: {
    host: true,
    port: 3000,
    proxy: backendProxy,
  },
})
