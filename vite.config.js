import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env, .env.local, .env.[mode], .env.[mode].local 을 mode 기준으로 로드
  // VITE_ prefix로 시작하는 환경 변수만 로드
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      host: true,
      port: 3000,
      open: true,
      // API 프록시 설정: /api로 시작하는 요청을 백엔드 서버로 전달
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://192.168.0.52:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
});
