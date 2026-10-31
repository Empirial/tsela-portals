// Mock data for the prototype, taken from the Stitch mockups. Replace with API calls later.
import type { Tone } from '../components/ui'

export const GMV_MONTH = 1_842_500

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

export const jobs: Job[] = [
  { id: 'TS-8402', highway: 'N3 EXP', place: 'Mooi River', ago: '14 mins ago', fleet: 'TransLogix Express', vehicle: 'Volvo FH16 6×4', plate: 'CA 849-204', driver: 'Sipho Ndlovu', issue: 'Blowout', axle: 'Steer L1', tyre: '315/80 R22.5 Bridgestone R249', mechanic: 'Apex 24/7 Mobile Tyres', van: 'Van #AP-09 • Pieter Van Wyk', status: 'En route', statusTone: 'blue', gross: 8452.5 },
  { id: 'TS-8405', highway: 'N1 SOUTH', place: 'Colesberg Interchange', ago: '38 mins ago', fleet: 'Cape Agri Hauliers', vehicle: 'Scania R500 Topline', plate: 'CF 120-994', driver: 'Johan Coetzee', issue: 'Puncture strip', axle: 'Trailer T2-Out', tyre: '385/65 R22.5 Super Single', mechanic: 'QuickGrip Heavy Roadside', van: 'Unit #QG-03 • Kabelo Molefe', status: 'On site', statusTone: 'green', gross: 1950 },
  { id: 'TS-8399', highway: 'N4 TOLL', place: 'Middelburg Plaza', ago: '1h 15m ago', fleet: 'Bafokeng Bulk Logistics', vehicle: 'Mercedes Actros 2652', plate: 'NW 441-901', driver: 'Dennis Sithole', issue: 'Dual sidewall cut', axle: 'Drive R2 Dual', tyre: '315/80 R22.5 Continental HDR2', mechanic: 'Highveld Tyres Witbank', van: 'Van #HV-01 • Mokoena', status: 'Fitting', statusTone: 'blue', gross: 9800 },
  { id: 'TS-8391', highway: 'N3 VAN REENEN', place: 'Pass Summit', ago: '2h 40m ago', fleet: 'Unitrans Supply Chain', vehicle: 'MAN TGX 26.540', plate: 'ND 772-108', driver: 'Bongani Zondi', issue: 'Casing delamination', axle: 'Trailer T1-In', tyre: '315/80 R22.5 Bandag Retread', mechanic: 'Drakensberg Breakdowns', van: 'Van #DB-04 • Mark Sterling', status: 'Escrow on hold', statusTone: 'red', gross: 7500 },
  { id: 'TS-8380', highway: 'N1 POLOKWANE', place: 'Carousel Toll', ago: '5h 22m ago', fleet: 'Cargo Carriers SA', vehicle: 'Freightliner Argosy', plate: 'DZ 881-GP', driver: 'Mandla Khumalo', issue: 'Valve stem shear', axle: 'Drive L1-Out', tyre: '315/80 R22.5 Dunlop SP571', mechanic: 'Bela-Bela Fleet Wheels', van: 'Van #BB-02 • Anton Grobbelaar', status: 'Bank cleared', statusTone: 'neutral', gross: 4200 },
]

