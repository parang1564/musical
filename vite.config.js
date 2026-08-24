import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/musical/', // 👈 이 설정을 반드시 이렇게 유지하세요!
  plugins: [
    react(),
    tailwindcss(),
  ],
})