import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070b',
        panel: '#0e1117',
        accent: '#ff5a1f',
        accent2: '#3dd9b3',
        line: '#1f2633',
        text: '#f2f5f7',
        muted: '#97a3b6',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,90,31,0.25), 0 20px 60px rgba(255,90,31,0.18)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
