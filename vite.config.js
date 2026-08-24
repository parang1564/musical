import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/musical/', // 👈 필수! (이게 있어야 경로가 안 깨집니다)
  plugins: [
    react(),
    tailwindcss(),
  ],
})