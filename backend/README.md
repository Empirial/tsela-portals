# Tsela Assist backend (Firebase)

Auth, Firestore, Storage and Cloud Functions for the mobile app and the owner dashboard.

## Try it locally (no Firebase account needed)

```
cd backend
npm run install:all     # once
npm run emulators       # leave running. Emulator UI: http://localhost:4000
npm run seed            # second terminal: creates the demo users and data
npm run test:backend    # optional: runs the end-to-end test (starts its own emulators)
```

Then copy `app/.env.example` to `app/.env.local` and `web/.env.example` to `web/.env.local`.

Demo logins (password `Demo1234!`):

| Role | Email |
|---|---|
| Owner (web dashboard) | admin@tselaassist.demo |
| Fleet manager | manager@bravelogistics.demo |
| Driver | driver@bravelogistics.demo |
| Mechanic (Trojan) | dispatch@trojanmechanics.demo |
| Mechanic (Apex) | dispatch@apexmechanics.demo |

The emulator data resets every time the emulators stop; run `npm run seed` again.

## How it works

- **Roles** are custom claims on each login: `role` (`admin`, `manager`, `driver`, `repairer`) and `orgId`.
- **Reads** come straight from Firestore; the rules in `firestore.rules` limit everyone to their own company.
- **Writes to jobs and money** only happen in Cloud Functions (`functions/src/index.ts`), never from a device:
  `submitReport`, `requestMechanic`, `cancelRequest`, `respondToRequest`, `updateJob`, `submitInvoice`,
  `approveInvoice`, `markSettlementPaid`, `registerAccount`, `reviewOrg`, `createDriver`.
- Job lifecycle: `reported` → `matching` → `assigned` → `enroute` → `onsite` → `completed` → `invoiced` → `paid`.
- Money: invoice lines are before VAT. VAT and the platform fee are both taken from the ex-VAT subtotal using the
  percentages in `settings/platform` (the owner edits them in the dashboard). The fleet pays subtotal + VAT; the
  mechanic receives subtotal − fee.

## Going live on a real Firebase project

1. Create a project at console.firebase.google.com and upgrade it to the **Blaze** plan (Cloud Functions need it).
2. Turn on **Authentication → Email/Password**, create **Firestore** (location `africa-south1` Johannesburg, production mode)
   and **Storage**.
3. Add a **Web app** to get the config values, and put them in `app/.env.local` and `web/.env.local`
   (see the `.env.example` files; leave `USE_EMULATOR` unset).
4. Put the project id in `.firebaserc` and deploy: `firebase deploy --only firestore,storage,functions`.
5. Create the owner login: add a user in the console, then give them the `admin` claim (needs a service account key,
   kept out of git). Ask for the helper script if you want one.
