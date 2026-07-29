/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: { 300: '#d946ef', 400: '#c026d3', 500: '#a21caf', 600: '#86198f' },
        dark: { 800: '#131316', 900: '#0a0a0c', 950: '#050505' },
      },
      boxShadow: {
        neon: '0 0 20px rgba(192, 38, 211, 0.4)',
        'neon-strong': '0 0 40px rgba(192, 38, 211, 0.6)',
      },
      zIndex: {
        15: '15',
        25: '25',
      },
    },
  },
  plugins: [],
}