export type Mechanic = {
  initials: string
  name: string
  base: string
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
  { initials: 'AP', name: 'Apex 24/7 Mobile Truck Mechanics', base: 'Kempton Park Base • Ekurhuleni East, GP', cipc: '2018/482019/07', vans: 6, radius: '50km N3 Corridor', rating: 4.9, rigs: 184, badges: ['SABS Certified', 'SARS VAT', 'Safety Flares'], bank: 'First National Bank •••• 9204', state: 'Active' },
  { initials: 'KR', name: 'Karoo Roadside Rescue', base: 'Beaufort West Depot • Karoo District, WC', cipc: '2021/804322/07', vans: 3, radius: '40km N1 Corridor', rating: null, rigs: 0, badges: ['SABS Audit Req.', 'SARS VAT OK'], bank: 'Standard Bank SA •••• 5511', state: 'Pending' },
  { initials: 'QG', name: 'QuickGrip Tyre Services', base: 'Pinetown Logistics Park • Durban, KZN', cipc: '2016/092144/07', vans: 9, radius: '75km N3 Hillcrest–Harrismith', rating: 4.8, rigs: 342, badges: ['SABS Certified', 'SARS VAT', 'Flare Squad'], bank: 'Nedbank Corporate •••• 4018', state: 'Active' },
  { initials: 'PF', name: 'ProFit Commercial Mobile', base: 'Middelburg Rail Hub • Mpumalanga, MP', cipc: '2017/311902/07', vans: 2, radius: 'Disabled (N4 Corridor)', rating: 3.6, rigs: 51, badges: ['SABS Lapsed', 'SARS VAT OK'], bank: 'Absa Bank Ltd •••• 8820', state: 'Sanctioned', note: 'Incident: uncertified highway rim inflation' },
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
  { name: 'TransLogix Logistics', contact: 'David Khumalo • Fleet Ops', rigs: 24, drivers: 31, plan: 'Fleet SaaS Pro', state: 'Active', credit: 'R 250,000' },
  { name: 'Cape Agri Hauliers', contact: 'Johan Coetzee', rigs: 18, drivers: 22, plan: 'Fleet SaaS Standard', state: 'Active', credit: 'R 120,000' },
  { name: 'Trans-Cape Freight Logix', contact: 'Nadia Peters', rigs: 140, drivers: 168, plan: 'Fleet SaaS Enterprise', state: 'Active', credit: 'R 250,000' },
  { name: 'Harrismith Bulk Carrier Co', contact: 'Thabo Mokoena', rigs: 65, drivers: 70, plan: 'Fleet SaaS Pro', state: 'Active', credit: 'Escrow auto-replenish' },
  { name: 'Bafokeng Bulk Logistics', contact: 'Dennis Sithole', rigs: 12, drivers: 14, plan: 'Fleet SaaS Standard', state: 'Pending KYC', credit: 'Not set' },
  { name: 'Unitrans Supply Chain', contact: 'Bongani Zondi', rigs: 30, drivers: 36, plan: 'Fleet SaaS Pro', state: 'Suspended', credit: 'Frozen' },
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
  'Apex 24/7 Mobile Truck Mechanics': { contact: 'Pieter Van Wyk • Owner', phone: '+27 11 000 1001', email: 'dispatch@apex247.example', vatNo: '4210 000 101', since: '15 Jan 2026', services: ['Puncture repair', 'Blowout / tyre fitting', 'Wheel balancing'] },
  'Karoo Roadside Rescue': { contact: 'Kabelo Molefe • Owner', phone: '+27 23 000 1002', email: 'help@karooroadside.example', vatNo: '4320 000 102', since: '24 Oct 2026', services: ['Puncture repair', 'Tyre change'] },
  'QuickGrip Tyre Services': { contact: 'Mark Sterling • Operations', phone: '+27 31 000 1003', email: 'ops@quickgrip.example', vatNo: '4430 000 103', since: '03 Feb 2026', services: ['Puncture repair', 'Blowout / tyre fitting', 'Wheel / rim damage', 'Valve & TPMS'] },
  'ProFit Commercial Mobile': { contact: 'Anton Grobbelaar • Owner', phone: '+27 13 000 1004', email: 'info@profit.example', vatNo: '4540 000 104', since: '09 Mar 2026', services: ['Tyre change', 'Wheel balancing'] },
}

export type MechanicVan = { unit: string; technician: string; state: 'Available' | 'On a job' | 'Offline' }

