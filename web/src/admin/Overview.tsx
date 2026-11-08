import { Banknote, Landmark, Radar, ShieldAlert, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card, PageHeader, Stat } from '../components/ui'
import { zar } from '../lib/format'
import { useSettings } from '../lib/settings'
import { useLive } from '../lib/live'

export default function Overview() {
  const { settings } = useSettings()
  const { fleets, jobs, mechanics, gmv } = useLive()

  // The platform's cut is the fee actually charged on each cleared job, taken from the ex-VAT subtotal.
  const take = jobs
    .filter((j) => j.status === 'Bank cleared')
    .reduce((sum, j) => sum + (j.invoice ? j.invoice.fee : (j.gross * settings.feePct) / 100), 0)
  const active = jobs.filter((j) => j.status !== 'Bank cleared').length
  const cleared = jobs.length - active
  const driverCount = fleets.reduce((a, f) => a + f.drivers, 0)
  const totalUsers = fleets.length + driverCount + mechanics.length
  const pendingMechanics = mechanics.filter((m) => m.state === 'Pending').length
  const disputed = jobs.filter((j) => j.status === 'Escrow on hold').length

  return (
    <>
      <PageHeader
        eyebrow="Operational control"
        title="Overview"
        sub="Jobs, revenue and the people using the app."
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gross job volume (GMV)" value={zar(gmv)} sub={gmv ? 'Invoices approved by fleets' : 'No jobs paid yet'} icon={Banknote} />
        <Stat
          label={`Platform take (${settings.feePct}%)`}
          value={zar(take)}
          sub="Earned on completed jobs"
          icon={Landmark}
        />
        <Stat label="Dispatches today" value={`${active} Active`} sub={`${cleared} jobs cleared & invoiced`} icon={Radar} />
        <Stat
          label="App users"
          value={String(totalUsers)}
          sub={`${fleets.length} fleets · ${driverCount} drivers · ${mechanics.length} repairers`}
          icon={Users}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold">Active Job Dispatches</h2>
            <Link to="/admin/jobs" className="text-sm font-semibold text-brand hover:underline">
              View all ({jobs.length}) →
            </Link>
          </div>
          {jobs.length === 0 ? <p className="mt-4 text-sm text-muted">No dispatches yet.</p> : null}
          <ul className="mt-4 flex flex-col gap-3">
            {jobs.slice(0, 5).map((j) => (
              <li key={j.id} className="rounded-xl bg-tint p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="num font-display text-lg font-extrabold">{j.plate}</p>
                  <Badge tone={j.statusTone}>{j.status}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {j.highway ? j.highway.split(' ')[0] + ' ' : ''}{j.place} • {j.mechanic}
                </p>
                <p className="num mt-1 text-xs font-semibold text-brand">{j.tyre.split(' ').slice(0, 2).join(' ')}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
              <ShieldCheck size={20} className="text-brand" aria-hidden /> Owner Action Center
            </h2>
          </div>
          <div className="rounded-xl bg-tint p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Pending Partner Verifications</p>
              <Badge tone={pendingMechanics ? 'amber' : 'neutral'}>{pendingMechanics} required</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {pendingMechanics ? 'Repair partners are waiting for their documents to be reviewed.' : 'No repair partners are waiting for review.'}
            </p>
            <Link
              to="/admin/mechanics"
              className="mt-3 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Review partners
            </Link>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldAlert size={18} className="text-danger" aria-hidden /> Disputes
              </p>
              <Badge tone={disputed ? 'red' : 'neutral'}>{disputed} open</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {disputed ? 'Jobs with escrow on hold need your decision.' : 'No jobs are in dispute.'}
            </p>
            <Link
              to="/admin/jobs"
              className="mt-3 inline-flex h-10 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-black"
            >
              Open jobs
            </Link>
          </div>
        </Card>
      </div>
    </>
  )
}
