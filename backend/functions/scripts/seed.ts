// Seeds the local emulators with the demo world: the owner, one fleet (Brave Logistics) and two repairers
// (Trojan, Apex). Safe to run repeatedly. Emulator only: it refuses to run unless the emulators are configured.
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'demo-tsela-assist';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

export const DEMO_PASSWORD = 'Demo1234!';

export const users = {
  admin: { email: 'admin@tselaassist.demo', name: 'Tsela Assist Owner', role: 'admin', orgId: undefined },
  manager: { email: 'manager@bravelogistics.demo', name: 'Brave Manager', role: 'manager', orgId: 'brave-logistics' },
  driver: { email: 'driver@bravelogistics.demo', name: 'Brave Driver', role: 'driver', orgId: 'brave-logistics' },
  trojan: { email: 'dispatch@trojanmechanics.demo', name: 'Trojan Dispatch', role: 'repairer', orgId: 'trojan-mechanics' },
  apex: { email: 'dispatch@apexmechanics.demo', name: 'Apex Dispatch', role: 'repairer', orgId: 'apex-mechanics' },
} as const;

export async function seed() {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Refusing to seed without the Auth emulator.');
  const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
  const auth = getAuth(app);
  const db = getFirestore(app);

  await db.doc('settings/platform').set({
    feePct: 8,
    vatPct: 15,
    corridors: [
      { id: 'n1', name: 'N1 Western', route: 'Johannesburg ⇄ Cape Town', enabled: true, radiusKm: 50 },
      { id: 'n3', name: 'N3 Natal', route: 'Gauteng ⇄ Durban', enabled: true, radiusKm: 50 },
      { id: 'n4', name: 'N4 Maputo', route: 'Mpumalanga ⇄ Maputo', enabled: true, radiusKm: 40 },
      { id: 'n2', name: 'N2 Garden Route', route: 'Cape Town ⇄ Durban', enabled: false, radiusKm: 40 },
    ],
  });

  const orgs = {
    'brave-logistics': { type: 'fleet', name: 'Brave Logistics', plan: 'Fleet SaaS Pro' },
    'trojan-mechanics': { type: 'repairer', name: 'Trojan Mechanics', vans: 1, radius: '50km' },
    'apex-mechanics': { type: 'repairer', name: 'Apex Mechanics', vans: 1, radius: '50km' },
  };
  for (const [id, o] of Object.entries(orgs)) {
    await db.doc(`orgs/${id}`).set({ ...o, status: 'active', rating: 0, jobs: 0, createdAt: new Date() }, { merge: true });
  }

  const uids: Record<string, string> = {};
  for (const [key, u] of Object.entries(users)) {
    let uid: string;
    try {
      uid = (await auth.getUserByEmail(u.email)).uid;
    } catch {
      uid = (await auth.createUser({ email: u.email, password: DEMO_PASSWORD, displayName: u.name })).uid;
    }
    uids[key] = uid;
    await auth.setCustomUserClaims(uid, u.orgId ? { role: u.role, orgId: u.orgId } : { role: u.role });
    await db.doc(`users/${uid}`).set({ role: u.role, orgId: u.orgId ?? null, name: u.name, email: u.email }, { merge: true });
  }

  await db.doc('orgs/brave-logistics/trucks/BR 001-GP').set({ reg: 'BR 001-GP', model: 'Volvo FH16', tyres: '315/80 R22.5', wheels: 10, driver: 'Brave Driver', status: 'Active' });
  await db
    .doc(`orgs/brave-logistics/drivers/${uids.driver}`)
    .set({ name: 'Brave Driver', phone: '+27 00 000 0000', email: users.driver.email, truckReg: 'BR 001-GP', canReport: true }, { merge: true });

  return uids;
}

// Run directly: `npm run seed`
if (process.argv[1]?.endsWith('seed.ts')) {
  seed().then(
    () => {
      console.log(`Seeded. Sign in with any of these (password ${DEMO_PASSWORD}):`);
      Object.values(users).forEach((u) => console.log(`  ${u.role.padEnd(9)} ${u.email}`));
    },
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );
}
