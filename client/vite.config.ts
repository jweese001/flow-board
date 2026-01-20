import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Base path for GitHub Pages - set via env or default to repo name
  base: process.env.VITE_BASE_PATH || '/flow-board/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
