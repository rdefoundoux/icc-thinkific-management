// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: true,                // Listen on all addresses (0.0.0.0)
    port: 5173,                // Optional: Ensure you're using the right port
    allowedHosts: ['.loca.lt', 'pcnc-app.loca.lt', 'localhost'], // Allow loca.lt and localhost for testing
    strictPort: true           // Ensures the specified port is used, avoid auto-switching
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@emotion/babel-plugin'
    ]
  }
});
