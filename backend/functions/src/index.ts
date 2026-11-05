import { onCall } from './sentry.js'; // must stay first: initialises Sentry
import { randomInt } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type Transaction } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

// Region is shared with the apps (see app/src/api/firebaseApp.ts). South Africa, close to the fleets.
setGlobalOptions({ region: 'africa-south1', maxInstances: 10 });

initializeApp();
const db = getFirestore();
const auth = getAuth();

export type Role = 'admin' | 'manager' | 'driver' | 'repairer';

// ---------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------

type Caller = { uid: string; role: Role; orgId: string };

function caller(req: CallableRequest, allowed: Role[]): Caller {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  const role = req.auth.token.role as Role | undefined;
  const orgId = req.auth.token.orgId as string | undefined;
  if (!role || !allowed.includes(role)) throw new HttpsError('permission-denied', 'Your account cannot do that.');
  if (role !== 'admin' && !orgId) throw new HttpsError('permission-denied', 'Your account is not linked to a company.');
  return { uid: req.auth.uid, role, orgId: orgId ?? '' };
}

const str = (v: unknown, field: string, max = 200): string => {
  if (typeof v !== 'string' || !v.trim()) throw new HttpsError('invalid-argument', `${field} is required.`);
  return v.trim().slice(0, max);
};
const money = (n: number) => Math.round(n * 100) / 100;

async function requireActiveOrg(orgId: string) {
  const snap = await db.doc(`orgs/${orgId}`).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Company not found.');
  if (snap.get('status') !== 'active') {
    throw new HttpsError('failed-precondition', 'Your company is not approved yet. Tsela Assist is still reviewing it.');
  }
  return snap.data()!;
}

async function notify(orgId: string, title: string, body: string, role?: Role, detail = '') {
  await db.collection('notices').add({ orgId, role: role ?? null, title, body, detail, createdAt: FieldValue.serverTimestamp() });
}

