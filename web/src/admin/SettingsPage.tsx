import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, PageHeader, Toggle } from '../components/ui'
import { defaultSettings, useSettings, type Settings } from '../lib/settings'

function NumberField({
  label,
  hint,
  value,
  onChange,
  suffix,
  prefix,
  min = 0,
  max,
  error,
  id,
}: {
  label: string
  hint?: string
  value: number
  onChange: (n: number) => void
  suffix?: string
  prefix?: string
  min?: number
  max?: number
  error?: string
  id: string
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      <div
        className={`mt-1.5 flex h-11 items-center gap-2 rounded-lg border bg-white px-3 focus-within:border-brand ${
          error ? 'border-danger' : 'border-slate-300'
        }`}
      >
        {prefix ? <span className="text-sm text-muted">{prefix}</span> : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
          className="num h-full min-w-0 flex-1 bg-transparent outline-none"
        />
        {suffix ? <span className="text-sm text-muted">{suffix}</span> : null}
      </div>
      {error ? <p className="mt-1 text-xs font-semibold text-danger">{error}</p> : null}
    </div>
  )
}

export default function SettingsPage() {
  const { settings, save, reset } = useSettings()
  const [draft, setDraft] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const errors = {
    feePct: !(draft.feePct >= 0 && draft.feePct <= 30) ? 'Enter a fee between 0% and 30%.' : '',
    vatPct: !(draft.vatPct >= 0 && draft.vatPct <= 30) ? 'Enter a VAT rate between 0% and 30%.' : '',
    areas: draft.corridors.some((c) => !c.name.trim() || !(c.radiusKm >= 5 && c.radiusKm <= 150))
      ? 'Every area needs a name and a dispatch radius of 5 to 150 km.'
      : '',
  }
  const invalid = Object.values(errors).some(Boolean)

  const setCorridor = (id: string, patch: Partial<Settings['corridors'][number]>) =>
    setDraft((d) => ({
      ...d,
      corridors: d.corridors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))

  const addCorridor = () =>
    setDraft((d) => ({
      ...d,
      corridors: [...d.corridors, { id: `area-${Date.now()}`, name: '', route: '', enabled: true, radiusKm: 50 }],
    }))

  const removeCorridor = (id: string) =>
    setDraft((d) => ({ ...d, corridors: d.corridors.filter((c) => c.id !== id) }))

  const doSave = () => {
    if (invalid) return
    save(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <PageHeader
        eyebrow="Commercial & admin"
        title="Platform Settings"
        sub="Platform fee percentage, and the areas where Tsela Assist does business."
        actions={
          <>
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={() => {
                reset()
                setDraft(defaultSettings)
              }}
            >
              Restore defaults
            </Button>
            <Button icon={Save} disabled={!dirty || invalid} onClick={doSave}>
              Save changes
            </Button>
          </>
        }
      />

      {saved ? (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Settings saved. The overview and payments pages now use the new fee.
        </p>
      ) : null}

      <div className="grid gap-6">
        <Card className="flex flex-col gap-5">
          <h2 className="font-display text-xl font-extrabold">Platform fee &amp; tax</h2>
          <NumberField
            id="fee"
            label="Platform fee"
            hint="Tsela Assist's cut of each completed job. Shown on every invoice and payout."
            value={draft.feePct}
            suffix="%"
            max={30}
            onChange={(n) => setDraft((d) => ({ ...d, feePct: n }))}
            error={errors.feePct}
          />
          <NumberField
            id="vat"
            label="VAT rate"
            hint="Applied to itemised invoices."
            value={draft.vatPct}
            suffix="%"
            max={30}
            onChange={(n) => setDraft((d) => ({ ...d, vatPct: n }))}
            error={errors.vatPct}
          />
        </Card>

      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold">Coverage areas</h2>
            <p className="mt-1 text-sm text-muted">
              The areas where you do business. Fleets can only request a mechanic inside an enabled area, within its
              dispatch radius.
            </p>
          </div>
          <Button variant="secondary" icon={Plus} onClick={addCorridor}>
            Add coverage area
          </Button>
        </div>
        {errors.areas ? <p className="mt-3 text-xs font-semibold text-danger">{errors.areas}</p> : null}
        {draft.corridors.length === 0 ? (
          <p className="mt-4 rounded-xl bg-tint p-4 text-sm text-muted">
            No coverage areas yet. Add the first area you want to operate in.
          </p>
        ) : null}
        <ul className="mt-4 divide-y divide-line">
          {draft.corridors.map((cor) => (
            <li key={cor.id} className="flex flex-wrap items-center gap-4 py-4">
              <Toggle
                checked={cor.enabled}
                onChange={(v) => setCorridor(cor.id, { enabled: v })}
                label={`${cor.name || 'New area'} enabled`}
              />
              <div className="grid min-w-64 flex-1 gap-2 sm:grid-cols-2">
                <input
                  value={cor.name}
                  onChange={(e) => setCorridor(cor.id, { name: e.target.value })}
                  placeholder="Area name, e.g. N1 Western"
                  aria-label="Area name"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-brand"
                />
                <input
                  value={cor.route}
                  onChange={(e) => setCorridor(cor.id, { route: e.target.value })}
                  placeholder="Route or towns covered"
                  aria-label="Route or towns covered"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted">Dispatch radius</span>
                <input
                  type="number"
                  min={5}
                  max={150}
                  disabled={!cor.enabled}
                  value={Number.isNaN(cor.radiusKm) ? '' : cor.radiusKm}
                  onChange={(e) => setCorridor(cor.id, { radiusKm: e.target.value === '' ? NaN : Number(e.target.value) })}
                  className="num h-10 w-20 rounded-lg border border-slate-300 px-2 text-right outline-none focus:border-brand disabled:opacity-50"
                  aria-label={`${cor.name || 'New area'} dispatch radius in km`}
                />
                <span className="text-muted">km</span>
              </label>
              <button
                aria-label={`Remove ${cor.name || 'area'}`}
                onClick={() => removeCorridor(cor.id)}
                className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-danger"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
