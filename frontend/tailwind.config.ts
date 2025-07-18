export default {
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 2.5s linear infinite',
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.23, 1, 0.32, 1) both',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
    },
  },
}; 