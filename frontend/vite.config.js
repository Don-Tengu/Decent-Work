import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // 使用 jsdom 模拟浏览器环境（测试 React 组件需要）
    environment: 'jsdom',
    // 每个测试文件运行前自动引入 jest-dom 的匹配器
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})
