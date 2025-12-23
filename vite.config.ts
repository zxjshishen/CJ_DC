import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 代理配置：让前端请求 /api 时自动转发给后端的 3000 端口
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})