import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // ── SMS Webhook Microservice (Node.js — port 4000) ──────────────────
      '/api/sms-webhook': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      // ── SMS Transactions management via Flask (port 5000) ───────────────
      '/api/sms-transactions': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // ── All other /api/* → Flask backend (port 5000) ────────────────────
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});