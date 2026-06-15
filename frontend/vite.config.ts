import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || (id.includes('react') && !id.includes('@tanstack'))) return 'vendor'
          if (id.includes('@tanstack')) return 'router'
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts'
        },
      },
    },
  },
})
