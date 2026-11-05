import * as Sentry from '@sentry/node';
import { HttpsError, onCall as fbOnCall, type CallableRequest } from 'firebase-functions/v2/https';

// Import this module FIRST in index.ts so Sentry is initialised before anything else loads.
// Set SENTRY_DSN via firebase functions params / .env (never commit the auth token).
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? 'https://2a0907b9e9e76cb175a11b6f61fa81a3@o4511739492433920.ingest.us.sentry.io/4512378947108864',
  environment: process.env.FUNCTIONS_EMULATOR === 'true' ? 'development' : 'production',
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: process.env.FUNCTIONS_EMULATOR === 'true' ? 1.0 : 0.1,
});

// Client-caused errors (bad input, unauthenticated, not found, ...) are expected, not bugs.
const EXPECTED = new Set([
  'invalid-argument', 'unauthenticated', 'permission-denied', 'not-found', 'already-exists',
  'failed-precondition', 'out-of-range', 'cancelled', 'resource-exhausted',
]);

/** Drop-in replacement for firebase-functions' onCall that reports unexpected errors to Sentry. */
export function onCall<T = any>(handler: (req: CallableRequest<T>) => any) {
  return fbOnCall<T, any>(async (req) => {
    try {
      return await handler(req);
    } catch (err) {
      if (!(err instanceof HttpsError && EXPECTED.has(err.code))) {
        Sentry.withScope((scope) => {
          scope.setUser({ id: req.auth?.uid });
          scope.setTag('role', String(req.auth?.token?.role ?? 'none'));
          Sentry.captureException(err);
        });
        await Sentry.flush(2000);
      }
      throw err;
    }
  });
}

export { Sentry };
