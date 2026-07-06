import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://darkify19.github.io',
  base: '/carl-janzell-portfolio',
  vite: {
    plugins: [tailwindcss()],
  },
});
