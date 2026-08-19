/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        // All driven by CSS variables so the UI re-skins from
        // src/brand.config.js — see applyBrandTheme() and applyPalette().
        brand: {
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
        },
        // Semantic tokens — these flip with the light/dark theme, so the same
        // class reads correctly in both. `ink` is text/foreground.
        ink: 'rgb(var(--ink) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        dark: { 800: '#131316', 900: '#0a0a0c', 950: '#050505' },
      },
      boxShadow: {
        neon: '0 0 20px rgb(var(--brand-400) / 0.35)',
        'neon-strong': '0 0 40px rgb(var(--brand-400) / 0.5)',
      },
      zIndex: {
        15: '15',
        25: '25',
      },
    },
  },
  plugins: [],
}
