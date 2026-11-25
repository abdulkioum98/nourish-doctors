import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.js.org/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA service worker — same pattern as Nourish Smart Team:
    // caches the whole web app (JS/CSS/HTML/images) on the phone, so the
    // app keeps working offline AND picks up new code when a new version
    // is deployed (registerType autoUpdate). The app loads from
    // server.url in capacitor.config.json, so deploys reach the APK
    // without a rebuild. First launch must be online (to download the
    // code + register the worker); after that the cache serves it offline.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['nourish-fav.png'],
      manifest: {
        name: 'Nourish Doctors',
        short_name: 'Nourish Doctors',
        description: 'Offline-First Ration Calculator',
        theme_color: '#059669',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // NOTE: jpg/jpeg included (Smart Team only lists png) — the feed
        // and cattle-health photos are .jpg, and they must be cached too
        // or they will not load offline.
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  // Dev server reachable from the phone on the same Wi-Fi:
  // `npm run dev` then open the Network URL (http://192.168.x.x:5173).
  server: {
    host: true,
    port: 5173,
  },
})