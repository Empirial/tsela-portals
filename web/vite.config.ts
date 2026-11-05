import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // "hidden" emits source maps for Sentry without referencing them from the public bundles.
  build: { sourcemap: 'hidden' },
  plugins: [
    react(),
    tailwindcss(),
    // Uploads source maps at build time. Only active when SENTRY_AUTH_TOKEN is set
    // (add it as a Vercel env var; never commit it).
    sentryVitePlugin({
      org: 'empirial-designs',
      project: 'tsela-web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
    }),
  ],
})
