import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite ayarları.
// host: true → aynı Wi-Fi'deki telefondan da açabilmen için
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
