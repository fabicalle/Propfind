import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        app: '#F4E8D4',
        card: '#DCC9B1',
        border: {
          subtle: '#B6A58F',
          chip: '#B6A58F',
        },
        content: {
          primary: '#3D3226',
          secondary: '#6E5D4F',
        },
        brand: {
          terracotta: '#C86D51',
          olive: '#2D5A43',
          clay: '#9E4242',
          mustard: '#D99B26',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'card-exit-left': 'cardExitLeft 0.3s ease-out forwards',
        'card-exit-right': 'cardExitRight 0.3s ease-out forwards',
        'card-undo': 'cardUndo 0.3s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        cardExitLeft: {
          '0%': { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate3d(-150%, 0, 0) rotate(-30deg)', opacity: '0' },
        },
        cardExitRight: {
          '0%': { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate3d(150%, 0, 0) rotate(30deg)', opacity: '0' },
        },
        cardUndo: {
          '0%': { transform: 'translate3d(var(--undo-x, 0), 0, 0) rotate(var(--undo-rot, 0deg))', opacity: '0' },
          '100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'swipe-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'swipe-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
