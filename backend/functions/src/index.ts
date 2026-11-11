import { onCall, Sentry } from './sentry.js'; // must stay first: initialises Sentry
import { createHash, randomInt } from 'node:crypto';
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

// ---------------------------------------------------------------------------------------------------
// notifications: one inbox record per person (read by the app) plus a push message to their phones
// ---------------------------------------------------------------------------------------------------

const pushDocId = (token: string) => createHash('sha256').update(token).digest('hex');

type PushMessage = { to: string; title: string; body: string; sound: 'default'; channelId: 'default'; priority: 'high' };

/** Sends through Expo's push service (which relays to Google's FCM). Never throws: an alert must not fail a job. */
async function sendPush(tokens: string[], title: string, body: string) {
  if (!tokens.length) return;
  try {
    for (let i = 0; i < tokens.length; i += 100) {
      const chunk = tokens.slice(i, i + 100);
      const messages: PushMessage[] = chunk.map((to) => ({ to, title, body, sound: 'default', channelId: 'default', priority: 'high' }));
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(5000),
      });
      const json = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
      // Forget phones that have uninstalled the app or turned notifications off for good.
      await Promise.all(
        (json.data ?? []).map((t, n) =>
          t.status === 'error' && t.details?.error === 'DeviceNotRegistered' ? db.doc(`pushTokens/${pushDocId(chunk[n])}`).delete() : null,
        ),
      );
    }
  } catch (e) {
    Sentry.captureException(e);
  }
}

async function tokensForUids(uids: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < uids.length; i += 30) {
    const snap = await db.collection('pushTokens').where('uid', 'in', uids.slice(i, i + 30)).get();
    snap.docs.forEach((d) => out.push(d.get('token') as string));
  }
  return out;
}

/**
 * Tells people at a company. With `uid` it goes to that one person; with `role` to everyone in the company who has
 * that role; with neither, to everyone in the company. Each person gets an inbox record and a push message.
 */
async function notify(orgId: string, title: string, body: string, role?: Role, detail = '', uid?: string) {
  try {
    let uids: string[];
    if (uid) uids = [uid];
    else {
      const users = await db.collection('users').where('orgId', '==', orgId).get();
      uids = users.docs.filter((d) => !role || d.get('role') === role).map((d) => d.id);
    }
    if (!uids.length) return;
    const batch = db.batch();
    uids.forEach((u) => batch.set(db.collection('notices').doc(), { uid: u, orgId, title, body, detail, createdAt: FieldValue.serverTimestamp() }));
    await batch.commit();
    await sendPush(await tokensForUids(uids), title, body);
  } catch (e) {
    Sentry.captureException(e);
  }
}

/** Tells the platform owner (push only; the owner works in the web dashboard). */
async function notifyOwners(title: string, body: string) {
  try {
    const snap = await db.collection('pushTokens').where('role', '==', 'admin').get();
    await sendPush(snap.docs.map((d) => d.get('token') as string), title, body);
  } catch (e) {
    Sentry.captureException(e);
  }
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
  await notifyOwners('New company to review', `${business} (${kind === 'fleet' ? 'fleet company' : 'mechanic'}) wants to join Tsela Assist.`);
  return { orgId: orgRef.id, role, status: 'pending' };
});

/**
 * Saves this phone's push token so it can receive alerts while the app is closed. Called by the app after sign-in.
 * One record per phone; signing in as someone else on the same phone moves it to the new person.
 */
