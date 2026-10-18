# Carl Janzell Oropesa — Developer Portfolio

Developer portfolio built around a live schematic of the UPLB HR systems ecosystem: Laravel + Filament applications integrated over Apache Kafka. It also covers the projects in it, my AI-native engineering practice, and the commit history behind them.

**Live site:** https://darkify19.github.io/carl-janzell-portfolio/

## Stack

- [Astro](https://astro.build): static site framework
- [Tailwind CSS 4](https://tailwindcss.com): theme tokens and base styles
- Inline SVG and vanilla JS for the ecosystem map and its motion (Kafka event stream, first-load punch-in)
- [React](https://react.dev) island on canvas for the contribution skyline: the commit heatmap that folds up into a 3D isometric view
- All motion off under `prefers-reduced-motion`
- Deployed to GitHub Pages via GitHub Actions

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```
