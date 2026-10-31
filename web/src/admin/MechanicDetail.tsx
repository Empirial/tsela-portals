import { ArrowLeft, FileText, MapPin, Star, Truck as TruckIcon, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Card, PageHeader, Stat, Table, Tabs, type Tone } from '../components/ui'
import { zar } from '../lib/format'
import { useOverrides } from '../lib/overrides'
import {
  jobs,
  mechanicDocs,
  mechanicProfiles,
  mechanics,
  mechanicSlug,
  mechanicVans,
  type FleetDoc,
  type Mechanic,
  type MechanicVan,
} from './data'
import { docTone } from './FleetDetail'
import { stateTone } from './Users'

type Tab = 'vans' | 'documents' | 'jobs'

const vanTone: Record<MechanicVan['state'], Tone> = {
  Available: 'green',
  'On a job': 'blue',
  Offline: 'neutral',
}

export default function MechanicDetail() {
  const { id } = useParams()
  const mechanic = mechanics.find((m) => mechanicSlug(m.name) === id)
  const [tab, setTab] = useState<Tab>('documents')
  const [stateMap, setState] = useOverrides('tsela.mechanics.state')
  const [docState, setDocState] = useOverrides('tsela.mechanicdocs.state')

  if (!mechanic) {
    return (
      <Card className="flex flex-col items-start gap-3">
        <h1 className="font-display text-2xl font-extrabold">Truck mechanic not found</h1>
        <p className="text-sm text-muted">This partner doesn’t exist or the link is out of date.</p>
        <Link to="/admin/mechanics" className="text-sm font-semibold text-brand hover:underline">
          Back to Truck Mechanics
        </Link>
      </Card>
    )
  }

  const s = (stateMap[mechanic.name] as Mechanic['state'] | undefined) ?? mechanic.state
  const profile = mechanicProfiles[mechanic.name]
  const vans = mechanicVans[mechanic.name] ?? []
  const docs = mechanicDocs(s).map((d) => ({
    ...d,
    state: (docState[`${mechanic.name}|${d.name}`] as FleetDoc['state'] | undefined) ?? d.state,
  }))
  const docsToReview = docs.filter((d) => d.state === 'Pending review').length
  // Jobs are matched on the business's first word, e.g. "Apex" in "Apex 24/7 Mobile Tyres".
  const key = mechanic.name.split(' ')[0].toLowerCase()
  const history = jobs.filter((j) => j.mechanic.toLowerCase().includes(key))

  return (
    <>
      <Link to="/admin/mechanics" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft size={16} aria-hidden /> Truck Mechanics
      </Link>

      <PageHeader
        eyebrow="Truck mechanic partner"
        title={mechanic.name}
        sub={mechanic.base}
        actions={
          <>
            <Badge tone={stateTone[s]}>{s}</Badge>
            {s === 'Pending' ? (
              <>
                <Button variant="secondary" onClick={() => setState(mechanic.name, 'Suspended')}>
                  Reject with notice
                </Button>
                <Button onClick={() => setState(mechanic.name, 'Active')}>Approve application</Button>
              </>
            ) : null}
            {s === 'Active' ? (
              <Button variant="danger" onClick={() => setState(mechanic.name, 'Sanctioned')}>
                Suspend partner
              </Button>
            ) : null}
            {s === 'Sanctioned' || s === 'Suspended' ? (
              <Button variant="secondary" onClick={() => setState(mechanic.name, 'Active')}>
                Reinstate partner
              </Button>
            ) : null}
          </>
        }
      />

      {mechanic.note ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-danger">{mechanic.note}</p>
      ) : null}

      <section aria-label="Partner summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Mobile vans" value={mechanic.vans} icon={TruckIcon} />
        <Stat label="Rating" value={mechanic.rating ? `${mechanic.rating} ★` : 'New partner'} icon={Star} />
        <Stat label="Heavy rig repairs" value={mechanic.rigs} icon={Wrench} />
        <Stat label="Coverage" value={mechanic.radius} icon={MapPin} />
      </section>

      <Card>
        <h2 className="font-display text-xl font-extrabold">Business details</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['Business name', mechanic.name],
            ['CIPC registration', mechanic.cipc],
            ...(profile
              ? [
                  ['VAT number', profile.vatNo],
                  ['Primary contact', profile.contact],
                  ['Phone', profile.phone],
                  ['Email', profile.email],
                  ['Joined Tsela', profile.since],
                ]
              : []),
            ['Base station', mechanic.base],
            ['Payout account', mechanic.bank],
            ...(profile ? [['Services', profile.services.join(', ')]] : []),
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-semibold text-muted">{k}</dt>
              <dd className="num mt-0.5 text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {mechanic.badges.map((b) => (
            <Badge key={b} tone={/Audit|Lapsed/.test(b) ? 'red' : 'blue'}>
              {b}
            </Badge>
          ))}
        </div>
      </Card>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { key: 'documents', label: 'Documents', count: docs.length },
          { key: 'vans', label: 'Vans & technicians', count: mechanic.vans },
          { key: 'jobs', label: 'Job history', count: history.length },
        ]}
      />

      {tab === 'documents' ? (
        <Card className="p-0">
          {docsToReview > 0 ? (
            <p className="border-b border-line bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {docsToReview} document{docsToReview > 1 ? 's' : ''} waiting for review before this partner goes live.
            </p>
          ) : null}
          <Table head={['Document', 'File', 'Uploaded', 'Status']}>
            {docs.map((d) => {
              const k = `${mechanic.name}|${d.name}`
              return (
                <tr key={d.name}>
                  <td className="px-3 py-4">
                    <span className="flex items-center gap-2 font-semibold">
                      <FileText size={16} className="text-muted" aria-hidden /> {d.name}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-xs text-muted">{d.file ? `${d.file} • ${d.size}` : '—'}</td>
                  <td className="num px-3 py-4 text-xs text-muted">{d.uploaded}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={docTone[d.state]}>{d.state}</Badge>
                      {d.state === 'Pending review' ? (
                        <>
                          <Button className="h-8 px-3 text-xs" onClick={() => setDocState(k, 'Verified')}>
                            Approve
                          </Button>
                          <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => setDocState(k, 'Rejected')}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </Table>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Sample documents. Opening the files will work once document storage is connected.
          </p>
        </Card>
      ) : null}

      {tab === 'vans' ? (
        <Card className="p-0">
          <Table head={['Van', 'Lead technician', 'Status']}>
            {vans.map((v) => (
              <tr key={v.unit}>
                <td className="num px-3 py-4 font-semibold">{v.unit}</td>
                <td className="px-3 py-4">{v.technician}</td>
                <td className="px-3 py-4">
                  <Badge tone={vanTone[v.state]}>{v.state}</Badge>
                </td>
              </tr>
            ))}
          </Table>
          {vans.length === 0 ? <p className="p-6 text-center text-sm text-muted">No vans to show yet.</p> : null}
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Showing {vans.length} of {mechanic.vans} mobile vans
          </p>
        </Card>
      ) : null}

      {tab === 'jobs' ? (
        <Card className="p-0">
          <Table head={['Job', 'Where', 'Fleet', 'Issue', 'Status', 'Gross']}>
            {history.map((j) => (
              <tr key={j.id}>
                <td className="num px-3 py-4 font-semibold">{j.id}</td>
                <td className="px-3 py-4 text-xs text-muted">
                  {j.highway} • {j.place}
                </td>
                <td className="px-3 py-4">{j.fleet}</td>
                <td className="px-3 py-4 text-xs">{j.issue}</td>
                <td className="px-3 py-4">
                  <Badge tone={j.statusTone}>{j.status}</Badge>
                </td>
                <td className="num px-3 py-4">{zar(j.gross)}</td>
              </tr>
            ))}
          </Table>
          {history.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">No jobs yet for this partner.</p>
          ) : null}
        </Card>
      ) : null}
    </>
  )
}
