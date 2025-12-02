
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Definimos esto de forma segura para evitar crashes si no hay .env
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
    }
  }
})
