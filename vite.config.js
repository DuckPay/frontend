import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'yaml-loader',
      transform(code, id) {
        if (id.endsWith('.yml')) {
          const fileContent = fs.readFileSync(id, 'utf-8')
          const parsedYaml = yaml.load(fileContent)
          return {
            code: `export default ${JSON.stringify(parsedYaml)}`,
            map: null
          }
        }
        return null
      }
    }
  ],
  server: {
    host: true,
    port: 3000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
