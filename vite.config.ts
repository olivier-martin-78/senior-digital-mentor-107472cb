
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/coverage/**']
    }
  },
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'iOS >= 10', 'Safari >= 10'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: ['es.global-this']
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['fsevents']
  },
  build: {
    rollupOptions: {
      external: ['fsevents']
    }
  }
}));
