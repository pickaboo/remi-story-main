import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        // alias removed for troubleshooting
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/',
            'src/test/',
            '**/*.d.ts',
            '**/*.config.*',
            '**/index.tsx',
            '**/index.ts',
          ],
        },
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Vendor chunks
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('node_modules/firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('node_modules/@google/genai') || id.includes('node_modules/jspdf') || id.includes('node_modules/exifreader')) {
                return 'ui-vendor';
              }
              // Feature chunks
              if (id.includes('/pages/auth/')) {
                return 'auth';
              }
              if (id.includes('/pages/')) {
                return 'pages';
              }
              if (id.includes('/components/')) {
                return 'components';
              }
              if (id.includes('/services/')) {
                return 'services';
              }
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: mode === 'development',
        minify: false,
        terserOptions: mode === 'production' ? {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        } : undefined
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'firebase']
      }
    };
});
