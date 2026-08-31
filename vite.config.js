import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-*.png', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png', 'screenshot1.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true
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
        lang: 'en',
        dir: 'ltr',
        categories: ['education', 'productivity'],
        prefer_related_applications: false,
        icons: [
          { src: 'icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: 'icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: 'icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-192x192.png',  sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          {
            src: 'screenshot1.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Maxe Study Hub Home Screen'
          }
        ],
        shortcuts: [
          {
            name: 'Open Hub',
            short_name: 'Hub',
            description: 'Open your study hub',
            url: '/'
          },
          {
            name: 'Community',
            short_name: 'Groups',
            description: 'Open communities',
            url: '/explore'
          }
        ]
      }
    })
  ],
})
