import { CheckCircle2, FileText, Search, ShieldAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, PageHeader, Stat, Table, Tabs, type Tone } from '../components/ui'
import { useOverrides } from '../lib/overrides'
import { fleets, fleetSlug, mechanics, type Mechanic } from './data'

type Filter = 'all' | 'active' | 'pending' | 'suspended'

export const stateTone: Record<string, Tone> = {
  Active: 'green',
  Validated: 'green',
  Pending: 'amber',
  'Pending KYC': 'amber',
  Suspended: 'red',
  Sanctioned: 'red',
}

function Search_({ q, setQ, placeholder }: { q: string; setQ: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative min-w-64 flex-1">
      <span className="sr-only">{placeholder}</span>
      <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}

function StatusFilter({ value, onChange }: { value: Filter; onChange: (v: Filter) => void }) {
  return (
    <Tabs<Filter>
      value={value}
      onChange={onChange}
      items={[
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'pending', label: 'Pending' },
        { key: 'suspended', label: 'Suspended' },
      ]}
    />
  )
}

const matches = (state: string, f: Filter) =>
  f === 'all' ||
  (f === 'active' && (state === 'Active' || state === 'Validated')) ||
  (f === 'pending' && state.startsWith('Pending')) ||
  (f === 'suspended' && (state === 'Suspended' || state === 'Sanctioned'))

/* -------------------------------- Mechanics ------------------------------- */

