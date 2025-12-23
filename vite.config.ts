import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 代理配置：让前端请求 /api 时自动转发给后端的 3000 端口
      // 使用 127.0.0.1 而不是 localhost 可以避免 IPv4/IPv6 解析问题
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // 增加 preview 配置，确保 build 后运行 npm run preview 也能正常代理
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})