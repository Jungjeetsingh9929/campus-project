import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07111f',
        navy: '#0b1f3a',
        aurora: '#1f7a8c',
        lime: '#9effa8',
        ember: '#ff805c',
        skyglass: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(140, 255, 214, 0.2), 0 20px 80px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'mesh-gradient':
          'radial-gradient(circle at 20% 20%, rgba(35, 118, 255, 0.22), transparent 25%), radial-gradient(circle at 80% 10%, rgba(103, 235, 180, 0.18), transparent 22%), radial-gradient(circle at 60% 80%, rgba(255, 128, 92, 0.16), transparent 25%), linear-gradient(135deg, #050b16 0%, #0b1630 45%, #07111f 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
