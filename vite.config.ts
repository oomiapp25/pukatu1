
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Definir variables críticas
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
      
      // MOCK DE SUPABASE: Definimos estos valores como cadenas vacías para silenciar 
      // el error "Missing Supabase environment variables" si algún archivo residual las busca.
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://placeholder.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('placeholder_key'),
    }
  }
})
