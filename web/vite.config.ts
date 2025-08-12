import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import EnhanceLog from 'vite-plugin-enhance-log'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    EnhanceLog({
      splitBy: '\n',
      preTip: '🐞🐞🐞',
      enableFileName: true, // or enableFileName: { enableDir: false}
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'public/logo.svg',
          dest: 'assets/',
        },
        {
          src: 'public/favicon.png',
          dest: 'assets/',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:15037',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },

})
