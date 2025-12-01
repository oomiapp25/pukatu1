import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno basadas en el modo actual (development, production)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Exponemos la API Key como process.env.API_KEY para compatibilidad
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    }
  }
})