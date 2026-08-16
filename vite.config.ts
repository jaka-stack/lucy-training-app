import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/* Stamped into the app at build time so there is a way to tell, on the phone,
   exactly which version is installed. Without it "did the update land?" is
   unanswerable from the device. */
const BUILT_AT = new Date().toISOString();

export default defineConfig({
  define: {
    __BUILT_AT__: JSON.stringify(BUILT_AT),
  },

  // base: './' keeps the built app working from any folder — including a
  // GitHub Pages URL like username.github.io/repo-name/ — without extra config.
  base: './',

  plugins: [
    react(),

    VitePWA({
      // Installs the service worker without asking and takes over straight
      // away. There is no server behind this app, so there is never a reason
      // to make her decide about an update.
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      workbox: {
        // Everything the app is made of gets stored on the phone at install
        // time. After the first visit it never needs the network again.
        // Exercise photos are included, so form cues work in aeroplane mode
        // too — which is the whole point of having them.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,jpg,jpeg,webp,gif}'],
        // A few large photos should not silently fall out of the offline
        // bundle. 4 MB each is far more than any of these need.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Any navigation falls back to the app shell, so a reload in
        // aeroplane mode opens the app instead of a browser error page.
        navigateFallback: 'index.html',
      },

      manifest: {
        name: 'Training',
        short_name: 'Training',
        description: 'A 12-week strength programme.',
        // Opens without browser chrome, like an app.
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#17131A',
        theme_color: '#17131A',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            // Android crops icons to the launcher's shape; the maskable
            // version has the padding to survive that.
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],

  server: { host: true },
});
