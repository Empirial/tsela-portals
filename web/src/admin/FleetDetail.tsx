import { ArrowLeft, Banknote, FileText, IdCard, Layers, Truck as TruckIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Card, PageHeader, Stat, Table, Tabs, type Tone } from '../components/ui'
import { useOverrides } from '../lib/overrides'
import { drivers, fleetDocs, fleetProfiles, fleets, fleetSlug, trucks, type FleetDoc, type Truck } from './data'
import { stateTone } from './Users'

type Tab = 'trucks' | 'drivers' | 'documents'

export const docTone: Record<FleetDoc['state'], Tone> = {
  Verified: 'green',
  'Pending review': 'amber',
  Rejected: 'red',
  'Not uploaded': 'neutral',
}

const truckTone: Record<Truck['state'], Tone> = {
  Available: 'green',
  'On a job': 'blue',
  'Out of service': 'red',
}

export default function FleetDetail() {
  const { id } = useParams()
  const fleet = fleets.find((f) => fleetSlug(f.name) === id)
  const [tab, setTab] = useState<Tab>('trucks')
  const [fleetState, setFleetState] = useOverrides('tsela.fleets.state')
  const [driverState, setDriverState] = useOverrides('tsela.drivers.state')
  const [docState, setDocState] = useOverrides('tsela.fleetdocs.state')

  if (!fleet) {
    return (
      <Card className="flex flex-col items-start gap-3">
        <h1 className="font-display text-2xl font-extrabold">Fleet company not found</h1>
        <p className="text-sm text-muted">This company doesn’t exist or the link is out of date.</p>
        <Link to="/admin/fleets" className="text-sm font-semibold text-brand hover:underline">
          Back to Fleet Companies
        </Link>
      </Card>
    )
  }

  const s = fleetState[fleet.name] ?? fleet.state
  const myTrucks = trucks.filter((t) => t.fleet === fleet.name)
  const myDrivers = drivers.filter((d) => d.fleet === fleet.name)
  const dState = (name: string, base: string) => driverState[name] ?? base
  const profile = fleetProfiles[fleet.name]
  const docs = fleetDocs(fleet.state).map((d) => ({
    ...d,
    state: (docState[`${fleet.name}|${d.name}`] as FleetDoc['state'] | undefined) ?? d.state,
  }))
  const docsToReview = docs.filter((d) => d.state === 'Pending review').length

  return (
    <>
      <Link to="/admin/fleets" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft size={16} aria-hidden /> Fleet Companies
      </Link>

      <PageHeader
        eyebrow="Fleet company"
        title={fleet.name}
        sub={`Primary contact: ${fleet.contact}`}
        actions={
          <>
            <Badge tone={stateTone[s]}>{s}</Badge>
            {s === 'Pending KYC' ? <Button onClick={() => setFleetState(fleet.name, 'Active')}>Approve company</Button> : null}
            {s === 'Active' ? (
              <Button variant="danger" onClick={() => setFleetState(fleet.name, 'Suspended')}>
                Suspend company
              </Button>
            ) : null}
            {s === 'Suspended' ? (
              <Button variant="secondary" onClick={() => setFleetState(fleet.name, 'Active')}>
                Reinstate company
              </Button>
            ) : null}
          </>
        }
      />

      <section aria-label="Company summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Registered trucks" value={fleet.rigs} icon={TruckIcon} />
        <Stat label="Drivers" value={fleet.drivers} icon={IdCard} />
        <Stat label="Subscription plan" value={fleet.plan} icon={Layers} />
        <Stat label="Credit" value={fleet.credit} icon={Banknote} />
      </section>

      {profile ? (
        <Card>
          <h2 className="font-display text-xl font-extrabold">Company details</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ['Company name', fleet.name],
              ['Registration number', profile.regNo],
              ['VAT number', profile.vatNo],
              ['Primary contact', fleet.contact],
              ['Phone', profile.phone],
              ['Email', profile.email],
              ['Business address', profile.address],
              ['Joined Tsela', profile.since],
              ['Subscription plan', fleet.plan],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-muted">{k}</dt>
                <dd className="num mt-0.5 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { key: 'trucks', label: 'Registered trucks', count: fleet.rigs },
          { key: 'drivers', label: 'Drivers', count: fleet.drivers },
          { key: 'documents', label: 'Documents', count: docs.length },
        ]}
      />

      {tab === 'documents' ? (
        <Card className="p-0">
          {docsToReview > 0 ? (
            <p className="border-b border-line bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {docsToReview} document{docsToReview > 1 ? 's' : ''} waiting for review before this company can be approved.
            </p>
          ) : null}
          <Table head={['Document', 'File', 'Uploaded', 'Status']}>
            {docs.map((d) => {
              const key = `${fleet.name}|${d.name}`
              return (
                <tr key={d.name}>
                  <td className="px-3 py-4">
                    <span className="flex items-center gap-2 font-semibold">
                      <FileText size={16} className="text-muted" aria-hidden /> {d.name}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-xs text-muted">
                    {d.file ? `${d.file} • ${d.size}` : '—'}
                  </td>
                  <td className="num px-3 py-4 text-xs text-muted">{d.uploaded}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={docTone[d.state]}>{d.state}</Badge>
                      {d.state === 'Pending review' ? (
                        <>
                          <Button className="h-8 px-3 text-xs" onClick={() => setDocState(key, 'Verified')}>
                            Approve
                          </Button>
                          <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => setDocState(key, 'Rejected')}>
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

      {tab === 'trucks' ? (
        <Card className="p-0">
          <Table head={['Registration', 'Vehicle', 'Type', 'Assigned driver', 'Status']}>
            {myTrucks.map((t) => (
              <tr key={t.plate}>
                <td className="num px-3 py-4 font-semibold">{t.plate}</td>
                <td className="px-3 py-4">{t.vehicle}</td>
                <td className="px-3 py-4 text-xs text-muted">{t.kind}</td>
                <td className="px-3 py-4">{t.driver ?? <span className="text-xs text-muted">Unassigned</span>}</td>
                <td className="px-3 py-4">
                  <Badge tone={truckTone[t.state]}>{t.state}</Badge>
                </td>
              </tr>
            ))}
          </Table>
          {myTrucks.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">No trucks to show for this company yet.</p>
          ) : null}
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Showing {myTrucks.length} of {fleet.rigs} registered trucks
          </p>
        </Card>
      ) : null}

      {tab === 'drivers' ? (
        <Card className="p-0">
          <Table head={['Driver', 'PrDP', 'Truck', 'Account']}>
            {myDrivers.map((d) => {
              const ds = dState(d.name, d.state)
              return (
                <tr key={d.name}>
                  <td className="px-3 py-4 font-semibold">{d.name}</td>
                  <td className="num px-3 py-4 text-xs text-muted">{d.prdp}</td>
                  <td className="num px-3 py-4 text-xs">{d.rig}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <Badge tone={stateTone[ds]}>{ds}</Badge>
                      {ds === 'Pending' ? (
                        <Button className="h-8 px-3 text-xs" onClick={() => setDriverState(d.name, 'Validated')}>
                          Validate
                        </Button>
                      ) : null}
                      {ds === 'Validated' ? (
                        <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => setDriverState(d.name, 'Suspended')}>
                          Suspend
                        </Button>
                      ) : null}
                      {ds === 'Suspended' ? (
                        <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setDriverState(d.name, 'Validated')}>
                          Reinstate
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </Table>
          {myDrivers.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">No drivers to show for this company yet.</p>
          ) : null}
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Showing {myDrivers.length} of {fleet.drivers} drivers. Drivers are added by the company’s fleet manager.
          </p>
        </Card>
      ) : null}
    </>
  )
}
