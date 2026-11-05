// Gives an existing Firebase user the platform-owner ('admin') role on the REAL project.
// Usage (from backend/functions):
//   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"   (keep this file OUT of git)
//   $env:GCLOUD_PROJECT = "tselaassist-f6df2"
//   npx tsx scripts/make-admin.ts owner@example.com
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];
if (!email) throw new Error('Usage: npx tsx scripts/make-admin.ts <email>');
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Emulator variables are set; unset them to target the real project.');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account key file.');

const app = getApps()[0] ?? initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'tselaassist-f6df2' });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: 'admin' });
await getFirestore(app)
  .doc(`users/${user.uid}`)
  .set({ role: 'admin', orgId: null, name: user.displayName ?? 'Tsela Assist Owner', email }, { merge: true });
console.log(`Done: ${email} is now an admin. They must sign out and back in for it to apply.`);
