/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#06080D',
        midnight: '#0B1020',
        gold: '#C89B3C',
        champagne: '#F4D58D',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(200,155,60,0.35), 0 20px 60px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'route-glow': 'radial-gradient(circle at 30% 20%, rgba(200,155,60,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.07), transparent 30%)',
      },
    },
  },
  plugins: [],
};
