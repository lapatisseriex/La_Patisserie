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
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
      },
      backgroundImage: {
        'cake-pattern': "url('/images/backGround.png')",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideIn': 'slideIn 0.5s ease-in-out',
        'pulse-subtle': 'pulse 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
