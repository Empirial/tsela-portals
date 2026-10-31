import { RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, PageHeader, Toggle } from '../components/ui'
import { zar } from '../lib/format'
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
    baseFee: !(draft.callout.baseFee >= 0) ? 'Enter an amount of R0 or more.' : '',
    heavy: !(draft.callout.heavyRigSurcharge >= 0) ? 'Enter an amount of R0 or more.' : '',
    night: !(draft.callout.nightSurchargePct >= 0 && draft.callout.nightSurchargePct <= 100) ? 'Enter 0% to 100%.' : '',
    incl: !(draft.callout.includedKm >= 0) ? 'Enter 0 km or more.' : '',
    perKm: !(draft.callout.perExtraKm >= 0) ? 'Enter an amount of R0 or more.' : '',
  }
  const invalid = Object.values(errors).some(Boolean)

  const setCallout = (k: keyof Settings['callout']) => (n: number) =>
    setDraft((d) => ({ ...d, callout: { ...d.callout, [k]: n } }))

  const setCorridor = (id: string, patch: Partial<Settings['corridors'][number]>) =>
    setDraft((d) => ({
      ...d,
      corridors: d.corridors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))

  // Worked example so the owner can sanity-check the rules before saving
  const exKm = 22
  const c = draft.callout
  const exBase = c.baseFee + c.heavyRigSurcharge
  const exDist = Math.max(0, exKm - c.includedKm) * c.perExtraKm
  const exNight = ((exBase + exDist) * c.nightSurchargePct) / 100
  const exTotal = exBase + exDist + exNight
  const valid = !invalid
  const exFee = (exTotal * draft.feePct) / 100

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
        sub="Platform fee percentage, call-out pricing rules and the areas Tsela covers."
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-5">
          <h2 className="font-display text-xl font-extrabold">Platform fee &amp; tax</h2>
          <NumberField
            id="fee"
            label="Platform fee"
            hint="Tsela's cut of each completed job. Shown on every invoice and payout."
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

        <Card className="flex flex-col gap-5">
          <h2 className="font-display text-xl font-extrabold">Call-out pricing rules</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="base" label="Base call-out fee" prefix="R" value={c.baseFee} onChange={setCallout('baseFee')} error={errors.baseFee} />
            <NumberField id="heavy" label="Heavy rig surcharge" prefix="R" value={c.heavyRigSurcharge} onChange={setCallout('heavyRigSurcharge')} error={errors.heavy} />
            <NumberField id="night" label="Night surcharge" suffix="%" max={100} value={c.nightSurchargePct} onChange={setCallout('nightSurchargePct')} error={errors.night} />
            <NumberField id="incl" label="Included distance" suffix="km" value={c.includedKm} onChange={setCallout('includedKm')} error={errors.incl} />
            <NumberField id="perkm" label="Per extra km" prefix="R" value={c.perExtraKm} onChange={setCallout('perExtraKm')} error={errors.perKm} />
          </div>
          <div className="rounded-xl bg-tint p-4 text-sm">
            <p className="font-semibold">Example: heavy rig, {exKm} km away, at night</p>
            {valid ? (
              <>
                <p className="num mt-1 text-muted">
                  Call-out {zar(exBase)} + distance {zar(exDist)} + night {zar(exNight)}
                </p>
                <p className="num font-display text-xl font-extrabold">{zar(exTotal)}</p>
                <p className="num text-xs text-muted">
                  Tsela fee at {draft.feePct}%: {zar(exFee)} • Mechanic receives {zar(exTotal - exFee)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-danger">Fix the highlighted fields to see the example.</p>
            )}
          </div>
          <p className="text-xs text-muted">
            These rules are placeholders. Set the amounts you actually want to charge.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-xl font-extrabold">Coverage areas</h2>
        <p className="mt-1 text-sm text-muted">
          Corridors where fleets can request a mechanic, and how far from the road a van may be dispatched.
        </p>
        <ul className="mt-4 divide-y divide-line">
          {draft.corridors.map((cor) => (
            <li key={cor.id} className="flex flex-wrap items-center gap-4 py-4">
              <Toggle
                checked={cor.enabled}
                onChange={(v) => setCorridor(cor.id, { enabled: v })}
                label={`${cor.name} enabled`}
              />
              <div className="min-w-48 flex-1">
                <p className="font-semibold">{cor.name}</p>
                <p className="text-xs text-muted">{cor.route}</p>
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
                  aria-label={`${cor.name} dispatch radius in km`}
                />
                <span className="text-muted">km</span>
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
