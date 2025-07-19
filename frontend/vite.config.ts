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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer React et React Router
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Séparer les icônes et utilitaires
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          // Séparer les fonctionnalités admin
          admin: [
            './src/pages/admin/AdminDashboard.tsx',
            './src/pages/admin/AdminLogin.tsx',
            './src/pages/admin/AdminPosts.tsx',
            './src/pages/admin/AdminUsers.tsx',
            './src/components/admin/AdminLayout.tsx',
            './src/components/admin/AdminProtectedRoute.tsx',
            './src/context/AdminAuthContext.tsx',
            './src/api/admin.ts',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Augmenter la limite pour éviter les warnings
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
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, _req) => {
            // Log cookies being sent to the backend
            console.log('Cookies sent to backend:', _req.headers.cookie);
          });
          proxy.on('proxyRes', (proxyRes) => {
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
