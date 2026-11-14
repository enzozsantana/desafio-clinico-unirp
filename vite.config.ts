import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-github-pages',
      closeBundle() {
        const index = resolve('dist/index.html');
        const notFound = resolve('dist/404.html');
        if (existsSync(index)) copyFileSync(index, notFound);
      },
    },
  ],
  base: process.env.VITE_BASE || '/',
});
