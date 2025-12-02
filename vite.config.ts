
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      // Inyección segura de variables
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
      
      // MOCK DE SUPABASE: Valores falsos para evitar que la app se rompa por código residual
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://placeholder.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('placeholder_key'),
      'process.env.VITE_SUPABASE_URL': JSON.stringify('https://placeholder.supabase.co'),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('placeholder_key'),
    }
  }
})