// Sample vans: a mechanic's real count is `vans` on its record.
export const mechanicVans: Record<string, MechanicVan[]> = {
  'Apex 24/7 Mobile Truck Mechanics': [
    { unit: 'Van #AP-09', technician: 'Pieter Van Wyk', state: 'On a job' },
    { unit: 'Van #AP-04', technician: 'Sibusiso Dube', state: 'Available' },
    { unit: 'Van #AP-02', technician: 'Riaan Botha', state: 'Offline' },
  ],
  'Karoo Roadside Rescue': [{ unit: 'Van #KR-01', technician: 'Kabelo Molefe', state: 'Offline' }],
  'QuickGrip Tyre Services': [
    { unit: 'Unit #QG-03', technician: 'Kabelo Molefe', state: 'On a job' },
    { unit: 'Unit #QG-07', technician: 'Themba Nkosi', state: 'Available' },
  ],
  'ProFit Commercial Mobile': [{ unit: 'Van #PF-01', technician: 'Anton Grobbelaar', state: 'Offline' }],
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
  'TransLogix Logistics': { regNo: '2015/204118/07', vatNo: '4410 000 001', address: 'Unit 4, Montague Gardens, Cape Town, WC', phone: '+27 21 000 0001', email: 'ops@translogix.example', since: '12 Mar 2026' },
  'Cape Agri Hauliers': { regNo: '2012/031775/07', vatNo: '4520 000 002', address: '18 Voortrekker Rd, Paarl, WC', phone: '+27 21 000 0002', email: 'fleet@capeagri.example', since: '28 Apr 2026' },
  'Trans-Cape Freight Logix': { regNo: '2009/118206/07', vatNo: '4630 000 003', address: 'Freight Park, Epping Industria, Cape Town, WC', phone: '+27 21 000 0003', email: 'dispatch@transcape.example', since: '02 Feb 2026' },
  'Harrismith Bulk Carrier Co': { regNo: '2017/552901/07', vatNo: '4740 000 004', address: '9 Industrial Rd, Harrismith, FS', phone: '+27 58 000 0004', email: 'ops@harrismithbulk.example', since: '19 May 2026' },
  'Bafokeng Bulk Logistics': { regNo: '2024/190442/07', vatNo: 'Pending', address: 'Plot 22, Rustenburg Industrial, NW', phone: '+27 14 000 0005', email: 'info@bafokengbulk.example', since: '21 Oct 2026' },
  'Unitrans Supply Chain': { regNo: '2006/077350/07', vatNo: '4850 000 006', address: '3 Supply Way, Pietermaritzburg, KZN', phone: '+27 33 000 0006', email: 'accounts@unitrans.example', since: '07 Jan 2026' },
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
  { name: 'Sipho Ndlovu', prdp: 'PrDP GP51233', fleet: 'TransLogix Logistics', rig: 'CA 892-411', state: 'Validated' },
  { name: 'Thandi Dlamini', prdp: 'PrDP GP60482', fleet: 'TransLogix Logistics', rig: 'CA 310-557', state: 'Validated' },
  { name: 'David Mare', prdp: 'PrDP WC40115', fleet: 'TransLogix Logistics', rig: 'CA 774-210', state: 'Suspended' },
  { name: 'Johan Coetzee', prdp: 'PrDP WC27719', fleet: 'Cape Agri Hauliers', rig: 'CF 120-994', state: 'Validated' },
  { name: 'Pieter V.', prdp: 'PrDP WC20877', fleet: 'Cape Agri Hauliers', rig: 'CA 612-990', state: 'Pending' },
  { name: 'Jabulani Mthembu', prdp: 'PrDP GP48910', fleet: 'Trans-Cape Freight Logix', rig: 'CA 408-112', state: 'Validated' },
  { name: 'Dirk Kotze', prdp: 'PrDP WC33012', fleet: 'Trans-Cape Freight Logix', rig: 'CA 455-730', state: 'Validated' },
  { name: 'Lindiwe Zulu', prdp: 'PrDP FS18455', fleet: 'Harrismith Bulk Carrier Co', rig: 'FS 220-481', state: 'Validated' },
  { name: 'Dennis Sithole', prdp: 'PrDP NW30871', fleet: 'Bafokeng Bulk Logistics', rig: 'NW 441-901', state: 'Pending' },
  { name: 'Bongani Zondi', prdp: 'PrDP ND42210', fleet: 'Unitrans Supply Chain', rig: 'ND 772-108', state: 'Suspended' },
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
  { plate: 'CA 892-411', vehicle: 'Volvo FH16 6×4', kind: 'Truck tractor', fleet: 'TransLogix Logistics', driver: 'Sipho Ndlovu', state: 'On a job' },
  { plate: 'CA 310-557', vehicle: 'Scania R500 Topline', kind: 'Truck tractor', fleet: 'TransLogix Logistics', driver: 'Thandi Dlamini', state: 'Available' },
  { plate: 'CA 774-210', vehicle: 'Mercedes Actros 2652', kind: 'Reefer', fleet: 'TransLogix Logistics', driver: 'David Mare', state: 'Out of service' },
  { plate: 'CA 561-338', vehicle: 'Interlink trailer set', kind: 'Interlink', fleet: 'TransLogix Logistics', driver: null, state: 'Available' },
  { plate: 'CF 120-994', vehicle: 'Scania R500 Topline', kind: 'Truck tractor', fleet: 'Cape Agri Hauliers', driver: 'Johan Coetzee', state: 'Available' },
  { plate: 'CA 612-990', vehicle: 'MAN TGX 26.540', kind: 'Truck tractor', fleet: 'Cape Agri Hauliers', driver: 'Pieter V.', state: 'Available' },
  { plate: 'CF 933-205', vehicle: 'Tanker trailer', kind: 'Tanker', fleet: 'Cape Agri Hauliers', driver: null, state: 'Available' },
  { plate: 'CA 408-112', vehicle: 'Volvo FH 500', kind: 'Truck tractor', fleet: 'Trans-Cape Freight Logix', driver: 'Jabulani Mthembu', state: 'On a job' },
  { plate: 'CA 455-730', vehicle: 'Freightliner Argosy', kind: 'Truck tractor', fleet: 'Trans-Cape Freight Logix', driver: 'Dirk Kotze', state: 'Available' },
  { plate: 'FS 220-481', vehicle: 'Mercedes Actros 2645', kind: 'Tanker', fleet: 'Harrismith Bulk Carrier Co', driver: 'Lindiwe Zulu', state: 'Available' },
  { plate: 'NW 441-901', vehicle: 'Mercedes Actros 2652', kind: 'Truck tractor', fleet: 'Bafokeng Bulk Logistics', driver: 'Dennis Sithole', state: 'On a job' },
  { plate: 'ND 772-108', vehicle: 'MAN TGX 26.540', kind: 'Truck tractor', fleet: 'Unitrans Supply Chain', driver: 'Bongani Zondi', state: 'Out of service' },
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

export const payouts: Payout[] = [
  { job: 'TSL-8942', where: 'N3 Harrismith • 315/80 Steer', mechanic: 'Midlands Highway Fitment CC', bank: 'FNB Cheque • A/C 6289••••21', fleet: 'TransLogix SA', rig: 'CA 492-811', gross: 9800, signed: true },
  { job: 'TSL-8939', where: 'N1 Colesberg Bypass • Dual Drive Hub', mechanic: 'Karoo Commercial Mobile Tyres', bank: 'Standard Bank • A/C 0021••••94', fleet: 'Cape Agri Bulk Transport', rig: 'CFR 839-012', gross: 16400, signed: true },
  { job: 'TSL-8935', where: 'N4 Middelburg • 385/65 R22.5 Super Single', mechanic: 'Mpumalanga Express Fitment', bank: 'Nedbank • A/C 1198••••30', fleet: 'Highveld Coal Haulers', rig: 'MP 902-119', gross: 11250, signed: false },
  { job: 'TSL-8928', where: 'N2 Pietermaritzburg • Steer Retread Swap', mechanic: 'Durban Port Tyre Services', bank: 'Absa • A/C 4055••••81', fleet: 'Bambanani Express Logistics', rig: 'ND 554-991', gross: 7500, signed: true },
]

export const subscriptions = [
  { fleet: 'TransLogix Logistics', plan: 'Fleet SaaS Pro', rigs: 24, monthly: 18500, renews: '01 Nov 2026', state: 'Active' },
  { fleet: 'Cape Agri Hauliers', plan: 'Fleet SaaS Standard', rigs: 18, monthly: 9800, renews: '08 Nov 2026', state: 'Active' },
  { fleet: 'Trans-Cape Freight Logix', plan: 'Fleet SaaS Enterprise', rigs: 140, monthly: 62000, renews: '15 Nov 2026', state: 'Active' },
  { fleet: 'Bafokeng Bulk Logistics', plan: 'Fleet SaaS Standard', rigs: 12, monthly: 6400, renews: '—', state: 'Trial' },
  { fleet: 'Unitrans Supply Chain', plan: 'Fleet SaaS Pro', rigs: 30, monthly: 21000, renews: 'Payment failed', state: 'Past due' },
]
