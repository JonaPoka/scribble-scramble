import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The game server runs separately in development; Socket.IO traffic is proxied to it.
    proxy: {
      '/socket.io': { target: SERVER_URL, ws: true },
    },
  },
});
