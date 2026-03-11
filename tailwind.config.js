/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1565C0',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1565C0',
          900: '#0D47A1',
        },
        income: '#16A34A',
        expense: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05)',
        'card-hover': '0 10px 25px rgba(0,0,0,.10), 0 4px 10px rgba(0,0,0,.06)',
      },
      animation: {
        'slide-up':    'slideUp 0.45s ease-out',
        'slide-right': 'slideRight 0.45s ease-out',
        'fade-in':     'fadeIn 0.3s ease-in',
      },
      keyframes: {
        slideUp:    { '0%': { opacity:'0', transform:'translateY(20px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        slideRight: { '0%': { opacity:'0', transform:'translateX(20px)' }, '100%': { opacity:'1', transform:'translateX(0)' } },
        fadeIn:     { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
      },
    },
  },
  plugins: [],
}
