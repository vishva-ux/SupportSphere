/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f9',
          100: '#deeaec',
          200: '#c5d8dc',
          300: '#a2c0c7',
          400: '#759ea7',
          500: '#0078d4', // Fluent Blue
          600: '#005a9e',
          700: '#106ebe',
          800: '#004578',
          900: '#002035',
        },
        slate: {
          850: '#1e293b',
          950: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
