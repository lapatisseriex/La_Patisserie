/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '2rem',
        sm: '3rem',
        lg: '5rem',
        xl: '6rem',
        '2xl': '7rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1600px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        cakePink: {
          light: '#FFD6E0',
          DEFAULT: '#FF80A0',
          dark: '#FF4D79',
        },
        cakeBrown: {
          light: '#8B5A2B',
          DEFAULT: '#704214',
          dark: '#5E370F',
        },
        creamWhite: '#FFF9F4',
      },
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
      },
      backgroundImage: {
        'cake-pattern': "url('/images/backGround.png')",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
