import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // URL path the app is served under. GitHub Pages serves project sites under
  // /<repository>/, so the deploy workflow sets VITE_BASE; locally it is /.
  // The router reads the same value via import.meta.env.BASE_URL.
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 is written with Sass `@import`, which Dart Sass deprecates in
        // favour of `@use`. Theming Bootstrap therefore still requires `@import`
        // (until Bootstrap 6), so these known warnings are silenced:
        quietDeps: true, // warnings from inside node_modules (Bootstrap's own code)
        silenceDeprecations: ['import'], // our two @import lines in main.scss
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
