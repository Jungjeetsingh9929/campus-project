import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('@react-three') || id.includes('/three') || id.includes('three-') || id.includes('troika')) {
              return 'three-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('color-convert') || id.includes('chartjs')) {
              return 'chart-vendor';
            }
            if (id.includes('framer-motion') || id.includes('motion-')) {
              return 'motion-vendor';
            }
            if (id.includes('@microsoft/signalr')) {
              return 'signalr-vendor';
            }
            if (id.includes('axios')) {
              return 'api-vendor';
            }
          }

          if (id.includes('/src/components/DashboardCards')) {
            return 'dashboard-cards';
          }

          if (id.includes('/src/components/CampusScene')) {
            return 'campus-scene';
          }

          if (id.includes('/src/components/ChartsPanel')) {
            return 'charts-panel';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
