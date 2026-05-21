import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const envDir = process.env.VITE_ENV_DIR ?? path.resolve(__dirname, '..');
    const fileEnv = loadEnv(mode, envDir, '');
    const pick = (key: string, fallback = '') =>
      process.env[key] ?? fileEnv[key] ?? fallback;

    return {
      envDir,
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        watch: {
          usePolling: true,
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(pick('GEMINI_API_KEY')),
        'process.env.GEMINI_API_KEY': JSON.stringify(pick('GEMINI_API_KEY')),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
    };
});
