import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-english)', ...defaultTheme.fontFamily.sans],
        thai: ['var(--font-thai)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