export function MechanicsPage() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [override, setOverride] = useOverrides('tsela.mechanics.state')
  const [dossier, setDossier] = useState<Mechanic | null>(null)
  const navigate = useNavigate()

  const state = (r: Mechanic) => (override[r.name] as Mechanic['state'] | undefined) ?? r.state
  const list = useMemo(
    () =>
      mechanics.filter(
        (r) => matches(state(r), filter) && (!q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, filter, override],
  )

  const set = (r: Mechanic, s: Mechanic['state']) => setOverride(r.name, s)
  const pending = mechanics.filter((r) => state(r) === 'Pending').length

  return (
    <>
      <PageHeader
        eyebrow="Partner governance"
        title="Truck Mechanics"
        sub="Audit certifications, approve or suspend repair units, and issue instant payout credentials."
      />

      {pending > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-100 p-4">
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-extrabold">
              <ShieldAlert size={20} aria-hidden /> Compliance verification queue
              <Badge tone="red">Urgent action</Badge>
            </p>
            <p className="text-sm text-slate-700">
              {pending} mechanic verification application{pending > 1 ? 's' : ''} awaiting SABS &amp; VAT approval.
            </p>
          </div>
          <Button variant="dark" onClick={() => setDossier(mechanics.find((r) => state(r) === 'Pending') ?? null)}>
            Review application
          </Button>
        </div>
      ) : null}

      <section aria-label="Totals" className="grid grid-cols-3 gap-4">
        <Stat label="Mechanics" value="98" />
        <Stat label="Fleets" value="46" />
        <Stat label="Drivers" value="312" />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Search_ q={q} setQ={setQ} placeholder="Search mechanicsâ€¦" />
        <StatusFilter value={filter} onChange={setFilter} />
      </div>

      <Card className="p-0">
        <Table head={['Business & base station', 'Fleet & coverage', 'Rating', 'Compliance', 'Payout', 'Account']}>
          {list.map((r) => {
            const s = state(r)
            return (
              <tr
                key={r.name}
                className={`cursor-pointer align-top hover:bg-canvas/60 ${s === 'Sanctioned' || s === 'Suspended' ? 'bg-red-50/60' : ''}`}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button, a')) navigate(`/admin/mechanics/${fleetSlug(r.name)}`)
                }}
              >
                <td className="px-3 py-4">
                  <div className="flex gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tint font-bold text-brand">
                      {r.initials}
                    </span>
                    <div>
                      <Link to={`/admin/mechanics/${fleetSlug(r.name)}`} className="font-semibold text-brand hover:underline">
                        {r.name}
                      </Link>
                      <p className="text-xs text-muted">{r.base}</p>
                      <p className="num text-xs text-muted">CIPC: {r.cipc}</p>
                      {r.note ? <p className="text-xs font-semibold text-danger">{r.note}</p> : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 text-xs text-muted">
                  <p className="font-semibold text-ink">{r.vans} mobile vans</p>
                  {r.radius}
                </td>
                <td className="num px-3 py-4">
                  {r.rating ? (
                    <>
                      <span className="font-bold">{r.rating} â˜…</span>
                      <p className="text-xs text-muted">{r.rigs} heavy rig repairs</p>
                    </>
                  ) : (
                    <span className="text-xs text-muted">New partner</span>
                  )}
                </td>
                <td className="px-3 py-4">
                  <div className="flex max-w-40 flex-wrap gap-1">
                    {r.badges.map((b) => (
                      <Badge key={b} tone={/Audit|Lapsed/.test(b) ? 'red' : 'blue'}>
                        {b}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-4 text-xs text-muted">{r.bank}</td>
                <td className="px-3 py-4">
                  <Badge tone={stateTone[s]}>{s}</Badge>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s === 'Pending' ? (
                      <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setDossier(r)}>
                        Review
                      </Button>
                    ) : null}
                    {s === 'Active' ? (
                      <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => set(r, 'Sanctioned')}>
                        Suspend
                      </Button>
                    ) : null}
                    {s === 'Sanctioned' ? (
                      <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => set(r, 'Active')}>
                        Reinstate
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
        {list.length === 0 ? <p className="p-6 text-center text-sm text-muted">No mechanics match.</p> : null}
        <p className="border-t border-line px-4 py-3 text-xs text-muted">
          Showing {list.length} of 98 mobile repair partners
        </p>
      </Card>

      {dossier ? (
        <Dossier
          r={dossier}
          onClose={() => setDossier(null)}
          onDecide={(s) => {
            set(dossier, s)
            setDossier(null)
          }}
        />
      ) : null}
    </>
  )
}

function Dossier({
  r,
  onClose,
  onDecide,
}: {
  r: Mechanic
  onClose: () => void
  onDecide: (s: Mechanic['state']) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Inspection dossier for ${r.name}`}>
      <button aria-label="Close dossier" className="absolute inset-0 bg-navy/60" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <p className="text-[11px] font-bold uppercase text-brand">Inspection dossier</p>
            <h2 className="font-display text-2xl font-extrabold">{r.name}</h2>
            <p className="text-xs text-muted">{r.base}</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-2 hover:bg-canvas">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <Section title="1. CIPC & SARS VAT filing" tag="Automated match">
            <p className="num text-sm">CIPC registration: {r.cipc}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" icon={FileText} className="h-8 text-xs">
                CIPC certificate.pdf
              </Button>
              <Button variant="secondary" icon={FileText} className="h-8 text-xs">
                SARS tax clearance
              </Button>
            </div>
          </Section>
          <Section title="2. SABS technician accreditations" tag="1 cert awaiting sign-off">
            <p className="text-sm">Lead mechanic: SABS heavy commercial registration on file.</p>
            <p className="text-xs text-danger">Apprentice logbook expired â€” request waiver.</p>
          </Section>
          <Section title="3. Commercial liability & roadside indemnity" tag="Verified">
            <p className="text-sm">Public &amp; roadside liability cover confirmed.</p>
          </Section>
          <Section title="4. Mobile casings stock declaration" tag="38 casings stored">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['315/80 R22.5', '18 in stock'],
                ['385/65 R22.5', '12 in stock'],
                ['12R22.5', '8 in stock'],
              ].map(([s, n]) => (
                <div key={s} className="num rounded-lg bg-tint p-2">
                  <p className="font-display font-extrabold">{s}</p>
                  <p className="text-xs text-brand">{n}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 border-t border-line p-5">
          <Button variant="secondary" onClick={() => onDecide('Suspended')}>
            Reject with notice
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Request additional docs
          </Button>
          <Button icon={CheckCircle2} className="ml-auto" onClick={() => onDecide('Active')}>
            Approve application
          </Button>
        </div>
      </aside>
    </div>
  )
}

function Section({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-tint/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-display font-extrabold">{title}</h3>
        <Badge tone="blue">{tag}</Badge>
      </div>
      {children}
    </div>
  )
}

/* ---------------------------------- Fleets --------------------------------- */

export function FleetsPage() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [override, set] = useOverrides('tsela.fleets.state')
  const navigate = useNavigate()
  const state = (name: string, base: string) => override[name] ?? base

  const list = fleets.filter(
    (f) => matches(state(f.name, f.state), filter) && (!q.trim() || f.name.toLowerCase().includes(q.trim().toLowerCase())),
  )

  return (
    <>
      <PageHeader
        eyebrow="Partner governance"
        title="Fleet Companies"
        sub="Open a company to see its registered trucks and drivers, or approve and suspend its account."
      />
      <div className="flex flex-wrap items-center gap-3">
        <Search_ q={q} setQ={setQ} placeholder="Search fleet companiesâ€¦" />
        <StatusFilter value={filter} onChange={setFilter} />
      </div>
      <Card className="p-0">
        <Table head={['Company', 'Trucks', 'Drivers', 'Plan', 'Credit', 'Account']}>
          {list.map((f) => {
            const s = state(f.name, f.state)
            return (
              <tr
                key={f.name}
                className="cursor-pointer align-top hover:bg-canvas/60"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button, a')) navigate(`/admin/fleets/${fleetSlug(f.name)}`)
                }}
              >
                <td className="px-3 py-4">
                  <Link to={`/admin/fleets/${fleetSlug(f.name)}`} className="font-semibold text-brand hover:underline">
                    {f.name}
                  </Link>
                  <p className="text-xs text-muted">{f.contact}</p>
                </td>
                <td className="num px-3 py-4">{f.rigs}</td>
                <td className="num px-3 py-4">{f.drivers}</td>
                <td className="px-3 py-4 text-xs">{f.plan}</td>
                <td className="px-3 py-4 text-xs text-muted">{f.credit}</td>
                <td className="px-3 py-4">
                  <Badge tone={stateTone[s]}>{s}</Badge>
                  <div className="mt-2 flex gap-1">
                    {s === 'Pending KYC' ? (
                      <Button className="h-8 px-3 text-xs" onClick={() => set(f.name, 'Active')}>
                        Approve
                      </Button>
                    ) : null}
                    {s === 'Active' ? (
                      <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => set(f.name, 'Suspended')}>
                        Suspend
                      </Button>
                    ) : null}
                    {s === 'Suspended' ? (
                      <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => set(f.name, 'Active')}>
                        Reinstate
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
        {list.length === 0 ? <p className="p-6 text-center text-sm text-muted">No fleet companies match.</p> : null}
      </Card>
    </>
  )
}
