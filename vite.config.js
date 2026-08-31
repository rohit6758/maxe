import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        id: '/',
        name: 'Maxe - Study Hub',
        short_name: 'Maxe',
        description: 'Your college study hub for PDFs, Notes, Question Papers, AI Chats, Communities and more.',
        theme_color: '#2D4A3E',
        background_color: '#EDF4F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['education', 'productivity'],
        prefer_related_applications: false,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Maxe Study Hub'
          }
        ],
        shortcuts: [
          {
            name: 'Hub',
            short_name: 'Hub',
            description: 'Open your study hub',
            url: '/',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Community',
            short_name: 'Community',
            description: 'Open communities',
            url: '/explore',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
})
