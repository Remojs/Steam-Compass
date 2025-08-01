import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy para HowLongToBeat
      '/api/hltb': {
        target: 'https://howlongtobeat.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hltb/, '/api'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://howlongtobeat.com',
          'Origin': 'https://howlongtobeat.com'
        }
      },
      // Proxy para Metacritic
      '/api/metacritic': {
        target: 'https://www.metacritic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/metacritic/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
      // Proxy para Steam Reviews
      '/api/steam': {
        target: 'https://store.steampowered.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steam/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
