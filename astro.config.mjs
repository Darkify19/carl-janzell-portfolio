import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://darkify19.github.io',
  base: '/carl-janzell-portfolio',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
