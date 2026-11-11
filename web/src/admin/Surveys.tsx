import { collection, doc, onSnapshot, updateDoc, type Timestamp } from 'firebase/firestore'
import { ClipboardList, Download, Mail, MessageCircle, Phone, Users } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, PageHeader, Stat, Table, Tabs, type Tone } from '../components/ui'
import { db } from '../lib/firebase'
import { surveys as surveyDefs } from '../marketing/surveyData'

// Responses from the public survey pages on the website (saved by the submitSurvey function).

type Status = 'new' | 'contacted' | 'closed'
type Response = {
  id: string
  survey: 'merchants' | 'customers'
  name: string
  phone: string
  email: string
  business: string
  answers: Record<string, string | string[]>
  status: Status
  note: string
  at: number
}

const STATUS: Record<Status, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'amber' },
  contacted: { label: 'Contacted', tone: 'blue' },
  closed: { label: 'Closed', tone: 'neutral' },
}

const def = (slug: Response['survey']) => surveyDefs.find((s) => s.slug === slug)!

/** The one answer that says how warm this lead is. */
const headlineId = (slug: Response['survey']) => (slug === 'merchants' ? 'pilot_participation' : 'platform_interest')
const headline = (r: Response) => {
  const v = r.answers[headlineId(r.survey)]
  return typeof v === 'string' ? v : '—'
}
const warm = (r: Response) => /^yes/i.test(headline(r))

const when = (ms: number) =>
  ms ? new Date(ms).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'

/** South African numbers: 082 123 4567 becomes 27821234567 for WhatsApp. */
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? `27${d.slice(1)}` : d
}

function useResponses() {
  const [rows, setRows] = useState<Response[] | null>(null)
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'surveys'),
        (snap) =>
          setRows(
            snap.docs
              .map((d) => {
                const x = d.data()
                return {
                  id: d.id,
                  survey: x.survey,
                  name: x.name ?? '',
                  phone: x.phone ?? '',
                  email: x.email ?? '',
                  business: x.business ?? '',
                  answers: x.answers ?? {},
                  status: (x.status ?? 'new') as Status,
                  note: x.note ?? '',
                  at: (x.createdAt as Timestamp | null)?.toMillis?.() ?? 0,
                } as Response
              })
              .filter((r) => r.survey === 'merchants' || r.survey === 'customers')
              .sort((a, b) => (b.at || Date.now()) - (a.at || Date.now())),
          ),
        () => setRows([]),
      ),
    [],
  )
  return rows
}

