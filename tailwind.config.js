/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      minHeight: {
        dvh: '100dvh',
      },
      colors: {
        oil: {
          gold: '#D4A017',
          amber: '#B8860B',
          dark: '#4A3728',
          black: '#1A0A00',
        },
        surface: {
          900: '#0F1117',
          800: '#1A1D27',
          700: '#242836',
          600: '#2E3347',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: []
}
