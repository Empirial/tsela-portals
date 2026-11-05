// Types and empty defaults for the owner dashboard. All real data comes from Firestore (see lib/live.tsx).
import type { Tone } from '../components/ui'

export const GMV_MONTH = 0

export type Job = {
  id: string
  highway: string
  place: string
  ago: string
  fleet: string
  vehicle: string
  plate: string
  driver: string
  issue: string
  axle: string
  tyre: string
  mechanic: string
  van: string
  status: string
  statusTone: Tone
  /** Photos for the job: from the driver's report, then the mechanic's before / after shots */
  photos?: { driver: string[]; before: string[]; after: string[] }
  /** Gross including VAT */
  gross: number
  /** Real amounts from the mechanic's invoice, once one exists */
  invoice?: { number: string; subtotal: number; vat: number; total: number; fee: number; net: number; feePct: number; vatPct: number }
}

export const jobs: Job[] = []

export type MechanicLocation = {
  address: string
  city: string
  province: string
  gps: string
}

export const LOCATION_PENDING: MechanicLocation = {
  address: 'Not provided yet',
  city: 'Not provided yet',
  province: 'Not provided yet',
  gps: 'Not provided yet',
}

export type Mechanic = {
  id?: string
  initials: string
  name: string
  base: string
  location: MechanicLocation
  cipc: string
  vans: number
  radius: string
  rating: number | null
  rigs: number
  badges: string[]
  bank: string
  state: 'Active' | 'Pending' | 'Sanctioned' | 'Suspended'
  note?: string
}

export const mechanics: Mechanic[] = []

export type Fleet = {
  id?: string
  name: string
  contact: string
  rigs: number
  drivers: number
  plan: string
  state: 'Active' | 'Pending KYC' | 'Suspended'
  credit: string
}

export const fleets: Fleet[] = []

// Fleets are opened by name in the URL, e.g. /admin/fleets/translogix-logistics
export const fleetSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export type MechanicProfile = {
  contact: string
  phone: string
  email: string
  vatNo: string
  since: string
  services: string[]
}

export const mechanicProfiles: Record<string, MechanicProfile> = {}

export type MechanicVan = { unit: string; technician: string; state: 'Available' | 'On a job' | 'Offline' }

export const mechanicVans: Record<string, MechanicVan[]> = {}

// The ids are the Firestore document ids under orgs/{id}/documents and must match app/src/app/documents.tsx.
export const mechanicDocKinds: DocKind[] = [
  { id: 'cipc', name: 'CIPC company registration' },
  { id: 'vat', name: 'SARS VAT registration letter' },
  { id: 'sabs', name: 'SABS truck repair certificate' },
  { id: 'insurance', name: 'Public & roadside liability insurance' },
  { id: 'technician-ids', name: 'Technician ID copies' },
  { id: 'bank-letter', name: 'Bank confirmation letter' },
]

export const mechanicSlug = (name: string) => fleetSlug(name)

export type FleetProfile = {
  regNo: string
  vatNo: string
  address: string
  phone: string
  email: string
  since: string
}

export const fleetProfiles: Record<string, FleetProfile> = {}

export type DocKind = { id: string; name: string }

export type FleetDoc = {
  name: string
  file: string
  uploaded: string
  size: string
  state: 'Verified' | 'Pending review' | 'Rejected' | 'Not uploaded'
}

export const fleetDocKinds: DocKind[] = [
  { id: 'cipc', name: 'CIPC company registration' },
  { id: 'tax-clearance', name: 'SARS tax clearance certificate' },
  { id: 'vat', name: 'VAT registration' },
  { id: 'address', name: 'Proof of business address' },
  { id: 'director-id', name: 'Director ID copy' },
  { id: 'vehicle-list', name: 'Fleet vehicle list' },
]

export type Driver = {
  name: string
  prdp: string
  fleet: string
  rig: string
  state: 'Validated' | 'Pending' | 'Suspended'
}

export const drivers: Driver[] = []

export type Truck = {
  plate: string
  vehicle: string
  kind: 'Truck tractor' | 'Tanker' | 'Reefer' | 'Interlink'
  fleet: string
  driver: string | null
  state: 'Available' | 'On a job' | 'Out of service'
}

export const trucks: Truck[] = []

export type Payout = {
  job: string
  where: string
  mechanic: string
  bank: string
  fleet: string
  rig: string
  gross: number
  signed: boolean
  /** Real amounts and payout status, when the data is live */
  subtotal?: number
  vat?: number
  fee?: number
  net?: number
  settlementId?: string
  settled?: boolean
}

export const payouts: Payout[] = []

