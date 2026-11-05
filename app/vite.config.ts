// L'app de l'artisan Sitô : un site installable sur l'écran d'accueil du
// téléphone (iPhone, Android) ou de l'ordinateur. Pas d'app sur le Play Store
// (décision du 5 nov. 2026).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Sitô, mon site',
        short_name: 'Sitô',
        description: 'Votre site, vos photos de chantier, vos demandes et vos avis.',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f4ef',
        theme_color: '#1f2a24',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-masque-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallback: 'index.html', globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
  base: './',
  build: { target: 'es2022', sourcemap: false },
});
