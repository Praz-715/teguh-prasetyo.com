// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  ssr: true,

  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    '@nuxt/eslint',
    'nuxt-security',
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  components: [
    { path: '~/components/content', pathPrefix: false },
    { path: '~/components/expense-splitter', prefix: 'Split', pathPrefix: false },
    { path: '~/components/trip-planner', prefix: 'Plan', pathPrefix: false },
    { path: '~/components/oracle-toolkit', prefix: 'Ora', pathPrefix: false },
    '~/components',
  ],

  site: {
    url: 'https://www.teguh-prasetyo.com',
    name: 'Teguh Prasetyo',
    description:
      'Database & Enterprise Solutions Consultant. Personal portfolio, projects, and writing.',
    defaultLocale: 'en',
  },

  // Pull dynamic content routes (blog + projects) into the sitemap. Static
  // pages are auto-discovered. See server/api/__sitemap__/urls.ts.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    defaults: { changefreq: 'monthly', priority: 0.5 },
  },

  // Runtime OG-image generation (nuxt-og-image islands) is incompatible with
  // this Nuxt 4.x build ("Invalid island request hash"), so we ship a static
  // branded card instead (public/og/og-default.png, set in app.vue).
  ogImage: { enabled: false },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon/favicon-96x96.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' },
        // Fonts (Inter, JetBrains Mono, Newsreader) are self-hosted by
        // @nuxt/fonts and inlined into the entry CSS — no external, render-
        // blocking Google Fonts request needed.
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0a0a0a', media: '(prefers-color-scheme: dark)' },
        { name: 'application-name', content: 'Teguh Prasetyo' },
        { name: 'apple-mobile-web-app-title', content: 'Teguh Prasetyo' },
      ],
    },
  },

  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
  },

  content: {
    build: {
      markdown: {
        toc: { depth: 4, searchDepth: 4 },
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark',
          },
          langs: ['bash', 'sh', 'sql', 'js', 'ts', 'vue', 'json', 'yaml', 'python', 'java'],
        },
      },
    },
  },

  image: {
    format: ['webp', 'avif'],
    quality: 80,
    domains: ['images.unsplash.com'],
    presets: {
      cover: {
        modifiers: { format: 'webp', quality: 80, width: 1600, height: 900 },
      },
      card: {
        modifiers: { format: 'webp', quality: 80, width: 600, height: 338 },
      },
      portrait: {
        modifiers: { format: 'webp', quality: 85, width: 800, height: 1000 },
      },
      hero: {
        modifiers: { format: 'webp', quality: 85, width: 2400 },
      },
    },
  },

  icon: {
    serverBundle: { collections: ['lucide', 'simple-icons'] },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/sitemap.xml', '/robots.txt'],
    },
  },

  // Per-route cache & rate-limit overrides. The global security config below
  // sets the defaults; these tighten or loosen by URL pattern.
  routeRules: {
    // Self-hosted image optimizer (dev / non-Vercel). Heavy edge cache + rate limit.
    '/_ipx/**': {
      headers: {
        'cache-control': 'public, max-age=2592000, s-maxage=31536000, immutable',
      },
      security: {
        rateLimiter: { tokensPerInterval: 100, interval: 60_000 },
      },
    },
    // Vercel's built-in image optimizer (prod). Vercel already rate-limits;
    // we just reinforce caching here.
    '/_vercel/image/**': {
      headers: {
        'cache-control': 'public, max-age=2592000, s-maxage=31536000, immutable',
      },
    },
    // Never cache API responses at the CDN.
    '/api/**': {
      headers: { 'cache-control': 'no-store' },
    },
    // Contact endpoint: 5 submissions per 10 min per IP, capped body size.
    '/api/contact': {
      security: {
        rateLimiter: { tokensPerInterval: 5, interval: 600_000 },
        requestSizeLimiter: { maxRequestSizeInBytes: 100_000 },
      },
    },
  },

  // nuxt-security: rate limit, request-size limit, security headers, CORS.
  // Per-route overrides live in `routeRules['*'].security`.
  security: {
    rateLimiter: {
      tokensPerInterval: 150,
      interval: 60_000,
      headers: true,
      throwError: true,
    },
    requestSizeLimiter: {
      maxRequestSizeInBytes: 2_000_000,
      maxUploadFileRequestInBytes: 8_000_000,
      throwError: true,
    },
    corsHandler: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
    },
    headers: {
      contentSecurityPolicy: {
        'base-uri': ['\'self\''],
        'default-src': ['\'self\''],
        'script-src': ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
        'style-src': ['\'self\'', '\'unsafe-inline\''],
        'font-src': ['\'self\'', 'data:'],
        'img-src': ['\'self\'', 'data:', 'blob:', 'https://images.unsplash.com'],
        'connect-src': ['\'self\''],
        'object-src': ['\'none\''],
        'form-action': ['\'self\''],
        'frame-ancestors': ['\'self\''],
        'upgrade-insecure-requests': true,
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubdomains: true,
        preload: true,
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'SAMEORIGIN',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        fullscreen: ['self'],
      },
    },
    xssValidator: false,
    hidePoweredBy: true,
  },

  experimental: {
    payloadExtraction: true,
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