export const registerPushToken = onCall(async (req) => {
  const me = caller(req, ['admin', 'manager', 'driver', 'repairer']);
  const token = str(req.data?.token, 'token', 300);
  if (!/^Expo(nent)?PushToken\[.+\]$/.test(token)) throw new HttpsError('invalid-argument', 'That is not a push token.');
  const platform = req.data?.platform === 'ios' ? 'ios' : 'android';
  await db.doc(`pushTokens/${pushDocId(token)}`).set({ token, uid: me.uid, orgId: me.orgId, role: me.role, platform, updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

/** Called on sign-out so the next person on this phone does not get the previous person's alerts. */
export const removePushToken = onCall(async (req) => {
  const me = caller(req, ['admin', 'manager', 'driver', 'repairer']);
  const token = str(req.data?.token, 'token', 300);
  const ref = db.doc(`pushTokens/${pushDocId(token)}`);
  const snap = await ref.get();
  if (snap.exists && snap.get('uid') === me.uid) await ref.delete();
  return { ok: true };
});

const SURVEY_NAMES: Record<string, string> = { merchants: 'merchant', customers: 'customer and fleet' };

/**
 * Public survey form on the website (no sign-in). Saves the answers plus the person's contact details into
 * `surveys` for the owner to follow up in the dashboard. Input is validated and capped; one network address
 * can send at most 20 a hour.
 */
export const submitSurvey = onCall(async (req) => {
  const d = (req.data ?? {}) as Record<string, unknown>;
  const survey = typeof d.survey === 'string' ? d.survey : '';
  if (!SURVEY_NAMES[survey]) throw new HttpsError('invalid-argument', 'Unknown survey.');

  const c = (d.contact ?? {}) as Record<string, unknown>;
  const name = str(c.name, 'Your name', 100);
  const phone = str(c.phone, 'Your phone number', 30);
  if (phone.replace(/\D/g, '').length < 9) throw new HttpsError('invalid-argument', 'Enter a valid phone number.');
  const email = typeof c.email === 'string' ? c.email.trim().slice(0, 150) : '';
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpsError('invalid-argument', 'That email address is not valid.');
  const business = typeof c.business === 'string' ? c.business.trim().slice(0, 150) : '';
  if (survey === 'merchants' && !business) throw new HttpsError('invalid-argument', 'Business name is required.');
  if (c.consent !== true) throw new HttpsError('invalid-argument', 'Please agree to be contacted.');

  const raw = (d.answers ?? {}) as Record<string, unknown>;
  const answers: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(raw).slice(0, 20)) {
    if (!/^[a-z_]{1,40}$/.test(k)) continue;
    if (typeof v === 'string') answers[k] = v.trim().slice(0, 2000);
    else if (Array.isArray(v)) answers[k] = v.filter((x): x is string => typeof x === 'string').slice(0, 20).map((x) => x.slice(0, 200));
  }
  if (!Object.keys(answers).length) throw new HttpsError('invalid-argument', 'Please answer the questions.');

  const forwarded = String(req.rawRequest.headers['x-forwarded-for'] ?? req.rawRequest.ip ?? '').split(',')[0].trim();
  const ipHash = createHash('sha256').update(forwarded).digest('hex');
  const since = Date.now() - 60 * 60 * 1000;
  const recent = await db.collection('surveys').where('ipHash', '==', ipHash).get();
  const lately = recent.docs.filter((x) => ((x.get('createdAt') as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0) > since);
  if (lately.length >= 20) throw new HttpsError('resource-exhausted', 'Too many responses from this connection. Try again later.');

  await db.collection('surveys').add({
    survey,
    name,
    phone,
    email,
    business,
    answers,
    status: 'new',
    note: '',
    ipHash,
    createdAt: FieldValue.serverTimestamp(),
  });
  await notifyOwners('New survey response', `${name}${business ? ` (${business})` : ''} completed the ${SURVEY_NAMES[survey]} survey.`);
  return { ok: true };
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
  if (status === 'suspended') await notify(orgId, 'Account suspended', 'Your Tsela Assist account has been suspended. Contact support.');
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
  const was = (await db.doc(`incidents/${incidentId}`).get()).get('requestedMechanicId') as string | null;
  await db.doc(`incidents/${incidentId}`).update({ status: 'reported', requestedMechanicId: null, updatedAt: FieldValue.serverTimestamp() });
  if (was) await notify(was, 'Request withdrawn', `The fleet withdrew call-out ${incidentId}.`, 'repairer');
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
  await notify(fleetId, accept ? 'Mechanic accepted' : 'Request declined', `${incidentId} was ${accept ? 'accepted' : 'declined'}.`, 'manager');
  if (accept) {
    const inc = (await ref.get()).data();
    if (inc?.driverUid) await notify(fleetId, 'Mechanic assigned', `${inc.mechanicName ?? 'A mechanic'} accepted your report ${incidentId}.`, 'driver', '', inc.driverUid as string);
  }
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
  // The driver follows the same progress: on the way, arrived, finished.
  const driverUid = (await ref.get()).get('driverUid') as string | undefined;
  const say = ({
    enroute: ['Mechanic on the way', 'Your mechanic is heading to you.'],
    onsite: ['Mechanic has arrived', 'Your mechanic is with the truck.'],
    completed: ['Repair finished', 'The repair is done.'],
  } as Record<string, string[]>)[to];
  if (driverUid && say) await notify(fleetId, say[0], `${say[1]} (${incidentId})`, 'driver', '', driverUid);
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
  const ref = db.doc(`settlements/${id}`);
  const repairerId = (await ref.get()).get('repairerId') as string | undefined;
  await ref.update({ status: 'paid', paidAt: FieldValue.serverTimestamp() });
  if (repairerId) await notify(repairerId, 'Payout released', 'Tsela Assist has released a payout to you.', 'repairer');
  return { ok: true };
});
