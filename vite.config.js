import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split recharts (heaviest dep ~314KB) into its own vendor chunk
          // so it loads asynchronously via the lazy-loaded views
          'vendor-recharts': ['recharts'],
          // React core stays in main chunk
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
    // Recharts alone is 314KB, so raise the warning threshold
    chunkSizeWarningLimit: 500,
  },
})
