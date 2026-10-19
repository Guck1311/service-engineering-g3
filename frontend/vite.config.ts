import {fileURLToPath, URL} from 'node:url';

import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  // Path the app is served from. GitHub Pages serves it under
  // /<repository>/, so the deploy workflow sets VITE_BASE; locally it is /.
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5 still uses Sass @import internally; hide the
        // deprecation warnings that come from inside node_modules.
        quietDeps: true,
        silenceDeprecations: ['import'],
      },
    },
  },
  server: {
    // Forward API calls to the NestJS backend, so the browser sees one
    // origin and no CORS setup is needed during development.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
