import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@vite-pwa/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      title: '每日手機報價',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0f172a' },
      ],
    },
  },

  runtimeConfig: {
    // 用環境變數覆蓋：NUXT_ANTHROPIC_API_KEY（或 ANTHROPIC_API_KEY）
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    // session 加密密碼（正式環境請改）：NUXT_SESSION_PASSWORD
    sessionPassword: 'buymobile-local-dev-session-secret-32ch!',
  },

  nitro: {
    storage: {
      data: { driver: 'fs', base: './data' },
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: '每日手機報價',
      short_name: '手機報價',
      description: '每日更新的手機收購報價單',
      lang: 'zh-Hant',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      // 前台公開報價 API：網路優先，離線時用快取（還能看到最後一次的報價）
      runtimeCaching: [
        {
          urlPattern: /\/api\/public\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'public-api',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 3 },
          },
        },
      ],
      // 後台不進 service worker 的導航快取
      navigateFallback: null,
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
})
