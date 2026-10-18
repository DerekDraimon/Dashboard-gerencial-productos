import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /[/\\]node_modules[/\\](react|react-dom|react-router|react-router-dom|scheduler)[/\\]/,
            },
            { name: 'mui-vendor', test: /[/\\]node_modules[/\\]@(mui|emotion)[/\\]/ },
            { name: 'charts-vendor', test: /[/\\]node_modules[/\\](recharts|d3-[^/\\]+)[/\\]/ },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
