/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'pulse': 'pulse 6s infinite',
        'shake': 'shake 0.5s linear',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'gradient': 'gradient 3s linear infinite',
        'fadeIn': 'fadeIn 0.2s ease-in',
        'step-ping-slow': 'step-ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'step-ping': 'step-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'step-pulse-fast': 'step-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'step-pulse': 'step-pulse 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200%',
            'background-position': 'right center'
          }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        shimmer: {
          '0%': { opacity: 0.5 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.5 },
        },
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'step-ping': {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        'step-pulse': {
          '0%, 100%': {
            opacity: '0.5',
            transform: 'scale(1.1)',
          },
          '50%': {
            opacity: '0.15',
            transform: 'scale(1.3)',
          },
        },
      },
      colors: {
        gradient: {
          start: '#E2EBED',
          second: '#F4E8EA',
          third: '#C2E4FF',
          fourth: '#A6C8FF',
          end: '#759CF3',
        }
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* Hide scrollbar for Chrome, Safari and Opera */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          '-ms-overflow-style': 'none', /* IE and Edge */
          'scrollbar-width': 'none', /* Firefox */
        },
      });
    },
  ],
} 