import { Download, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, cx, PageHeader, Stat, Table } from '../components/ui'
import { zar } from '../lib/format'
import { useSettings } from '../lib/settings'
import { useLive } from '../lib/live'

const filters = ['All highways', 'N1', 'N3', 'N4'] as const

export default function Jobs() {
  const { settings } = useSettings()
  const { jobs } = useLive()
  const [q, setQ] = useState('')
  const [hw, setHw] = useState<(typeof filters)[number]>('All highways')
  const [selected, setSelected] = useState(jobs[0]?.id ?? '')

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return jobs.filter(
      (j) =>
        (hw === 'All highways' || j.highway.startsWith(hw)) &&
        (!s || [j.id, j.plate, j.fleet, j.mechanic, j.place].some((v) => v.toLowerCase().includes(s))),
    )
  }, [q, hw, jobs])

  const job = jobs.find((j) => j.id === selected) ?? jobs[0]
  // Real invoice amounts when the mechanic has invoiced; otherwise the sample maths from the settings.
  const inv = job?.invoice
  const net = inv ? inv.subtotal : job ? job.gross / (1 + settings.vatPct / 100) : 0 // ex-VAT subtotal
  const vat = inv ? inv.vat : job ? job.gross - net : 0
  const fee = inv ? inv.fee : job ? (job.gross * settings.feePct) / 100 : 0
  const live = jobs.filter((j) => ['Dispatched', 'En route', 'On site'].includes(j.status)).length
  const signoff = jobs.filter((j) => j.status === 'Invoiced').length
  const disputed = jobs.filter((j) => j.status === 'Escrow on hold').length
  const paid = jobs.filter((j) => j.status === 'Bank cleared').length
  const total = jobs.reduce((a, j) => a + j.gross, 0)

  return (
    <>
      <PageHeader
        eyebrow="Incident dispatch grid"
        title="Jobs & Heavy Fleet Dispatches"
        sub="Every request on the platform with its status, mechanic, fleet and amount."
        actions={
          <>
            <Button variant="secondary" icon={Download}>
              Export SARS tax CSV
            </Button>
            <Button>Manual dispatch override</Button>
          </>
        }
      />

      <section aria-label="Job totals" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="All jobs" value={String(jobs.length)} sub={`This month (${zar(total)})`} />
        <Stat label="In progress / live" value={String(live)} sub="Dispatched and on the road" />
        <Stat label="Fleet sign-off" value={String(signoff)} sub="Invoice awaiting the fleet" />
        <Stat label="Disputed / escrow" value={String(disputed)} sub="Casing liability audit" />
        <Stat label="Settled & paid" value={String(paid)} sub="Instant EFT cleared" />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-64 flex-1">
          <span className="sr-only">Search jobs</span>
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search job #, vehicle reg, highway…"
            className="h-11 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-sm outline-none focus:border-brand"
          />
        </label>
        <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1" role="group" aria-label="Highway filter">
          {filters.map((f) => (
            <button
              key={f}
              aria-pressed={hw === f}
              onClick={() => setHw(f)}
              className={cx(
                'h-9 rounded-lg px-3 text-sm font-semibold',
                hw === f ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Button variant="secondary" icon={RefreshCw} aria-label="Refresh" onClick={() => setQ('')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-0">
          <Table head={['Job & highway', 'Fleet vehicle', 'Issue & axle', 'Mobile mechanic', 'Status']}>
            {list.map((j) => {
              const status = j.status
              const tone = j.statusTone
              return (
                <tr
                  key={j.id}
                  onClick={() => setSelected(j.id)}
                  className={cx('cursor-pointer align-top hover:bg-tint/60', j.id === selected && 'bg-tint')}
                >
                  <td className="px-3 py-4">
                    <button
                      aria-label={`Inspect job ${j.id}`}
                      onClick={() => setSelected(j.id)}
                      className="num font-display text-lg font-extrabold text-brand"
                    >
                      #{j.id}
                    </button>
                    {j.highway ? (
                      <div className="mt-1">
                        <Badge tone="blue">{j.highway}</Badge>
                      </div>
                    ) : null}
                    <p className="mt-1 text-xs text-muted">
                      {j.ago} • {j.place}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-semibold">{j.fleet}</p>
                    <p className="num text-xs text-muted">
                      {j.plate} • {j.vehicle}
                    </p>
                    <p className="text-xs text-muted">Driver: {j.driver}</p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone="amber">{j.issue}</Badge>
                      {j.axle ? <Badge tone="blue">{j.axle}</Badge> : null}
                    </div>
                    <p className="num mt-1 text-xs text-muted">{j.tyre}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-semibold">{j.mechanic}</p>
                    <p className="text-xs text-muted">{j.van}</p>
                  </td>
                  <td className="px-3 py-4">
                    <Badge tone={tone}>{status}</Badge>
                  </td>
                </tr>
              )
            })}
          </Table>
          {list.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {jobs.length === 0 ? 'No jobs yet. They appear here as soon as a driver reports a problem.' : 'No jobs match your filters.'}
            </p>
          ) : null}
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Showing {list.length} of {jobs.length} records
          </p>
        </Card>

        {job ? (
        <Card className="flex h-fit flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand">Active incident focus</p>
              <h2 className="num font-display text-3xl font-extrabold">#{job.id}</h2>
              <p className="num text-sm text-muted">{job.plate}</p>
            </div>
            <Badge tone="blue">Live dispatch</Badge>
          </div>
          <div className="rounded-xl bg-tint p-3 text-sm">
            <p className="font-semibold">
              {job.highway ? job.highway.split(' ')[0] + ' Corridor • ' : ''}{job.place}
            </p>
            <p className="text-xs text-muted">Issue: {job.issue}{job.axle ? ' • ' + job.axle : ''} • {job.mechanic}</p>
          </div>

          {job.photos && (job.photos.driver.length || job.photos.before.length || job.photos.after.length) ? (
            <div className="space-y-3">
              <Photos title="Driver photos" urls={job.photos.driver} />
              <Photos title="Before (mechanic)" urls={job.photos.before} />
              <Photos title="After (mechanic)" urls={job.photos.after} />
            </div>
          ) : null}

          <div className="rounded-xl bg-tint p-4">
            <p className="text-[11px] font-bold uppercase text-brand">SARS compliant pro-forma</p>
            <div className="mt-1 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">{inv ? 'Tax Invoice ' + inv.number : 'Pro-forma: no invoice yet'}</h3>
              <Badge tone="blue">VAT @ {inv ? inv.vatPct : settings.vatPct}%</Badge>
            </div>
            <dl className="num mt-3 space-y-1 text-sm">
              <Row k="Subtotal (excl. VAT)" v={zar(net, 2)} />
              <Row k={`South African VAT (${settings.vatPct}.0%)`} v={zar(vat, 2)} />
              <Row k="Total gross payable" v={zar(job.gross, 2)} bold />
            </dl>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-100 p-3">
              <p className="text-xs font-bold text-blue-800">
                Tsela Assist platform royalty ({inv ? inv.feePct : settings.feePct}%)
                <span className="block font-normal text-muted">Escrow deduction on EFT release</span>
              </p>
              <p className="num font-display text-xl font-extrabold text-brand">{zar(fee, 2)}</p>
            </div>
          </div>

          <p className="rounded-xl bg-tint p-3 text-xs text-muted">
              {inv
                ? 'Payouts are released from Payments once the fleet approves this invoice.'
                : 'The mechanic has not invoiced this job yet.'}
            </p>
        </Card>
        ) : (
          <Card className="h-fit text-sm text-muted">Select a job to inspect it. Nothing has been reported yet.</Card>
        )}
      </div>
    </>
  )
}

function Photos({ title, urls }: { title: string; urls: string[] }) {
  if (!urls.length) return null
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase text-brand">
        {title} ({urls.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {urls.map((u) => (
          <a key={u} href={u} target="_blank" rel="noopener noreferrer">
            <img src={u} alt={title} className="h-20 w-20 rounded-lg border border-line object-cover" />
          </a>
        ))}
      </div>
    </div>
  )
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={cx('flex justify-between', bold && 'border-t border-line pt-2 font-bold')}>
      <dt className={bold ? '' : 'text-muted'}>{k}</dt>
      <dd>{v}</dd>
    </div>
  )
}
