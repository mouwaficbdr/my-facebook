import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        secure: false,
        ws: true,
        cookieDomainRewrite: {
          '*': '',
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (_proxyReq, _req, _res) => {
            // Log cookies being sent to the backend
            console.log('Cookies sent to backend:', _req.headers.cookie);
          });
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            // Log cookies received from the backend
            console.log(
              'Cookies received from backend:',
              proxyRes.headers['set-cookie']
            );
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          '*': '',
        },
      },
    },
  },
});
