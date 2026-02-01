import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Use API_KEY from environment variables as required by guidelines.
  // The API key must be obtained exclusively from process.env.API_KEY.
  const finalApiKey = env.API_KEY;

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      // Properly stringify the API key so it's available globally as process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(finalApiKey)
    }
  };
});