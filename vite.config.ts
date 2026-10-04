import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_URL || 'http://zelbana.test.192.168.1.202.nip.io'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/storefront/api': {
          target,
          changeOrigin: true,
        },
        '/api': {
          target,
          changeOrigin: true,
        }
      }
    }
  }
})
