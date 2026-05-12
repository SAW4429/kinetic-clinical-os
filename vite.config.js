import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // 환경 변수 접두사 (VITE_ 로 시작하는 변수만 클라이언트에 노출)
  envPrefix: 'VITE_',
  build: {
    // 청크 크기 경고 임계값 상향 (현재 앱 규모 기준)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 벤더 라이브러리를 별도 청크로 분리 (캐시 효율 향상)
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
          if (id.includes('node_modules/lucide-react')) return 'lucide';
          if (id.includes('node_modules/recharts'))     return 'recharts';
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})
