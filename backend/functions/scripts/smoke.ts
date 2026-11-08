// End-to-end check of the whole backend against the emulators: sign-in, the full dispatch lifecycle,
// fee/VAT maths, and the security rules. Run with `npm run test:backend` from backend/.
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { DEMO_PASSWORD, PROJECT_ID, seed, users } from './seed.ts';

let n = 0;

function session(name: string) {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo', authDomain: 'localhost' }, `${name}-${n++}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const fns = getFunctions(app, 'africa-south1');
  connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  const s = {
    auth,
    db,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    call: async <T = any>(fn: string, data?: unknown): Promise<T> => (await httpsCallable(fns, fn)(data)).data as T,
    login: async (email: string, password = DEMO_PASSWORD) => {
      await signInWithEmailAndPassword(auth, email, password);
      await auth.currentUser!.getIdToken(true);
      return s;
    },
  };
  return s;
}

let passed = 0;
const failures: string[] = [];
async function check(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${label}`);
  } catch (e) {
    failures.push(label);
    console.log(`  FAIL ${label}\n       ${(e as Error).message}`);
  }
}
const eq = (a: unknown, b: unknown, what = 'value') => {
  if (a !== b) throw new Error(`${what}: expected ${String(b)}, got ${String(a)}`);
};
// Passes only if the call is refused with a permission/validation style error (not a crash or a typo).
const denied = async (p: Promise<unknown>, what: string) => {
  try {
    await p;
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (/permission-denied|failed-precondition|unauthenticated|not-found|already-exists|invalid-argument/.test(code)) return;
    throw new Error(`${what}: failed for the wrong reason (${code} ${(e as Error).message})`);
  }
  throw new Error(`${what}: should have been refused but succeeded`);
};

// The Functions emulator starts a fresh worker the first time each function is called. On slow disks that
// first call can time out, so warm every function up (unauthenticated, expected to be refused) before testing.
const FUNCTIONS = ['registerAccount', 'reviewOrg', 'createDriver', 'submitReport', 'requestMechanic', 'cancelRequest', 'respondToRequest', 'updateJob', 'submitInvoice', 'approveInvoice', 'markSettlementPaid'];
async function warmUp() {
  const s = session('warm');
  for (const fn of FUNCTIONS) {
    for (let i = 0; i < 4; i++) {
      try {
        await httpsCallable(getFunctions(s.auth.app, 'africa-south1'), fn, { timeout: 60000 })({});
        break;
      } catch (e) {
        if ((e as { code?: string }).code === 'functions/unauthenticated') break;
        if (i === 3) throw e;
      }
    }
  }
}

async function main() {
  await seed();
  await warmUp();

  const driver = await session('driver').login(users.driver.email);
  const manager = await session('manager').login(users.manager.email);
  const trojan = await session('trojan').login(users.trojan.email);
  const apex = await session('apex').login(users.apex.email);
  const admin = await session('admin').login(users.admin.email);

  let incident = '';
  let invoiceId = '';
  const activeRepairers = (db: ReturnType<typeof session>['db']) =>
    getDocs(query(collection(db, 'orgs'), where('type', '==', 'repairer'), where('status', '==', 'active')));

  console.log('\nDriver reports a problem');
  await check('driver submits a report', async () => {
    const r = await driver.call<{ id: string }>('submitReport', {
      issue: 'Blowout on rear axle',
      tyres: ['Rear L1'],
      photos: [],
      location: { lat: -26.2, lng: 28.04, address: 'N1 near Midrand' },
    });
    incident = r.id;
    if (!/^TS-\d+$/.test(incident)) throw new Error(`bad id ${incident}`);
  });
  await check('driver can read their own incident', async () => eq((await getDoc(doc(driver.db, `incidents/${incident}`))).get('status'), 'reported', 'status'));
  await check('driver cannot write an incident directly (rules)', () => denied(updateDoc(doc(driver.db, `incidents/${incident}`), { status: 'paid' }), 'client write'));
  await check('driver cannot approve invoices', () => denied(driver.call('approveInvoice'), 'role check'));

  console.log('\nManager picks a mechanic');
  await check('manager sees the incident', async () => {
    const snap = await getDocs(query(collection(manager.db, 'incidents'), where('fleetId', '==', 'brave-logistics')));
    eq(snap.docs.some((d) => d.id === incident), true, 'incident listed');
  });
  await check('manager can list active repairers', async () => eq((await activeRepairers(manager.db)).size, 2, 'repairers'));
  await check('manager requests Trojan', async () => {
    await manager.call('requestMechanic', { mechanicId: 'trojan-mechanics' });
    eq((await getDoc(doc(manager.db, `incidents/${incident}`))).get('status'), 'matching', 'status');
  });
  await check('Apex cannot see the incident (rules)', () => denied(getDoc(doc(apex.db, `incidents/${incident}`)), 'cross-org read'));
  await check('Apex cannot accept a request meant for Trojan', () => denied(apex.call('respondToRequest', { incidentId: incident, accept: true }), 'wrong mechanic'));
  await check('Trojan sees the request', async () => eq((await getDoc(doc(trojan.db, `incidents/${incident}`))).exists(), true, 'readable'));
  // The exact queries the mechanic app screens run.
  await check('Trojan call-out list query is allowed by the rules', async () => {
    const snap = await getDocs(query(collection(trojan.db, 'incidents'), where('requestedMechanicId', '==', 'trojan-mechanics')));
    eq(snap.docs.some((d) => d.id === incident && d.get('status') === 'matching'), true, 'call-out listed');
  });
  await check('Apex call-out list is empty', async () => eq((await getDocs(query(collection(apex.db, 'incidents'), where('requestedMechanicId', '==', 'apex-mechanics')))).size, 0, 'size'));

  console.log('\nMechanic runs the job');
  await check('Trojan accepts', async () => {
    await trojan.call('respondToRequest', { incidentId: incident, accept: true, etaMin: 25 });
    eq((await getDoc(doc(trojan.db, `incidents/${incident}`))).get('status'), 'assigned', 'status');
  });
  await check('cannot skip straight to completed', () => denied(trojan.call('updateJob', { incidentId: incident, status: 'completed' }), 'state machine'));
  await check('cannot invoice before the job is done', () =>
    denied(trojan.call('submitInvoice', { incidentId: incident, lines: [{ title: 'Tyre', amount: 100 }] }), 'early invoice'),
  );
  await check('Trojan active-job query is allowed by the rules', async () => {
    const snap = await getDocs(query(collection(trojan.db, 'incidents'), where('mechanicId', '==', 'trojan-mechanics')));
    eq(snap.docs.some((d) => d.id === incident), true, 'job listed');
  });
  for (const s of ['enroute', 'onsite', 'completed']) {
    await check(`job moves to ${s}`, async () => {
      await trojan.call('updateJob', { incidentId: incident, status: s });
      eq((await getDoc(doc(trojan.db, `incidents/${incident}`))).get('status'), s, 'status');
    });
  }

  console.log('\nInvoice, fee and payout');
  await check('R1000 subtotal → VAT 15% = R150, total R1150, fee 8% = R80, net R920', async () => {
    const r = await trojan.call<{ invoiceId: string }>('submitInvoice', {
      incidentId: incident,
      lines: [
        { title: 'Tyre 315/80', sub: 'Supply and fit', amount: 800 },
        { title: 'Call-out', sub: '', amount: 200 },
      ],
    });
    invoiceId = r.invoiceId;
    const inv = (await getDoc(doc(trojan.db, `invoices/${invoiceId}`))).data()!;
    eq(inv.subtotal, 1000, 'subtotal');
    eq(inv.vat, 150, 'vat');
    eq(inv.total, 1150, 'total');
    eq(inv.fee, 80, 'fee');
    eq(inv.net, 920, 'net');
  });
  await check('invoice carries the fleet name for the mechanic app', async () => eq((await getDoc(doc(trojan.db, `invoices/${invoiceId}`))).get('fleetName'), 'Brave Logistics', 'fleetName'));
  await check('Trojan lists their invoices', async () => eq((await getDocs(query(collection(trojan.db, 'invoices'), where('repairerId', '==', 'trojan-mechanics')))).size, 1, 'invoices'));
  await check('Trojan cannot edit the invoice (rules)', () => denied(updateDoc(doc(trojan.db, `invoices/${invoiceId}`), { net: 1000 }), 'tamper'));
  await check('Trojan cannot approve their own invoice', () => denied(trojan.call('approveInvoice', { invoiceId }), 'role check'));
  await check('manager approves the invoice', async () => {
    await manager.call('approveInvoice');
    eq((await getDoc(doc(manager.db, `invoices/${invoiceId}`))).get('status'), 'paid', 'invoice');
    eq((await getDoc(doc(manager.db, `incidents/${incident}`))).get('status'), 'paid', 'incident');
  });
  await check('double approval is refused', () => denied(manager.call('approveInvoice', { invoiceId }), 'double pay'));
  await check('Trojan has a R920 payout waiting', async () => {
    const snap = await getDocs(query(collection(trojan.db, 'settlements'), where('repairerId', '==', 'trojan-mechanics')));
    eq(snap.size, 1, 'settlements');
    eq(snap.docs[0].get('net'), 920, 'net');
    eq(snap.docs[0].get('status'), 'pending', 'status');
  });
  await check('Apex cannot see Trojan payouts', async () => {
    eq((await getDocs(query(collection(apex.db, 'settlements'), where('repairerId', '==', 'apex-mechanics')))).size, 0, 'own settlements');
    await denied(getDocs(collection(apex.db, 'settlements')), 'unfiltered list');
  });
  await check('owner marks the payout released', async () => {
    const snap = await getDocs(collection(admin.db, 'settlements'));
    await admin.call('markSettlementPaid', { settlementId: snap.docs[0].id });
    eq((await getDoc(snap.docs[0].ref)).get('status'), 'paid', 'status');
  });

  console.log('\nOwner dashboard reads');
  await check('owner can list every collection the dashboards subscribe to', async () => {
    for (const c of ['orgs', 'incidents', 'invoices', 'settlements']) {
      const snap = await getDocs(collection(admin.db, c));
      if (snap.empty) throw new Error(c + ' came back empty');
    }
    eq((await getDocs(collection(admin.db, 'orgs/brave-logistics/trucks'))).size >= 1, true, 'trucks');
    eq((await getDocs(collection(admin.db, 'orgs/brave-logistics/drivers'))).size >= 1, true, 'drivers');
  });
  await check('a manager cannot list every incident on the platform', () => denied(getDocs(collection(manager.db, 'incidents')), 'unfiltered list'));

  console.log('\nOwner settings');
  await check('everyone signed in can read settings', async () => eq((await getDoc(doc(driver.db, 'settings/platform'))).get('feePct'), 8, 'feePct'));
  await check('a manager cannot change the fee', () => denied(updateDoc(doc(manager.db, 'settings/platform'), { feePct: 0 }), 'settings write'));
  await check('the owner can change the fee', async () => {
    await updateDoc(doc(admin.db, 'settings/platform'), { feePct: 10 });
    await updateDoc(doc(admin.db, 'settings/platform'), { feePct: 8 });
  });

  console.log('\nSign-up and approval');
  const newMech = session('newmech');
  let newOrg = '';
  await check('a new mechanic can sign up and starts pending', async () => {
    await createUserWithEmailAndPassword(newMech.auth, 'new@speedytyres.demo', DEMO_PASSWORD);
    const r = await newMech.call<{ orgId: string; status: string }>('registerAccount', {
      kind: 'repairer',
      business: 'Speedy Tyres',
      contact: 'Sipho',
      phone: '+27 82 000 0000',
      area: 'Midrand',
      services: ['Puncture repair'],
    });
    newOrg = r.orgId;
    eq(r.status, 'pending', 'status');
    await newMech.auth.currentUser!.getIdToken(true);
    eq((await newMech.auth.currentUser!.getIdTokenResult()).claims.role, 'repairer', 'claim');
  });
  await check('pending mechanics are hidden from fleets', async () => eq((await activeRepairers(manager.db)).docs.some((d) => d.id === newOrg), false, 'hidden'));
  await check('a pending mechanic cannot be requested', async () => {
    await driver.call('submitReport', { issue: 'Slow puncture' });
    await denied(manager.call('requestMechanic', { mechanicId: newOrg }), 'pending mechanic');
  });
  await check('the same login cannot register twice', () => denied(newMech.call('registerAccount', { kind: 'fleet', business: 'X', contact: 'Y', phone: '1' }), 'duplicate'));
  await check('only the owner can approve', async () => {
    await denied(manager.call('reviewOrg', { orgId: newOrg, status: 'active' }), 'manager approving');
    await admin.call('reviewOrg', { orgId: newOrg, status: 'active' });
    eq((await activeRepairers(manager.db)).size, 3, 'repairers after approval');
  });

  console.log('\nFleet management');
  await check('manager creates a driver, who can then sign in', async () => {
    const r = await manager.call<{ email: string; tempPassword: string }>('createDriver', { name: 'Thabo', phone: '+27 71 555 0101' });
    const d = await session('thabo').login(r.email, r.tempPassword);
    eq((await d.auth.currentUser!.getIdTokenResult()).claims.role, 'driver', 'claim');
  });
  await check('turning reporting off for a driver is enforced', async () => {
    const snap = await getDocs(collection(manager.db, 'orgs/brave-logistics/drivers'));
    const brave = snap.docs.find((d) => d.get('name') === 'Brave Driver')!;
    await updateDoc(brave.ref, { canReport: false });
    await denied(driver.call('submitReport', { issue: 'Another one' }), 'canReport=false');
    await updateDoc(brave.ref, { canReport: true });
  });
  await check('manager cannot edit other driver fields', async () => {
    const snap = await getDocs(collection(manager.db, 'orgs/brave-logistics/drivers'));
    await denied(updateDoc(snap.docs[0].ref, { name: 'Hacked' }), 'driver field');
  });
  await check('a driver cannot add trucks', () => denied(setDoc(doc(driver.db, 'orgs/brave-logistics/trucks/XX 1'), { reg: 'XX 1', model: 'x' }), 'driver truck write'));
  await check('manager adds a truck', () =>
    setDoc(doc(manager.db, 'orgs/brave-logistics/trucks/BR 002-GP'), { reg: 'BR 002-GP', model: 'Scania R450', tyres: '315/80 R22.5', wheels: 10, driver: 'Unassigned', status: 'In depot' }),
  );
  await check('signed-out users read and write nothing', async () => {
    const anon = session('anon');
    await denied(getDoc(doc(anon.db, 'settings/platform')), 'anon read');
    await denied(addDoc(collection(anon.db, 'incidents'), { x: 1 }), 'anon write');
  });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    failures.forEach((f) => console.log(` - ${f}`));
    process.exitCode = 1;
  }
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
