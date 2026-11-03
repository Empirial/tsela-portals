import { Banknote, Download, Landmark } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, PageHeader, Stat, Table, Tabs } from '../components/ui'
import { zar } from '../lib/format'
import { useSettings } from '../lib/settings'
import { payouts, subscriptions } from './data'

type Tab = 'ledger' | 'subs'


export default function Payments() {
  const { settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'subs' ? 'subs' : 'ledger'
  const [released, setReleased] = useState<string[]>([])
  const [batch, setBatch] = useState(false)

  const rows = payouts.map((p) => {
    const fee = (p.gross * settings.feePct) / 100
    const vat = p.gross - p.gross / (1 + settings.vatPct / 100)
    return { ...p, fee, vat, net: p.gross - fee }
  })
  const ready = rows.filter((r) => r.signed && !released.includes(r.job))
  const readyTotal = ready.reduce((a, r) => a + r.net, 0)

  return (
    <>
      <PageHeader
        eyebrow="Treasury & settlements control"
        title="Financial Clearing & SaaS Subscriptions"
        sub="Money received, platform fee per job, payouts owed to mechanics and fleet subscriptions."
        actions={
          <>
            <Button variant="secondary" icon={Download}>
              Export CSV
            </Button>
            <Button>Monthly SARS statement</Button>
          </>
        }
      />

      <section aria-label="Treasury" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Ring-fenced escrow" value={zar(rows.filter((r) => !r.signed).reduce((a, r) => a + r.gross, 0))} sub={`Held across ${rows.filter((r) => !r.signed).length} jobs pending fitment sign-off`} icon={Landmark} />
        <Stat label="Mechanic payouts owed" value={zar(readyTotal)} sub={`Net payables to ${new Set(ready.map((r) => r.mechanic)).size} mechanics`} icon={Banknote} />
        <Stat label="Take-rate revenue" value={zar(rows.reduce((a, r) => a + r.fee, 0))} sub={`${settings.feePct}.0% take rate`} />
        <Stat label="Fleet SaaS ARR/MRR" value={zar(subscriptions.reduce((a, s) => a + s.monthly, 0))} sub={`/mo • ${subscriptions.length} fleets • ${subscriptions.reduce((a, s) => a + s.rigs, 0)} licensed rigs`} dark />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs<Tab>
          value={tab}
          onChange={(t) => setParams(t === 'subs' ? { tab: 'subs' } : {})}
          items={[
            { key: 'ledger', label: 'Job payouts & escrow ledger', count: payouts.length },
            { key: 'subs', label: 'Fleet SaaS subscriptions', count: subscriptions.length },
          ]}
        />
      </div>

      {tab === 'ledger' ? (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-extrabold">Batch settlement processor</h2>
              <p className="text-sm text-muted">Release payouts for jobs where the driver has signed off.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase text-brand">Ready to disburse</p>
                <p className="num font-display text-2xl font-extrabold">
                  {zar(readyTotal, 2)} <span className="text-sm font-normal text-muted">({ready.length} jobs)</span>
                </p>
              </div>
              <Button
                disabled={ready.length === 0 || batch}
                onClick={() => {
                  setReleased((r) => [...r, ...ready.map((x) => x.job)])
                  setBatch(true)
                }}
              >
                {batch && ready.length === 0 ? 'Batch released' : 'Release batch payouts'}
              </Button>
            </div>
          </Card>

          <Card className="p-0">
            <div className="border-b border-line p-5">
              <h2 className="font-display text-lg font-extrabold">Verified job breakdown &amp; commission clearing</h2>
              <p className="text-sm text-muted">
                Every job shows the {settings.feePct}% Tsela fee deduction and the {settings.vatPct}% VAT split.
              </p>
            </div>
            <Table
              head={['Job', 'Mechanic', 'Fleet', 'Gross invoiced', `${settings.feePct}% Tsela fee`, `VAT (${settings.vatPct}%)`, 'Net payout owed', 'Driver ePOD', 'Settlement']}
            >
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-sm text-muted">
                    No payouts yet. They appear here once a fleet pays an invoice.
                  </td>
                </tr>
              ) : null}
              {rows.map((r) => {
                const done = released.includes(r.job)
                return (
                  <tr key={r.job} className="align-top">
                    <td className="num px-3 py-4">
                      <p className="font-display font-extrabold">#{r.job}</p>
                      <p className="text-xs text-muted">{r.where}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold">{r.mechanic}</p>
                      <p className="text-xs text-muted">{r.bank}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold">{r.fleet}</p>
                      <p className="num text-xs text-brand">{r.rig}</p>
                    </td>
                    <td className="num px-3 py-4">{zar(r.gross, 2)}</td>
                    <td className="num px-3 py-4 text-brand">-{zar(r.fee, 2)}</td>
                    <td className="num px-3 py-4 text-muted">{zar(r.vat, 2)}</td>
                    <td className="num px-3 py-4 font-display font-extrabold">{zar(r.net, 2)}</td>
                    <td className="px-3 py-4">
                      <Badge tone={r.signed ? 'blue' : 'amber'}>{r.signed ? 'Signed' : 'Pending sign'}</Badge>
                    </td>
                    <td className="px-3 py-4">
                      {done ? (
                        <Badge tone="neutral">Settled</Badge>
                      ) : r.signed ? (
                        <Button className="h-8 px-3 text-xs" onClick={() => setReleased((x) => [...x, r.job])}>
                          Release pay
                        </Button>
                      ) : (
                        <Badge tone="neutral">Escrow held</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </Table>
          </Card>
        </>
      ) : (
        <Card className="p-0">
          <Table head={['Fleet company', 'Plan', 'Trucks', 'Monthly', 'Renewal', 'Status']}>
            {subscriptions.map((s) => (
              <tr key={s.fleet}>
                <td className="px-3 py-4 font-semibold">{s.fleet}</td>
                <td className="px-3 py-4">{s.plan}</td>
                <td className="num px-3 py-4">{s.rigs}</td>
                <td className="num px-3 py-4">{zar(s.monthly)}</td>
                <td className="px-3 py-4 text-muted">{s.renews}</td>
                <td className="px-3 py-4">
                  <Badge tone={s.state === 'Active' ? 'green' : s.state === 'Trial' ? 'blue' : 'red'}>{s.state}</Badge>
                </td>
              </tr>
            ))}
          </Table>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Fleet subscriptions are invoiced outside the mobile app (see the Google Play note in the product description).
          </p>
        </Card>
      )}
    </>
  )
}
