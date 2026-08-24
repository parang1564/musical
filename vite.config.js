import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // 본인의 깃허브 배포 주소에 맞게 설정 (루트 바로 아래라면 '/' 혹은 './')
  base: './', 
  plugins: [
    react(),
    tailwindcss(),
  ],
})