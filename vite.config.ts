
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './build/**',
      },
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',

    // Performance budgets
    reportCompressedSize: true,

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendor libraries
          if (id.includes('node_modules')) {
            // React core stays in main bundle to ensure it loads first
            // Only split out React ecosystem libraries
            if (id.includes('next-themes') || id.includes('sonner') ||
                id.includes('vaul') || id.includes('react-resizable-panels') ||
                id.includes('embla-carousel-react') || id.includes('swr') ||
                id.includes('react-router-dom') || id.includes('@vercel/analytics')) {
              return 'vendor-react-ecosystem';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@supabase') || id.includes('supabase-js')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-hook-form') || id.includes('react-day-picker') || id.includes('input-otp')) {
              return 'vendor-forms';
            }
            if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('cmdk')) {
              return 'vendor-utils';
            }
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            if (id.includes('web-vitals')) {
              return 'vendor-performance';
            }
            // Other vendor libraries (non-React dependencies only)
            return 'vendor-other';
          }

          // Route-based code splitting for lazy-loaded components
          if (id.includes('/components/Analytics')) {
            return 'route-analytics';
          }
          if (id.includes('/components/ContentCalendar') || id.includes('/components/calendar/')) {
            return 'route-calendar';
          }
          if (id.includes('/components/AIChatDialog')) {
            return 'route-ai-chat';
          }
          if (id.includes('/components/MediaLibrary') || id.includes('/components/Trending') || id.includes('/components/CompetitionWatch')) {
            return 'route-media';
          }
          if (id.includes('/components/AccountSettings') || id.includes('/components/ProjectSettings')) {
            return 'route-settings';
          }
          if (id.includes('/components/Notifications')) {
            return 'route-features';
          }
        },

        // Optimize chunk file naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1] || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Performance budgets - warn if chunks exceed these sizes
    chunkSizeWarningLimit: 600, // 600 KB limit for any single chunk

    // Minification and compression
    minify: 'esbuild',
    cssMinify: true,

    // Source maps for production debugging (disable for smaller bundles)
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});