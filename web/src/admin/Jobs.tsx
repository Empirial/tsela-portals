import { Download, Lock, RefreshCw, Repeat, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, cx, PageHeader, Stat, Table } from '../components/ui'
import { zar } from '../lib/format'
import { useSettings } from '../lib/settings'
import { jobs } from './data'

const filters = ['All highways', 'N1', 'N3', 'N4'] as const

export default function Jobs() {
  const { settings } = useSettings()
  const [q, setQ] = useState('')
  const [hw, setHw] = useState<(typeof filters)[number]>('All highways')
  const [selected, setSelected] = useState(jobs[0].id)
  const [settled, setSettled] = useState<string[]>([])
  const [frozen, setFrozen] = useState<string[]>([])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return jobs.filter(
      (j) =>
        (hw === 'All highways' || j.highway.startsWith(hw)) &&
        (!s || [j.id, j.plate, j.fleet, j.mechanic, j.place].some((v) => v.toLowerCase().includes(s))),
    )
  }, [q, hw])

  const job = jobs.find((j) => j.id === selected) ?? jobs[0]
  const net = job.gross / (1 + settings.vatPct / 100) // ex-VAT subtotal
  const vat = job.gross - net
  const fee = (job.gross * settings.feePct) / 100

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
        <Stat label="All jobs" value="284" sub="This month (ZAR 1.42M)" />
        <Stat label="In progress / live" value="18" sub="11 on N3 • 7 on N1" />
        <Stat label="Fleet sign-off" value="7" sub="Torque verification pending" />
        <Stat label="Disputed / escrow" value="2" sub="Casing liability audit" />
        <Stat label="Settled & paid" value="257" sub="Instant EFT cleared" />
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

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-0">
          <Table head={['Job & highway', 'Fleet vehicle', 'Issue & axle', 'Mobile mechanic', 'Status']}>
            {list.map((j) => {
              const status = settled.includes(j.id) ? 'Bank cleared' : frozen.includes(j.id) ? 'Escrow on hold' : j.status
              const tone = settled.includes(j.id) ? 'neutral' : frozen.includes(j.id) ? 'red' : j.statusTone
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
                    <div className="mt-1">
                      <Badge tone="blue">{j.highway}</Badge>
                    </div>
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
                      <Badge tone="blue">{j.axle}</Badge>
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
          {list.length === 0 ? <p className="p-6 text-center text-sm text-muted">No jobs match your filters.</p> : null}
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Showing {list.length} of 284 records • Real-time socket active
          </p>
        </Card>

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
              {job.highway.split(' ')[0]} Corridor • {job.place}
            </p>
            <p className="text-xs text-muted">Issue: {job.issue} • {job.axle}</p>
          </div>

          <div className="rounded-xl bg-tint p-4">
            <p className="text-[11px] font-bold uppercase text-brand">SARS compliant pro-forma</p>
            <div className="mt-1 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Tax Invoice #INV-24-{job.id.slice(3)}</h3>
              <Badge tone="blue">VAT @ {settings.vatPct}%</Badge>
            </div>
            <dl className="num mt-3 space-y-1 text-sm">
              <Row k="Subtotal (excl. VAT)" v={zar(net, 2)} />
              <Row k={`South African VAT (${settings.vatPct}.0%)`} v={zar(vat, 2)} />
              <Row k="Total gross payable" v={zar(job.gross, 2)} bold />
            </dl>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-100 p-3">
              <p className="text-xs font-bold text-blue-800">
                Tsela platform royalty ({settings.feePct}%)
                <span className="block font-normal text-muted">Escrow deduction on EFT release</span>
              </p>
              <p className="num font-display text-xl font-extrabold text-brand">{zar(fee, 2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={Repeat}>
              Reassign mechanic
            </Button>
            <Button
              variant="danger"
              icon={Lock}
              disabled={frozen.includes(job.id)}
              onClick={() => setFrozen((f) => [...f, job.id])}
            >
              {frozen.includes(job.id) ? 'Escrow frozen' : 'Freeze escrow'}
            </Button>
          </div>
          <Button
            className="h-12"
            disabled={settled.includes(job.id)}
            onClick={() => setSettled((s) => [...s, job.id])}
          >
            {settled.includes(job.id) ? 'Settled via EFT' : 'Force fleet sign-off & settle EFT'}
          </Button>
        </Card>
      </div>
    </>
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
