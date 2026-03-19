 /** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slatex: '#0b1220',
        mint: '#2dd4bf',
        amberx: '#f59e0b',
        rosex: '#f43f5e',
      },
      boxShadow: {
        panel: '0 18px 60px rgba(7, 13, 26, 0.45)',
      },
    },
  },
  plugins: [],
};
