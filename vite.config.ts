import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps the built app working from any folder — including a
// GitHub Pages URL like username.github.io/repo-name/ — without extra config.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true },
});
