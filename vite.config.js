import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // 수정: './' 대신 '/musical/'을 입력해야 올바르게 작동합니다.
  base: '/musical/', 
  plugins: [
    react(),
    tailwindcss(),
  ],
})