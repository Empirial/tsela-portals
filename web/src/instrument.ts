import * as Sentry from '@sentry/react'
import { useEffect } from 'react'
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom'

// Must be the first import in main.tsx so Sentry is ready before anything else runs.
Sentry.init({
  dsn:
    import.meta.env.VITE_SENTRY_DSN ??
    'https://65cf04a44398492a87ffe2063db13575@o4511739492433920.ingest.us.sentry.io/4512378928889856',
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
  tracePropagationTargets: ['localhost', /^https:\/\/.*\.cloudfunctions\.net/, /^https:\/\/.*\.run\.app/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
