/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#181A18',
        surface: '#252825',
        primary: '#4F5D53',
        header: '#E0E0E0',
        body: '#A0A0A0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter or system font for "Aa"
      },
    },
  },
  plugins: [],
}
