import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      API_KEY: "AIzaSyDIpThrFVaiaFFK_s7n9ewfrLqUpe7W8RA"
    }
  }
})