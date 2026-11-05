import { collection, onSnapshot, type DocumentData, type Timestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../admin/auth'
import {
  LOCATION_PENDING,
  type Driver,
  type Fleet,
  type FleetProfile,
  type Job,
  type Mechanic,
  type MechanicProfile,
  type Payout,
  type Truck,
} from '../admin/data'
import type { Tone } from '../components/ui'
import { db, functions } from './firebase'

// One place that turns Firestore documents into the shapes the dashboard pages already use.
// The numbers are live (onSnapshot) once the owner is signed in.

export type Subscription = { fleet: string; plan: string; rigs: number; monthly: number; renews: string; state: string }

export type Live = {
  ready: boolean
  jobs: Job[]
  mechanics: Mechanic[]
  fleets: Fleet[]
  drivers: Driver[]
  trucks: Truck[]
  payouts: Payout[]
  subscriptions: Subscription[]
  fleetProfiles: Record<string, FleetProfile>
  mechanicProfiles: Record<string, MechanicProfile>
  /** Gross value (incl. VAT) of every invoice the fleets have paid */
  gmv: number
  /** Approve / suspend a company or mechanic by its display name */
  setOrgState: (name: string, state: string) => Promise<void>
  releasePayout: (settlementIds: string[]) => Promise<void>
}

// What the pages see before sign-in or while the first snapshots load.
const empty: Live = {
  ready: false,
  jobs: [],
  mechanics: [],
  fleets: [],
  drivers: [],
  trucks: [],
  payouts: [],
  subscriptions: [],
  fleetProfiles: {},
  mechanicProfiles: {},
  gmv: 0,
  setOrgState: async () => {},
  releasePayout: async () => {},
}

const Ctx = createContext<Live>(empty)
export const useLive = () => useContext(Ctx)

type Row = DocumentData & { id: string }

function useCollection(path: string, on: boolean): Row[] | null {
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => {
    if (!on) return
    return onSnapshot(
      collection(db, path),
      (snap) => setRows(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      () => setRows([]),
    )
  }, [path, on])
  return on ? rows : null
}

const ms = (t: unknown) => (t && typeof (t as Timestamp).toMillis === 'function' ? (t as Timestamp).toMillis() : 0)
const newest = (a: DocumentData, b: DocumentData) => ms(b.createdAt) - ms(a.createdAt)

function ago(t: unknown): string {
  const m = ms(t)
  if (!m) return 'just now'
  const mins = Math.max(0, Math.round((Date.now() - m) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`
  return `${Math.round(mins / 1440)} d ago`
}

const day = (t: unknown) =>
  ms(t) ? new Date(ms(t)).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const JOB_STATUS: Record<string, [string, Tone]> = {
  reported: ['Awaiting mechanic', 'amber'],
  matching: ['Awaiting acceptance', 'amber'],
  assigned: ['Dispatched', 'blue'],
  enroute: ['En route', 'blue'],
  onsite: ['On site', 'blue'],
  completed: ['Awaiting invoice', 'amber'],
  invoiced: ['Invoiced', 'amber'],
  paid: ['Bank cleared', 'neutral'],
}

const place = (d: DocumentData) =>
  d.location?.address || (d.location ? `${d.location.lat.toFixed(3)}, ${d.location.lng.toFixed(3)}` : 'Location not shared')

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { signedIn } = useAuth()
  const on = signedIn

  const orgs = useCollection('orgs', on)
  const incidents = useCollection('incidents', on)
  const invoices = useCollection('invoices', on)
  const settlements = useCollection('settlements', on)

  // Trucks and drivers live under each fleet, so subscribe per fleet.
  const fleetIds = useMemo(() => (orgs ?? []).filter((o) => o.type === 'fleet').map((o) => o.id), [orgs])
  const fleetKey = fleetIds.join('|')
  const [byFleet, setByFleet] = useState<Record<string, { drivers: Row[]; trucks: Row[] }>>({})
  useEffect(() => {
    if (!on) return
    const unsubs = fleetIds.flatMap((id) =>
      (['drivers', 'trucks'] as const).map((kind) =>
        onSnapshot(
          collection(db, 'orgs', id, kind),
          (snap) =>
            setByFleet((m) => ({
              ...m,
              [id]: { drivers: m[id]?.drivers ?? [], trucks: m[id]?.trucks ?? [], [kind]: snap.docs.map((d) => ({ ...d.data(), id: d.id })) },
            })),
          () => {},
        ),
      ),
    )
    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetKey, on])

  const value = useMemo<Live>(() => {
    if (!on) return empty
    const ready = orgs !== null && incidents !== null && invoices !== null && settlements !== null
    const orgList = orgs ?? []
    const nameOf = new Map(orgList.map((o) => [o.id, o.name as string]))
    const invoiceOf = new Map((invoices ?? []).map((i) => [i.incidentId as string, i]))
    const settlementOf = new Map((settlements ?? []).map((s) => [s.invoiceId as string, s]))

    const jobs: Job[] = [...(incidents ?? [])].sort(newest).map((d) => {
      const [status, statusTone] = JOB_STATUS[d.status] ?? [d.status, 'neutral' as Tone]
      const inv = invoiceOf.get(d.id)
      return {
        id: d.id,
        highway: '',
        place: place(d),
        ago: ago(d.createdAt),
        fleet: d.fleetName,
        vehicle: d.truckModel || 'Truck',
        plate: d.truckReg ?? '—',
        driver: d.driverName,
        issue: d.issue,
        axle: '',
        tyre: (d.tyres as string[] | undefined)?.join(', ') || 'Tyres not specified',
        mechanic: d.mechanicName ?? (d.requestedMechanicId ? `${nameOf.get(d.requestedMechanicId) ?? 'Mechanic'} (requested)` : 'Not assigned'),
        van: '',
        status,
        statusTone,
        photos: { driver: (d.photos as string[] | undefined) ?? [], before: (d.beforePhotos as string[] | undefined) ?? [], after: (d.afterPhotos as string[] | undefined) ?? [] },
        gross: inv?.total ?? 0,
        invoice: inv ? { number: inv.number, subtotal: inv.subtotal, vat: inv.vat, total: inv.total, fee: inv.fee, net: inv.net, feePct: inv.feePct, vatPct: inv.vatPct } : undefined,
      }
    })

    const doneBy = new Map<string, number>()
    for (const i of incidents ?? []) if (i.mechanicId && i.status === 'paid') doneBy.set(i.mechanicId, (doneBy.get(i.mechanicId) ?? 0) + 1)

    const mechanics: Mechanic[] = orgList
      .filter((o) => o.type === 'repairer')
      .sort(newest)
      .map((o) => ({
        id: o.id,
        initials: initials(o.name),
        name: o.name,
        base: o.area || 'Base to be confirmed',
        location: o.area ? { ...LOCATION_PENDING, address: o.area } : LOCATION_PENDING,
        cipc: 'Pending',
        vans: o.vans ?? 1,
        radius: o.radius ?? '—',
        rating: o.rating || null,
        rigs: doneBy.get(o.id) ?? 0,
        badges: [],
        bank: 'Bank details pending',
        state: o.status === 'active' ? 'Active' : o.status === 'suspended' ? 'Suspended' : 'Pending',
      }))

    const drivers: Driver[] = []
    const trucks: Truck[] = []
    const fleets: Fleet[] = orgList
      .filter((o) => o.type === 'fleet')
      .sort(newest)
      .map((o) => {
        const mine = byFleet[o.id] ?? { drivers: [], trucks: [] }
        for (const d of mine.drivers) drivers.push({ name: d.name, prdp: 'PrDP pending', fleet: o.name, rig: d.truckReg ?? '—', state: 'Validated' })
        for (const t of mine.trucks)
          trucks.push({ plate: t.reg, vehicle: t.model, kind: 'Truck tractor', fleet: o.name, driver: t.driver === 'Unassigned' ? null : t.driver, state: t.status === 'Active' ? 'On a job' : 'Available' })
        return {
          id: o.id,
          name: o.name,
          contact: o.contact || 'Fleet manager',
          rigs: mine.trucks.length,
          drivers: mine.drivers.length,
          plan: o.plan ?? 'Fleet SaaS Pro',
          state: o.status === 'active' ? 'Active' : o.status === 'suspended' ? 'Suspended' : 'Pending KYC',
          credit: 'Not set',
        }
      })

    const fleetProfiles: Record<string, FleetProfile> = {}
    const mechanicProfiles: Record<string, MechanicProfile> = {}
    for (const o of orgList) {
      if (o.type === 'fleet')
        fleetProfiles[o.name] = { regNo: 'Pending', vatNo: 'Pending', address: o.area || 'Address to be confirmed', phone: o.phone || '—', email: o.email || '—', since: day(o.createdAt) }
      else
        mechanicProfiles[o.name] = { contact: o.contact || 'Dispatch', phone: o.phone || '—', email: o.email || '—', vatNo: 'Pending', since: day(o.createdAt), services: o.services ?? [] }
    }

    const payouts: Payout[] = [...(invoices ?? [])].sort(newest).map((i) => {
      const inc = (incidents ?? []).find((x) => x.id === i.incidentId)
      const st = settlementOf.get(i.id)
      return {
        job: i.incidentId,
        where: inc ? place(inc) : '',
        mechanic: i.repairerName,
        bank: 'Bank details pending',
        fleet: i.fleetName ?? nameOf.get(i.fleetId) ?? i.fleetId,
        rig: inc?.truckReg ?? '—',
        gross: i.total,
        signed: i.status === 'paid',
        subtotal: i.subtotal,
        vat: i.vat,
        fee: i.fee,
        net: i.net,
        settlementId: st?.id,
        settled: st?.status === 'paid',
      }
    })

    const subscriptions: Subscription[] = fleets.map((f) => ({ fleet: f.name, plan: f.plan, rigs: f.rigs, monthly: 0, renews: '—', state: f.state === 'Active' ? 'Trial' : f.state }))

    const idByName = new Map(orgList.map((o) => [o.name as string, o.id]))
    return {
      ready,
      jobs,
      mechanics,
      fleets,
      drivers,
      trucks,
      payouts,
      subscriptions,
      fleetProfiles,
      mechanicProfiles,
      gmv: (invoices ?? []).filter((i) => i.status === 'paid').reduce((a, i) => a + i.total, 0),
      setOrgState: async (name, state) => {
        const orgId = idByName.get(name)
        if (!orgId) throw new Error('Company not found.')
        const status = state === 'Active' ? 'active' : state.startsWith('Pending') ? 'pending' : 'suspended'
        await httpsCallable(functions, 'reviewOrg')({ orgId, status })
      },
      releasePayout: async (ids) => {
        for (const settlementId of ids) await httpsCallable(functions, 'markSettlementPaid')({ settlementId })
      },
    }
  }, [on, orgs, incidents, invoices, settlements, byFleet])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
