// Demo data for the live walkthrough: one fleet (Brave Logistics) and two repairers (Trojan, Apex). Jobs, invoices and payouts start empty. Replace with API calls later.
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
  gross: number
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

export const mechanics: Mechanic[] = [
  { initials: 'TM', name: 'Trojan Mechanics', base: 'Base to be confirmed', location: LOCATION_PENDING, cipc: 'Pending', vans: 1, radius: '50km', rating: null, rigs: 0, badges: [], bank: 'Bank details pending', state: 'Active' },
  { initials: 'AM', name: 'Apex Mechanics', base: 'Base to be confirmed', location: LOCATION_PENDING, cipc: 'Pending', vans: 1, radius: '50km', rating: null, rigs: 0, badges: [], bank: 'Bank details pending', state: 'Active' },
]

export type Fleet = {
  name: string
  contact: string
  rigs: number
  drivers: number
  plan: string
  state: 'Active' | 'Pending KYC' | 'Suspended'
  credit: string
}

export const fleets: Fleet[] = [
  { name: 'Brave Logistics', contact: 'Fleet manager', rigs: 1, drivers: 1, plan: 'Fleet SaaS Pro', state: 'Active', credit: 'Not set' },
]

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

// Sample partner details. All numbers are placeholders.
export const mechanicProfiles: Record<string, MechanicProfile> = {
  'Trojan Mechanics': { contact: 'Dispatch', phone: '+27 00 000 0000', email: 'dispatch@trojanmechanics.demo', vatNo: 'Pending', since: '03 Nov 2026', services: ['Puncture repair', 'Blowout / tyre fitting'] },
  'Apex Mechanics': { contact: 'Dispatch', phone: '+27 00 000 0000', email: 'dispatch@apexmechanics.demo', vatNo: 'Pending', since: '03 Nov 2026', services: ['Puncture repair', 'Blowout / tyre fitting'] },
}

export type MechanicVan = { unit: string; technician: string; state: 'Available' | 'On a job' | 'Offline' }

// Sample vans: a mechanic's real count is `vans` on its record.
export const mechanicVans: Record<string, MechanicVan[]> = {
  'Trojan Mechanics': [{ unit: 'Van #TM-01', technician: 'Technician', state: 'Available' }],
  'Apex Mechanics': [{ unit: 'Van #AM-01', technician: 'Technician', state: 'Available' }],
}

const mechanicDocKinds: [string, string][] = [
  ['CIPC registration certificate', 'cipc-registration.pdf'],
  ['SARS VAT registration', 'sars-vat.pdf'],
  ['SABS technician accreditation', 'sabs-accreditation.pdf'],
  ['Public & roadside liability cover', 'liability-cover.pdf'],
  ['Technician ID copies', 'technician-ids.pdf'],
  ['Bank confirmation letter', 'bank-confirmation.pdf'],
]

// Sample documents: their status follows the partner's account state.
export function mechanicDocs(state: string): FleetDoc[] {
  return mechanicDocKinds.map(([name, file], i) => {
    const uploaded = `${String(5 + i * 2).padStart(2, '0')} ${state === 'Pending' ? 'Oct' : 'Feb'} 2026`
    const size = `${140 + i * 70} KB`
    if (state === 'Pending' && (i === 2 || i === 5)) return { name, file, uploaded, size, state: 'Pending review' }
    if ((state === 'Sanctioned' || state === 'Suspended') && i === 2) return { name, file, uploaded, size, state: 'Rejected' }
    return { name, file, uploaded, size, state: 'Verified' }
  })
}

export const mechanicSlug = (name: string) => fleetSlug(name)

export type FleetProfile = {
  regNo: string
  vatNo: string
  address: string
  phone: string
  email: string
  since: string
}

// Sample company details. All numbers and addresses are placeholders.
export const fleetProfiles: Record<string, FleetProfile> = {
  'Brave Logistics': { regNo: 'Pending', vatNo: 'Pending', address: 'Address to be confirmed', phone: '+27 00 000 0000', email: 'manager@bravelogistics.demo', since: '03 Nov 2026' },
}

export type FleetDoc = {
  name: string
  file: string
  uploaded: string
  size: string
  state: 'Verified' | 'Pending review' | 'Rejected' | 'Not uploaded'
}

const docKinds: [string, string][] = [
  ['CIPC registration certificate', 'cipc-registration.pdf'],
  ['SARS tax clearance certificate', 'sars-tax-clearance.pdf'],
  ['VAT registration', 'vat-registration.pdf'],
  ['Proof of business address', 'proof-of-address.pdf'],
  ['Director ID copy', 'director-id.pdf'],
  ['Fleet vehicle list', 'fleet-vehicle-list.xlsx'],
]

// Sample documents: their status follows the company's account state.
export function fleetDocs(state: string): FleetDoc[] {
  return docKinds.map(([name, file], i) => {
    const uploaded = `${String(3 + i * 2).padStart(2, '0')} ${state === 'Pending KYC' ? 'Oct' : 'Mar'} 2026`
    const size = `${120 + i * 85} KB`
    if (state === 'Pending KYC') {
      if (i === 2) return { name, file: '', uploaded: '—', size: '—', state: 'Not uploaded' }
      return { name, file, uploaded, size, state: i < 2 ? 'Pending review' : 'Verified' }
    }
    if (state === 'Suspended' && i === 1) return { name, file, uploaded, size, state: 'Rejected' }
    return { name, file, uploaded, size, state: 'Verified' }
  })
}

export type Driver = {
  name: string
  prdp: string
  fleet: string
  rig: string
  state: 'Validated' | 'Pending' | 'Suspended'
}

// Sample rows only: a fleet's real counts are on the Fleet record (rigs, drivers).
export const drivers: Driver[] = [
  { name: 'Brave Driver', prdp: 'PrDP pending', fleet: 'Brave Logistics', rig: 'BR 001-GP', state: 'Validated' },
]

export type Truck = {
  plate: string
  vehicle: string
  kind: 'Truck tractor' | 'Tanker' | 'Reefer' | 'Interlink'
  fleet: string
  driver: string | null
  state: 'Available' | 'On a job' | 'Out of service'
}

// Sample rows only: a fleet's real count is the `rigs` number on its Fleet record.
export const trucks: Truck[] = [
  { plate: 'BR 001-GP', vehicle: 'Volvo FH16 6×4', kind: 'Truck tractor', fleet: 'Brave Logistics', driver: 'Brave Driver', state: 'Available' },
]

export type Payout = {
  job: string
  where: string
  mechanic: string
  bank: string
  fleet: string
  rig: string
  gross: number
  signed: boolean
}

export const payouts: Payout[] = []

export const subscriptions = [
  { fleet: 'Brave Logistics', plan: 'Fleet SaaS Pro', rigs: 1, monthly: 0, renews: '—', state: 'Trial' },
]