async function nextIncidentId(tx: Transaction): Promise<string> {
  const ref = db.doc('meta/counters');
  const snap = await tx.get(ref);
  const n = ((snap.get('incident') as number | undefined) ?? 8500) + 1;
  tx.set(ref, { incident: n }, { merge: true });
  return `TS-${n}`;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------------------------------------------------------------------------------------------------
// accounts
// ---------------------------------------------------------------------------------------------------

/**
 * Sign-up for a company (fleet) or a mechanic business (repairer). The app creates the Firebase login
 * first, then calls this. The org starts as 'pending' until the owner approves it in the web dashboard.
 */
export const registerAccount = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Create your login first.');
  if (req.auth.token.role) throw new HttpsError('already-exists', 'This login already has an account.');

  const d = (req.data ?? {}) as Record<string, unknown>;
  const kind = d.kind;
  if (kind !== 'fleet' && kind !== 'repairer') throw new HttpsError('invalid-argument', 'kind must be fleet or repairer.');

  const business = str(d.business, 'Business name');
  const contact = str(d.contact, 'Contact name');
  const phone = str(d.phone, 'Phone', 30);
  const role: Role = kind === 'fleet' ? 'manager' : 'repairer';

  const orgRef = db.collection('orgs').doc(`${slug(business)}-${req.auth.uid.slice(0, 6).toLowerCase()}`);
  const email = req.auth.token.email ?? '';

  await db.runTransaction(async (tx) => {
    tx.set(orgRef, {
      type: kind,
      name: business,
      status: 'pending',
      contact,
      phone,
      email,
      area: typeof d.area === 'string' ? d.area.slice(0, 200) : '',
      services: Array.isArray(d.services) ? d.services.filter((s) => typeof s === 'string').slice(0, 20) : [],
      fleetSize: typeof d.fleetSize === 'string' ? d.fleetSize : '',
      rating: 0,
      jobs: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.doc(`users/${req.auth!.uid}`), {
      role,
      orgId: orgRef.id,
      name: contact,
      phone,
      email,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await auth.setCustomUserClaims(req.auth.uid, { role, orgId: orgRef.id });
  await notify(orgRef.id, 'Account under review', 'Tsela Assist is checking your details. We will notify you when you are approved.');
  return { orgId: orgRef.id, role, status: 'pending' };
});

/** Owner approves, suspends or re-activates a company or mechanic. */
export const reviewOrg = onCall(async (req) => {
  caller(req, ['admin']);
  const orgId = str(req.data?.orgId, 'orgId');
  const status = req.data?.status;
  if (!['active', 'suspended', 'pending'].includes(status)) throw new HttpsError('invalid-argument', 'Invalid status.');
  const ref = db.doc(`orgs/${orgId}`);
  if (!(await ref.get()).exists) throw new HttpsError('not-found', 'Company not found.');
  await ref.update({ status });
  if (status === 'active') await notify(orgId, 'You are approved', 'Your Tsela Assist account is live.');
  return { ok: true };
});

/**
 * Fleet manager adds a driver. Creates the driver's login and returns a one-time temporary password.
 * Drivers sign in with email or mobile number; a mobile number maps to a generated email address.
 */
export const createDriver = onCall(async (req) => {
  const me = caller(req, ['manager']);
  await requireActiveOrg(me.orgId);
  const name = str(req.data?.name, 'Name', 80);
  const phone = str(req.data?.phone, 'Phone', 30);
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) throw new HttpsError('invalid-argument', 'Enter a valid mobile number.');

  const email = (typeof req.data?.email === 'string' && req.data.email.includes('@') ? req.data.email : `${digits}@drivers.tselaassist.app`).toLowerCase();
  const tempPassword = Array.from({ length: 10 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[randomInt(31)]).join('');

  let uid: string;
  try {
    uid = (await auth.createUser({ email, password: tempPassword, displayName: name })).uid;
  } catch (e) {
    if ((e as { code?: string }).code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'A driver with that phone number or email already exists.');
    }
    throw e;
  }
  await auth.setCustomUserClaims(uid, { role: 'driver', orgId: me.orgId });
  await db.doc(`users/${uid}`).set({ role: 'driver', orgId: me.orgId, name, phone, email, createdAt: FieldValue.serverTimestamp() });
  await db.doc(`orgs/${me.orgId}/drivers/${uid}`).set({ name, phone, email, truckReg: null, canReport: true, createdAt: FieldValue.serverTimestamp() });
  return { uid, email, tempPassword };
});

// ---------------------------------------------------------------------------------------------------
// dispatch lifecycle: reported -> matching -> assigned -> enroute -> onsite -> completed -> invoiced -> paid
// ---------------------------------------------------------------------------------------------------

/** Driver reports a tyre problem. */
export const submitReport = onCall(async (req) => {
  const me = caller(req, ['driver']);
  await requireActiveOrg(me.orgId);
  const driver = await db.doc(`orgs/${me.orgId}/drivers/${me.uid}`).get();
  if (!driver.exists) throw new HttpsError('not-found', 'Driver profile not found.');
  if (driver.get('canReport') === false) throw new HttpsError('permission-denied', 'Your fleet manager has switched reporting off for you.');

  const issue = str(req.data?.issue, 'Issue', 500);
  const tyres = Array.isArray(req.data?.tyres) ? (req.data.tyres as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 24) : [];
  const photos = Array.isArray(req.data?.photos) ? (req.data.photos as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 8) : [];
  const loc = req.data?.location;
  const location =
    loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'
      ? { lat: loc.lat, lng: loc.lng, address: typeof loc.address === 'string' ? loc.address.slice(0, 200) : '' }
      : null;

  const truckReg: string | null = driver.get('truckReg') ?? null;
  const truck = truckReg ? (await db.doc(`orgs/${me.orgId}/trucks/${truckReg}`).get()).data() : null;
  const fleet = (await db.doc(`orgs/${me.orgId}`).get()).data()!;

  const id = await db.runTransaction(async (tx) => {
    const incidentId = await nextIncidentId(tx);
    tx.set(db.doc(`incidents/${incidentId}`), {
      fleetId: me.orgId,
      fleetName: fleet.name,
      driverUid: me.uid,
      driverName: driver.get('name'),
      truckReg,
      truckModel: truck?.model ?? '',
      issue,
      tyres,
      photos,
      location,
      status: 'reported',
      requestedMechanicId: null,
      mechanicId: null,
      mechanicName: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return incidentId;
  });
  await notify(me.orgId, `New report ${id}`, `${driver.get('name')} reported: ${issue}`, 'manager');
  return { id };
});

/** Fleet manager picks a mechanic for an open report (defaults to the newest unassigned one). */
export const requestMechanic = onCall(async (req) => {
  const me = caller(req, ['manager']);
  await requireActiveOrg(me.orgId);
  const mechanicId = str(req.data?.mechanicId, 'mechanicId');
  const mechanic = await db.doc(`orgs/${mechanicId}`).get();
  if (!mechanic.exists || mechanic.get('type') !== 'repairer' || mechanic.get('status') !== 'active') {
    throw new HttpsError('failed-precondition', 'That mechanic is not available.');
  }

  const incidentId = await pickIncident(me.orgId, req.data?.incidentId, ['reported', 'matching']);
  await db.doc(`incidents/${incidentId}`).update({
    status: 'matching',
    requestedMechanicId: mechanicId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await notify(mechanicId, 'New call-out request', `Incident ${incidentId} needs a mechanic.`, 'repairer');
  return { incidentId };
});

export const cancelRequest = onCall(async (req) => {
  const me = caller(req, ['manager']);
  const incidentId = await pickIncident(me.orgId, req.data?.incidentId, ['matching']);
  await db.doc(`incidents/${incidentId}`).update({ status: 'reported', requestedMechanicId: null, updatedAt: FieldValue.serverTimestamp() });
  return { incidentId };
});

async function pickIncident(fleetId: string, explicit: unknown, statuses: string[]): Promise<string> {
  if (typeof explicit === 'string') {
    const snap = await db.doc(`incidents/${explicit}`).get();
    if (!snap.exists || snap.get('fleetId') !== fleetId) throw new HttpsError('not-found', 'Incident not found.');
    if (!statuses.includes(snap.get('status'))) throw new HttpsError('failed-precondition', `Incident is ${snap.get('status')}.`);
    return explicit;
  }
  const open = await db.collection('incidents').where('fleetId', '==', fleetId).get();
  const match = open.docs
    .filter((d) => statuses.includes(d.get('status')))
    .sort((a, b) => b.get('createdAt').toMillis() - a.get('createdAt').toMillis())[0];
  if (!match) throw new HttpsError('failed-precondition', 'There is no open report to do that for.');
  return match.id;
}

/** Mechanic accepts or declines a call-out. */
export const respondToRequest = onCall(async (req) => {
  const me = caller(req, ['repairer']);
  await requireActiveOrg(me.orgId);
  const incidentId = str(req.data?.incidentId, 'incidentId');
  const accept = req.data?.accept === true;
  const ref = db.doc(`incidents/${incidentId}`);

  const fleetId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get('requestedMechanicId') !== me.orgId) throw new HttpsError('not-found', 'Request not found.');
    if (snap.get('status') !== 'matching') throw new HttpsError('failed-precondition', 'This request is no longer open.');
    if (accept) {
      const eta = typeof req.data?.etaMin === 'number' ? Math.max(1, Math.min(600, Math.round(req.data.etaMin))) : null;
      const org = await tx.get(db.doc(`orgs/${me.orgId}`));
      tx.update(ref, {
        status: 'assigned',
        mechanicId: me.orgId,
        mechanicName: org.get('name'),
        etaMin: eta,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.update(ref, { status: 'reported', requestedMechanicId: null, updatedAt: FieldValue.serverTimestamp() });
    }
    return snap.get('fleetId') as string;
  });
  await notify(fleetId, accept ? 'Mechanic on the way' : 'Request declined', `${incidentId} was ${accept ? 'accepted' : 'declined'}.`, 'manager');
  return { ok: true };
});

const NEXT: Record<string, string> = { assigned: 'enroute', enroute: 'onsite', onsite: 'completed' };

/** Mechanic moves the job along: enroute -> onsite -> completed. */
export const updateJob = onCall(async (req) => {
  const me = caller(req, ['repairer']);
  const incidentId = str(req.data?.incidentId, 'incidentId');
  const to = str(req.data?.status, 'status');
  const ref = db.doc(`incidents/${incidentId}`);
  const fleetId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get('mechanicId') !== me.orgId) throw new HttpsError('not-found', 'Job not found.');
    if (NEXT[snap.get('status')] !== to) throw new HttpsError('failed-precondition', `Cannot go from ${snap.get('status')} to ${to}.`);
    tx.update(ref, { status: to, updatedAt: FieldValue.serverTimestamp() });
    return snap.get('fleetId') as string;
  });
  await notify(fleetId, `Job ${incidentId}: ${to}`, `Your mechanic marked ${incidentId} as ${to}.`, 'manager');
  return { ok: true };
});

/**
 * Mechanic attaches "before" or "after" photos to a job they are working on. The app uploads the files to
 * Storage under jobphotos/{orgId}/{incidentId}/ first; this records them on the incident so the fleet manager
 * and the owner can see them. Before photos are taken on site, after photos once the repair is done.
 */
export const addJobPhotos = onCall(async (req) => {
  const me = caller(req, ['repairer']);
  const incidentId = str(req.data?.incidentId, 'incidentId');
  const stage = req.data?.stage;
  if (stage !== 'before' && stage !== 'after') throw new HttpsError('invalid-argument', 'Photo type must be before or after.');
  const marker = encodeURIComponent(`jobphotos/${me.orgId}/${incidentId}/`);
  const photos = (Array.isArray(req.data?.photos) ? (req.data.photos as unknown[]) : [])
    .filter((u): u is string => typeof u === 'string' && u.startsWith('http') && u.includes(marker))
    .slice(0, 8);
  if (!photos.length) throw new HttpsError('invalid-argument', 'Add at least one photo.');

  const field = `${stage}Photos`;
  const ref = db.doc(`incidents/${incidentId}`);
  const fleetId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get('mechanicId') !== me.orgId) throw new HttpsError('not-found', 'Job not found.');
    const status = snap.get('status') as string;
    const allowed = stage === 'before' ? ['onsite'] : ['onsite', 'completed'];
    if (!allowed.includes(status)) {
      throw new HttpsError('failed-precondition', stage === 'before' ? 'Add before photos once you have arrived on site.' : 'Add after photos once you are on site.');
    }
    const existing = (snap.get(field) as string[] | undefined) ?? [];
    if (existing.length + photos.length > 12) throw new HttpsError('failed-precondition', 'That is too many photos for one job.');
    tx.update(ref, { [field]: FieldValue.arrayUnion(...photos), updatedAt: FieldValue.serverTimestamp() });
    return snap.get('fleetId') as string;
  });
  await notify(fleetId, `Job ${incidentId}: ${stage} photos`, `Your mechanic added ${photos.length} ${stage} photo${photos.length > 1 ? 's' : ''} to ${incidentId}.`, 'manager');
  return { ok: true };
});

