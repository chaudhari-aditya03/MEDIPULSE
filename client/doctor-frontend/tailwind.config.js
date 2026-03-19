/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1222',
        neon: '#23d5ab',
        coral: '#ff6b6b',
        sky: '#3f8cff',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 80px rgba(35, 213, 171, 0.25)',
      },
    },
  },
  plugins: [],
};