// A cell that starts with = + - @ would run as a formula when opened in Excel, and this text comes from the public.
const csvCell = (v: unknown) => {
  let s = Array.isArray(v) ? v.join('; ') : String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

function exportCsv(list: Response[], slug: 'all' | Response['survey']) {
  const defs = surveyDefs.filter((s) => slug === 'all' || s.slug === slug)
  const qCols = defs.flatMap((s) => s.questions.map((q) => ({ key: `${s.slug}:${q.id}`, head: `${s.slug === 'merchants' ? 'Merchant' : 'Customer'}: ${q.text}`, slug: s.slug, id: q.id })))
  const head = ['Received', 'Survey', 'Name', 'Business', 'Phone', 'Email', 'Status', 'Note', ...qCols.map((c) => c.head)]
  const lines = list.map((r) =>
    [
      when(r.at),
      def(r.survey).title,
      r.name,
      r.business,
      r.phone,
      r.email,
      STATUS[r.status].label,
      r.note,
      ...qCols.map((c) => {
        if (c.slug !== r.survey) return ''
        const other = r.answers[`${c.id}_other`]
        const v = r.answers[c.id]
        return other ? `${Array.isArray(v) ? v.join('; ') : v} (${other})` : v
      }),
    ]
      .map(csvCell)
      .join(','),
  )
  const blob = new Blob([`﻿${[head.map(csvCell).join(','), ...lines].join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `tsela-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

function Detail({ r }: { r: Response }) {
  const [note, setNote] = useState(r.note)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const questions = def(r.survey).questions

  async function save(status: Status, text = note) {
    setSaving(true)
    setError('')
    try {
      await updateDoc(doc(db, 'surveys', r.id), { status, note: text.slice(0, 1000) })
    } catch {
      setError('Could not save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 bg-canvas/60 px-4 py-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        {questions.map((q, i) => {
          const v = r.answers[q.id]
          const other = r.answers[`${q.id}_other`]
          return (
            <div key={q.id}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                {i + 1}. {q.text}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                {Array.isArray(v) ? v.join(' • ') : v || '—'}
                {other ? <span className="text-muted"> ({other})</span> : null}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy hover:bg-canvas">
            <Phone size={15} aria-hidden /> Call
          </a>
          <a href={`https://wa.me/${waNumber(r.phone)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy hover:bg-canvas">
            <MessageCircle size={15} aria-hidden /> WhatsApp
          </a>
          {r.email ? (
            <a href={`mailto:${r.email}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy hover:bg-canvas">
              <Mail size={15} aria-hidden /> Email
            </a>
          ) : null}
        </div>

        <div>
          <label htmlFor={`note-${r.id}`} className="text-xs font-bold uppercase tracking-wide text-muted">
            Follow-up note
          </label>
          <textarea
            id={`note-${r.id}`}
            rows={3}
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS) as Status[]).map((s) => (
            <Button key={s} variant={r.status === s ? 'primary' : 'secondary'} disabled={saving} onClick={() => void save(s)} className="h-9 px-3">
              {s === 'new' ? 'Mark new' : s === 'contacted' ? 'Mark contacted' : 'Mark closed'}
            </Button>
          ))}
          <Button variant="ghost" disabled={saving || note === r.note} onClick={() => void save(r.status)} className="h-9 px-3">
            Save note
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

type Tab = 'all' | Response['survey']

export default function Surveys() {
  const rows = useResponses()
  const [tab, setTab] = useState<Tab>('all')
  const [open, setOpen] = useState<string | null>(null)
  const all = useMemo(() => rows ?? [], [rows])
  const list = useMemo(() => all.filter((r) => tab === 'all' || r.survey === tab), [all, tab])

  const merchants = all.filter((r) => r.survey === 'merchants')
  const customers = all.filter((r) => r.survey === 'customers')

  return (
    <>
      <PageHeader
        eyebrow="Market research"
        title="Survey responses"
        sub="Answers and contact details from the Merchant and Customer surveys on the website. Open a row to read the full answers and follow up."
        actions={
          <Button variant="secondary" icon={Download} disabled={list.length === 0} onClick={() => exportCsv(list, tab)}>
            Export CSV
          </Button>
        }
      />

      <section aria-label="Survey summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total responses" value={all.length} sub={`${all.filter((r) => r.status === 'new').length} waiting for follow-up`} icon={ClipboardList} />
        <Stat label="Mechanics & merchants" value={merchants.length} sub={`${merchants.filter(warm).length} keen to join the pilot`} icon={Users} />
        <Stat label="Motorists & fleets" value={customers.length} sub={`${customers.filter(warm).length} would use the platform`} icon={Users} />
        <Stat label="Contacted" value={all.filter((r) => r.status !== 'new').length} sub="Marked contacted or closed" dark />
      </section>

      <Tabs<Tab>
        value={tab}
        onChange={(t) => {
          setTab(t)
          setOpen(null)
        }}
        items={[
          { key: 'all', label: 'All', count: all.length },
          { key: 'merchants', label: 'Merchants', count: merchants.length },
          { key: 'customers', label: 'Customers', count: customers.length },
        ]}
      />

      <Card className="p-0">
        <Table head={['Received', 'Name', 'Business', 'Phone', 'Survey', 'Interest', 'Status']}>
          {rows === null ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">
                Loading…
              </td>
            </tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">
                No responses yet. They appear here as soon as someone submits a survey.
              </td>
            </tr>
          ) : null}
          {list.map((r) => {
            const isOpen = open === r.id
            return (
              <Fragment key={r.id}>
                <tr className={isOpen ? 'bg-tint/60' : 'hover:bg-canvas/70'}>
                  <td className="px-3 py-4 text-muted">{when(r.at)}</td>
                  <td className="px-3 py-4">
                    <button
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : r.id)}
                      className="text-left font-semibold text-navy underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      {r.name}
                    </button>
                    {r.email ? <p className="text-xs text-muted">{r.email}</p> : null}
                  </td>
                  <td className="px-3 py-4">{r.business || <span className="text-muted">—</span>}</td>
                  <td className="num px-3 py-4">{r.phone}</td>
                  <td className="px-3 py-4">
                    <Badge tone={r.survey === 'merchants' ? 'blue' : 'green'}>{r.survey === 'merchants' ? 'Merchant' : 'Customer'}</Badge>
                  </td>
                  <td className="px-3 py-4">
                    <span className={warm(r) ? 'font-semibold text-ok' : 'text-ink'}>{headline(r)}</span>
                  </td>
                  <td className="px-3 py-4">
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  </td>
                </tr>
                {isOpen ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <Detail r={r} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </Table>
      </Card>
    </>
  )
}