/** Mechanic saves where their van or workshop is based, so fleet managers can find the closest mechanic. */
export const setBaseLocation = onCall(async (req) => {
  const me = caller(req, ['repairer']);
  const lat = req.data?.lat;
  const lng = req.data?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new HttpsError('invalid-argument', 'That location is not valid.');
  }
  const address = typeof req.data?.address === 'string' ? req.data.address.slice(0, 200) : '';
  await db.doc(`orgs/${me.orgId}`).update({ base: { lat, lng, address }, baseUpdatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

type Line = { title: string; sub: string; amount: number };

/** Mechanic invoices a completed job. Totals, fee and VAT are computed here from the owner's settings. */
export const submitInvoice = onCall(async (req) => {
  const me = caller(req, ['repairer']);
  const incidentId = str(req.data?.incidentId, 'incidentId');
  const rawLines = Array.isArray(req.data?.lines) ? (req.data.lines as Record<string, unknown>[]) : [];
  const lines: Line[] = rawLines.slice(0, 30).map((l) => {
    const amount = Number(l.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new HttpsError('invalid-argument', 'Every line needs an amount above zero.');
    return { title: str(l.title, 'Line title', 120), sub: typeof l.sub === 'string' ? l.sub.slice(0, 200) : '', amount: money(amount) };
  });
  if (!lines.length) throw new HttpsError('invalid-argument', 'Add at least one line.');

  const settings = (await db.doc('settings/platform').get()).data() ?? {};
  const feePct = typeof settings.feePct === 'number' ? settings.feePct : 8;
  const vatPct = typeof settings.vatPct === 'number' ? settings.vatPct : 15;

  const ref = db.doc(`incidents/${incidentId}`);
  const invRef = db.collection('invoices').doc();
  const fleetId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get('mechanicId') !== me.orgId) throw new HttpsError('not-found', 'Job not found.');
    if (snap.get('status') !== 'completed') throw new HttpsError('failed-precondition', 'Finish the job before invoicing.');

    const subtotal = money(lines.reduce((s, l) => s + l.amount, 0));
    const vat = money((subtotal * vatPct) / 100);
    const fee = money((subtotal * feePct) / 100);
    tx.set(invRef, {
      number: `INV-${new Date().getFullYear()}-${incidentId.replace('TS-', '')}`,
      incidentId,
      fleetId: snap.get('fleetId'),
      fleetName: snap.get('fleetName'),
      repairerId: me.orgId,
      repairerName: snap.get('mechanicName'),
      lines,
      subtotal,
      vatPct,
      vat,
      total: money(subtotal + vat), // what the fleet pays
      feePct,
      fee, // Tsela Assist's cut, taken from the ex-VAT subtotal
      net: money(subtotal - fee), // what the mechanic receives
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(ref, { status: 'invoiced', invoiceId: invRef.id, updatedAt: FieldValue.serverTimestamp() });
    return snap.get('fleetId') as string;
  });
  await notify(fleetId, 'Invoice ready', `Invoice for ${incidentId} is waiting for your approval.`, 'manager');
  return { invoiceId: invRef.id };
});

/** Fleet manager approves the invoice: marks it paid and creates the mechanic's payout. */
export const approveInvoice = onCall(async (req) => {
  const me = caller(req, ['manager']);
  const explicit = req.data?.invoiceId;
  let invRef;
  if (typeof explicit === 'string') {
    invRef = db.doc(`invoices/${explicit}`);
  } else {
    const pending = await db.collection('invoices').where('fleetId', '==', me.orgId).where('status', '==', 'pending').limit(1).get();
    if (pending.empty) throw new HttpsError('failed-precondition', 'No invoice is waiting for approval.');
    invRef = pending.docs[0].ref;
  }

  const result = await db.runTransaction(async (tx) => {
    const inv = await tx.get(invRef);
    if (!inv.exists || inv.get('fleetId') !== me.orgId) throw new HttpsError('not-found', 'Invoice not found.');
    if (inv.get('status') !== 'pending') throw new HttpsError('failed-precondition', 'This invoice was already approved.');
    const inc = await tx.get(db.doc(`incidents/${inv.get('incidentId')}`));
    tx.update(invRef, { status: 'paid', paidAt: FieldValue.serverTimestamp() });
    tx.update(inc.ref, { status: 'paid', updatedAt: FieldValue.serverTimestamp() });
    tx.set(db.collection('settlements').doc(), {
      invoiceId: invRef.id,
      incidentId: inc.id,
      repairerId: inv.get('repairerId'),
      fleetId: me.orgId,
      who: inc.get('fleetName'),
      desc: `${inc.id} • ${inc.get('issue')}`,
      gross: inv.get('subtotal'),
      fee: inv.get('fee'),
      net: inv.get('net'),
      status: 'pending', // owner releases payout (EFT) after ePOD; flips to 'paid'
      createdAt: FieldValue.serverTimestamp(),
    });
    return { repairerId: inv.get('repairerId') as string, number: inv.get('number') as string, net: inv.get('net') as number };
  });
  await notify(result.repairerId, 'Invoice approved', `${result.number} was approved. R${result.net.toFixed(2)} is on its way.`, 'repairer');
  return { ok: true };
});

/** Owner marks a payout as released. */
export const markSettlementPaid = onCall(async (req) => {
  caller(req, ['admin']);
  const id = str(req.data?.settlementId, 'settlementId');
  await db.doc(`settlements/${id}`).update({ status: 'paid', paidAt: FieldValue.serverTimestamp() });
  return { ok: true };
});
