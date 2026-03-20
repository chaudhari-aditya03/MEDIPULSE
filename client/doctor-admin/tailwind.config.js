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
        ink: '#0f1222',
        neon: '#23d5ab',
        sky: '#3f8cff',
      },
      boxShadow: {
        panel: '0 18px 60px rgba(7, 13, 26, 0.45)',
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 80px rgba(35, 213, 171, 0.25)',
      },
    },
  },
  plugins: [],
};
