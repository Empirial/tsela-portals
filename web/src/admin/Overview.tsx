import { Banknote, Landmark, Megaphone, Radar, ShieldAlert, ShieldCheck, Truck, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, PageHeader, Stat, Tabs } from '../components/ui'
import { zar } from '../lib/format'
import { useSettings } from '../lib/settings'
import { GMV_MONTH, jobs } from './data'

const corridors = [
  { id: 'n1', label: 'N1 Western', jobs: 16, sla: '94% within 60m SLA', status: 'Optimal (42m SLA)', tone: 'text-brand' },
  { id: 'n3', label: 'N3 Natal', jobs: 24, sla: '91% within 60m SLA', status: 'Van Reenen Fog (54m SLA)', tone: 'text-amber' },
  { id: 'n4', label: 'N4 Maputo', jobs: 8, sla: '99% within 60m SLA', status: 'Clear (38m SLA)', tone: 'text-brand' },
] as const

const days = ['Mon 18', 'Tue 19', 'Wed 20', 'Thu 21', 'Fri 22', 'Sat 23', 'Sun 24']
const gmvSeries = [190, 215, 205, 240, 262, 285, 320] // R'000 / day, mock

export default function Overview() {
  const { settings } = useSettings()
  const [corridor, setCorridor] = useState<'all' | 'n1' | 'n3' | 'n4'>('all')
  const [broadcast, setBroadcast] = useState(false)

  const take = (GMV_MONTH * settings.feePct) / 100
  const pool = GMV_MONTH - take

  const shown = corridors.filter((c) => corridor === 'all' || c.id === corridor)

  return (
    <>
      <PageHeader
        eyebrow="Operational control"
        title="Overview & Analytics"
        sub="Jobs today, active mechanics, revenue and platform fees earned."
      />

      <Card className="bg-tint">
        <div className="flex flex-wrap gap-3">
          <Badge tone="dark">Live corridors</Badge>
          {corridors.map((c) => (
            <div key={c.id} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <span className="font-display font-extrabold">{c.label.split(' ')[0]}</span>{' '}
              <span className={`text-xs font-semibold ${c.tone}`}>● {c.status}</span>
            </div>
          ))}
        </div>
      </Card>

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Gross job volume (GMV)" value={zar(GMV_MONTH)} sub="▲ +14.2% vs last month" icon={Banknote} />
        <Stat
          label={`Platform take (${settings.feePct}% avg)`}
          value={zar(take)}
          sub="▲ +18.5% take-run-rate"
          icon={Landmark}
        />
        <Stat label="Dispatches today" value="48 Active" sub="114 jobs cleared & invoiced" icon={Radar} />
        <Stat label="Fleet transporters" value="42" sub="6 pending KYC" icon={Truck} />
        <Stat label="Mobile tyre vans" value="86" sub="12 currently on-scene" icon={Wrench} />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold">National Roadside Incident Radar</h2>
              <p className="text-sm text-muted">Real-time breakdown density across SA arterial routes.</p>
            </div>
            <Tabs
              value={corridor}
              onChange={setCorridor}
              items={[
                { key: 'all', label: 'All corridors' },
                { key: 'n1', label: 'N1' },
                { key: 'n3', label: 'N3' },
                { key: 'n4', label: 'N4' },
              ]}
            />
          </div>
          {/* Map placeholder: swap for a real map (Leaflet / Mapbox) when the API exists */}
          <div
            role="img"
            aria-label="Map placeholder showing incident clusters on the N1, N3 and N4"
            className="relative mt-4 h-64 overflow-hidden rounded-xl bg-[#dce7df]"
          >
            <div className="absolute top-20 -right-8 -left-8 h-4 -rotate-6 bg-white" />
            <div className="absolute top-40 -right-8 -left-8 h-4 rotate-6 bg-white" />
            {[
              ['18%', '30%', '4'],
              ['52%', '45%', '3'],
              ['70%', '70%', '2'],
            ].map(([l, t, n]) => (
              <span
                key={l}
                style={{ left: l, top: t }}
                className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white ring-2 ring-white"
              >
                {n}
              </span>
            ))}
            <div className="absolute bottom-3 left-3 rounded-lg bg-white px-3 py-2 text-sm shadow">
              <p className="text-[11px] font-bold text-brand">N3 HEAVY FREIGHT</p>
              <p className="font-bold">Van Reenen's Pass Sector</p>
              <p className="text-xs text-muted">8 mobile units staged • Avg response 22 min</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {shown.map((c) => (
              <div key={c.id} className="rounded-xl bg-tint p-3">
                <p className="text-[11px] font-bold uppercase text-muted">{c.label} corridor</p>
                <p className="font-display text-lg font-extrabold">{c.jobs} Jobs Active</p>
                <p className="text-xs font-semibold text-brand">{c.sla}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold">Active Job Dispatches</h2>
            <Link to="/admin/jobs" className="text-sm font-semibold text-brand hover:underline">
              View all (48) →
            </Link>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {jobs.slice(0, 3).map((j) => (
              <li key={j.id} className="rounded-xl bg-tint p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="num font-display text-lg font-extrabold">{j.plate}</p>
                  <Badge tone={j.statusTone}>{j.status}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {j.highway.split(' ')[0]} {j.place} • {j.mechanic}
                </p>
                <p className="num mt-1 text-xs font-semibold text-brand">{j.tyre.split(' ').slice(0, 2).join(' ')}</p>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-end justify-between pt-6">
            <span className="text-sm text-muted">Roadside dispatch success rate</span>
            <span className="font-display text-2xl font-extrabold text-brand">99.2%</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="font-display text-xl font-extrabold">Platform Revenue &amp; Transporter Settlements</h2>
          <p className="text-sm text-muted">
            Daily gross merchandise value (GMV) vs Tsela {settings.feePct}% net take fee.
          </p>
          <Chart feePct={settings.feePct} />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Mini label="Pending auto-payouts" value={zar(892_150)} sub="Scheduled Tuesday 06:00" />
            <Mini label="Mechanic commission pool" value={zar(pool)} sub={`${100 - settings.feePct}% net to mobile mechanics`} blue />
            <Mini label="Merchant settlement fee" value="1.8%" sub="Ozow / Stitch SA Rail" />
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
              <ShieldCheck size={20} className="text-brand" aria-hidden /> Owner Action Center
            </h2>
            <Badge tone="blue">High priority</Badge>
          </div>
          <div className="rounded-xl bg-tint p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Pending Partner Verifications</p>
              <Badge tone="amber">3 required</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              Three mobile repair vans submitted SABS tyre-fitment compliance documents.
            </p>
            <Link
              to="/admin/mechanics"
              className="mt-3 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Review certificates
            </Link>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldAlert size={18} className="text-danger" aria-hidden /> Flagged Pricing Dispute
              </p>
              <Badge tone="red">1 urgent</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              Transporter #TX-29 disputed a casing credit (R 1,200) on Job #TS-9410.
            </p>
            <Link
              to="/admin/jobs"
              className="mt-3 inline-flex h-10 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-black"
            >
              Resolve arbitrage
            </Link>
          </div>
          <div className="mt-auto pt-4">
            {broadcast ? (
              <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                Advisory queued for all units (demo only, nothing was sent).
              </p>
            ) : (
              <Button variant="dark" icon={Megaphone} className="h-12 w-full" onClick={() => setBroadcast(true)}>
                Broadcast Highway Advisory to All Units
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

function Mini({ label, value, sub, blue }: { label: string; value: string; sub: string; blue?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase text-muted">{label}</p>
      <p className="num font-display text-2xl font-extrabold">{value}</p>
      <p className={`text-xs ${blue ? 'font-semibold text-brand' : 'text-muted'}`}>{sub}</p>
    </div>
  )
}

function Chart({ feePct }: { feePct: number }) {
  const w = 600
  const h = 180
  const max = 340
  const x = (i: number) => 20 + (i * (w - 40)) / (gmvSeries.length - 1)
  const y = (v: number) => h - 10 - (v / max) * (h - 30)
  const gmv = gmvSeries.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const net = gmvSeries.map((v, i) => `${x(i)},${y((v * feePct) / 100)}`).join(' ')
  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="GMV and platform take per day, last 7 days">
        <polygon points={`${x(0)},${h - 10} ${gmv} ${x(gmvSeries.length - 1)},${h - 10}`} fill="#1150ab" opacity="0.12" />
        <polyline points={gmv} fill="none" stroke="#1150ab" strokeWidth="3" />
        <polyline points={net} fill="none" stroke="#0a1f5c" strokeWidth="2" strokeDasharray="5 4" />
      </svg>
      <div className="flex justify-between px-1 text-[11px] font-bold uppercase text-muted">
        {days.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <figcaption className="mt-2 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-brand" /> GMV (Rands)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-navy" /> Net take ({feePct}%)
        </span>
      </figcaption>
    </figure>
  )
}
