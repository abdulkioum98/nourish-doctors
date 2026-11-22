import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.js.org/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Dev server reachable from the phone on the same Wi-Fi:
  // `npm run dev` then open the Network URL (http://192.168.x.x:5173).
  server: {
    host: true,
    port: 5173,
  },
})