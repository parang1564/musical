import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/musical-scheduler/', // 👈 본인의 실제 깃허브 레포지토리 이름 (앞뒤로 슬래시 필수)
  plugins: [
    react(),
    tailwindcss(),
  ],
})