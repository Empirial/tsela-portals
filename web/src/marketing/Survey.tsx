import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Clock, Send, Truck, Wrench } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { submitSurvey, type Answers, type SurveyContact } from '../lib/survey'
import { SiteFooter, SiteHeader } from './SiteChrome'
import { surveyBySlug, surveys, type Question, type Survey } from './surveyData'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-deep text-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-20">{children}</main>
      <SiteFooter />
    </div>
  )
}

/** /survey: lets a visitor pick the right survey. */
export function SurveyIndex() {
  useEffect(() => {
    document.title = 'Surveys | Tsela Assist'
  }, [])
  const icons = { merchants: Wrench, customers: Truck }
  return (
    <Shell>
      <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">Help shape Tsela Assist</h1>
      <p className="mt-4 max-w-xl text-lg text-white/80">Two short surveys, about 3 minutes each. Pick the one that fits you.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {surveys.map((s) => {
          const Icon = icons[s.slug]
          return (
            <Link
              key={s.slug}
              to={`/survey/${s.slug}`}
              className="group flex h-full items-start gap-4 rounded-md bg-white/[0.08] p-5 hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-lime"
            >
              <Icon size={24} className="mt-1 shrink-0 text-lime" aria-hidden />
              <span className="flex-1">
                <span className="block text-sm font-bold tracking-wide text-lime uppercase">{s.kicker}</span>
                <span className="mt-1 block font-display text-xl font-extrabold">{s.title}</span>
                <span className="mt-1 block text-sm text-white/70">{s.audience}</span>
              </span>
              <ArrowRight size={20} className="mt-1 shrink-0 text-white/60 group-hover:text-white" aria-hidden />
            </Link>
          )
        })}
      </div>
    </Shell>
  )
}

const field =
  'w-full rounded-md border border-white/20 bg-white/10 px-4 text-white placeholder:text-white/50 focus-visible:border-lime focus-visible:outline-2 focus-visible:outline-lime'

function Choice({
  type,
  name,
  label,
  checked,
  onChange,
}: {
  type: 'radio' | 'checkbox'
  name: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-md border px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lime ${
        checked ? 'border-lime bg-lime/10' : 'border-white/20 bg-white/[0.06] hover:bg-white/[0.1]'
      }`}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
          type === 'radio' ? 'rounded-full' : 'rounded'
        } ${checked ? 'border-lime bg-lime' : 'border-white/50'}`}
      >
        {checked && <span className={`h-2 w-2 bg-deep ${type === 'radio' ? 'rounded-full' : 'rounded-[1px]'}`} />}
      </span>
      <span className="text-white/90">{label}</span>
    </label>
  )
}

function QuestionBlock({
  q,
  n,
  answers,
  setAnswer,
  error,
}: {
  q: Question
  n: number
  answers: Answers
  setAnswer: (id: string, v: string | string[]) => void
  error: boolean
}) {
  const value = answers[q.id]
  const other = (answers[`${q.id}_other`] as string | undefined) ?? ''
  const picked = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o)
  const showOther = q.options?.includes('Other') && picked('Other')

  const toggle = (o: string) => {
    if (q.type === 'multi') {
      const cur = Array.isArray(value) ? value : []
      setAnswer(q.id, cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o])
    } else setAnswer(q.id, o)
  }

  return (
    <fieldset id={`q-${q.id}`} className="scroll-mt-6 border-0 p-0" aria-describedby={error ? `e-${q.id}` : undefined}>
      <legend className="mb-1 text-lg leading-snug font-semibold">
        <span className="text-lime">{n}.</span> {q.text}
      </legend>
      {q.hint && <p className="mb-3 text-sm text-white/70">{q.hint}</p>}
      {q.type === 'long' ? (
        <textarea
          aria-label={q.text}
          rows={5}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setAnswer(q.id, e.target.value)}
          placeholder="Type your answer here"
          className={`${field} mt-2 py-3`}
        />
      ) : (
        <div className={`mt-2 grid gap-2 ${q.options!.length >= 4 ? 'md:grid-cols-2' : ''}`}>
          {q.options!.map((o) => (
            <Choice
              key={o}
              type={q.type === 'multi' ? 'checkbox' : 'radio'}
              name={q.id}
              label={o}
              checked={picked(o)}
              onChange={() => toggle(o)}
            />
          ))}
          {showOther && (
            <input
              type="text"
              aria-label="Please specify"
              value={other}
              onChange={(e) => setAnswer(`${q.id}_other`, e.target.value)}
              placeholder="Please specify"
              maxLength={200}
              className={`${field} h-12 md:col-span-2`}
            />
          )}
        </div>
      )}
      {error && (
        <p id={`e-${q.id}`} role="alert" className="mt-2 text-sm font-semibold text-amber">
          Please answer this question.
        </p>
      )}
    </fieldset>
  )
}

const isAnswered = (q: Question, a: Answers) => {
  const v = a[q.id]
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0
  return typeof v === 'string' && v.trim().length > 0
}

type ContactErrors = Partial<Record<keyof SurveyContact, string>>

function ContactSection({
  survey,
  contact,
  setContact,
  errors,
}: {
  survey: Survey
  contact: SurveyContact
  setContact: (c: SurveyContact) => void
  errors: ContactErrors
}) {
  const merchant = survey.slug === 'merchants'
  const set = (k: keyof SurveyContact, v: string | boolean) => setContact({ ...contact, [k]: v })
  const Err = ({ k }: { k: keyof SurveyContact }) =>
    errors[k] ? (
      <p id={`e-contact-${k}`} role="alert" className="mt-1 text-sm font-semibold text-amber">
        {errors[k]}
      </p>
    ) : null
  const lab = 'mb-1 block text-sm font-semibold text-white/90'

  return (
    <section id="q-contact" className="flex scroll-mt-6 flex-col gap-4">
      <h2 className="border-b border-white/15 pb-2 font-display text-sm font-extrabold tracking-wide text-lime uppercase">
        Your contact details
      </h2>
      <p className="text-sm text-white/70">
        So that we can follow up with you. We only use these details to contact you about Tsela Assist.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={lab}>
            Full name
          </label>
          <input
            id="c-name"
            autoComplete="name"
            value={contact.name}
            onChange={(e) => set('name', e.target.value)}
            maxLength={100}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'e-contact-name' : undefined}
            className={`${field} h-12`}
          />
          <Err k="name" />
        </div>
        <div>
          <label htmlFor="c-phone" className={lab}>
            Mobile or WhatsApp number
          </label>
          <input
            id="c-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={contact.phone}
            onChange={(e) => set('phone', e.target.value)}
            maxLength={30}
            placeholder="e.g. 082 123 4567"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'e-contact-phone' : undefined}
            className={`${field} h-12`}
          />
          <Err k="phone" />
        </div>
        <div>
          <label htmlFor="c-email" className={lab}>
            Email address <span className="font-normal text-white/60">(optional)</span>
          </label>
          <input
            id="c-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={contact.email}
            onChange={(e) => set('email', e.target.value)}
            maxLength={150}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'e-contact-email' : undefined}
            className={`${field} h-12`}
          />
          <Err k="email" />
        </div>
        <div>
          <label htmlFor="c-business" className={lab}>
            {merchant ? 'Business name' : 'Company or organisation'}{' '}
            {!merchant && <span className="font-normal text-white/60">(optional)</span>}
          </label>
          <input
            id="c-business"
            autoComplete="organization"
            value={contact.business}
            onChange={(e) => set('business', e.target.value)}
            maxLength={150}
            aria-invalid={!!errors.business}
            aria-describedby={errors.business ? 'e-contact-business' : undefined}
            className={`${field} h-12`}
          />
          <Err k="business" />
        </div>
      </div>
      <div>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lime ${
            contact.consent ? 'border-lime bg-lime/10' : 'border-white/20 bg-white/[0.06]'
          }`}
        >
          <input
            type="checkbox"
            checked={contact.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-describedby={errors.consent ? 'e-contact-consent' : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-lime"
          />
          <span className="text-sm text-white/90">
            I agree that Tsela Assist may contact me about my answers and the Tsela Assist platform, and store my
            details for that purpose.
          </span>
        </label>
        <Err k="consent" />
      </div>
    </section>
  )
}

function Progress({ answered, total }: { answered: number; total: number }) {
  return (
    <div>
      <div
        role="progressbar"
        aria-label="Questions answered"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        className="h-2 overflow-hidden rounded-full bg-white/15"
      >
        <div className="h-full bg-lime transition-[width]" style={{ width: `${(answered / total) * 100}%` }} />
      </div>
      <p className="mt-2 text-sm text-white/70">
        {answered} of {total} questions answered
      </p>
    </div>
  )
}

function SurveyForm({ survey }: { survey: Survey }) {
  const [answers, setAnswers] = useState<Answers>({})
  const [missing, setMissing] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [done, setDone] = useState(false)
  const [contact, setContact] = useState<SurveyContact>({ name: '', phone: '', email: '', business: '', consent: false })
  const [contactErrors, setContactErrors] = useState<ContactErrors>({})

  useEffect(() => {
    document.title = `${survey.title} | Tsela Assist`
    window.scrollTo(0, 0)
  }, [survey])

  const answered = useMemo(() => survey.questions.filter((q) => isAnswered(q, answers)).length, [survey, answers])
  const total = survey.questions.length

  const setAnswer = (id: string, v: string | string[]) => {
    setAnswers((a) => ({ ...a, [id]: v }))
    setMissing((m) => m.filter((x) => x !== id))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (form.get('website')) return setDone(true) // hidden trap field: only bots fill it in

    const gaps = survey.questions.filter((q) => !isAnswered(q, answers)).map((q) => q.id)
    setMissing(gaps)
    const errs: ContactErrors = {}
    if (!contact.name.trim()) errs.name = 'Please enter your name.'
    if (contact.phone.replace(/\D/g, '').length < 9) errs.phone = 'Please enter a valid phone number.'
    if (contact.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email.trim()))
      errs.email = 'That email address does not look right.'
    if (survey.slug === 'merchants' && !contact.business.trim()) errs.business = 'Please enter your business name.'
    if (!contact.consent) errs.consent = 'Please tick the box so we can contact you.'
    setContactErrors(errs)
    if (gaps.length || Object.keys(errs).length) {
      const target = gaps.length ? `q-${gaps[0]}` : 'q-contact'
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSending(true)
    setFailed(false)
    try {
      await submitSurvey({ survey: survey.slug, answers, contact })
      setDone(true)
      window.scrollTo(0, 0)
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl rounded-md bg-white/[0.08] p-8 text-center">
          <CheckCircle2 size={48} className="mx-auto text-lime" aria-hidden />
          <h1 className="mt-4 font-display text-3xl font-extrabold">Thank you</h1>
          <p className="mt-3 text-white/85">{survey.thanks}</p>
          <p className="mt-6 text-sm text-white/60">{survey.note}</p>
          <Link
            to="/"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-brand px-6 text-sm font-semibold hover:bg-brand-dark"
          >
            Back to the Tsela Assist site
          </Link>
        </div>
      </Shell>
    )
  }

  let lastSection = ''
  return (
    <Shell>
      <p className="flex items-center gap-3 text-sm font-bold tracking-wide text-lime uppercase">
        <span className="h-px w-8 bg-lime" /> {survey.kicker}
      </p>
      <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
        {survey.title}
      </h1>
      <p className="mt-3 max-w-3xl text-lg font-semibold text-white/90">{survey.tagline}</p>
      <div className="max-w-3xl">
        {survey.intro.map((p) => (
          <p key={p} className="mt-3 text-white/80">
            {p}
          </p>
        ))}
      </div>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-sm font-semibold">
        <Clock size={16} className="text-lime" aria-hidden /> Estimated completion time: {survey.minutes} minutes
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
        {/* Trap field for bots: people never see it. */}
        <div aria-hidden className="absolute -left-[9999px]">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {survey.questions.map((q, i) => {
          const heading = q.section !== lastSection ? q.section : null
          lastSection = q.section
          return (
            <section key={q.id} className="flex flex-col gap-4">
              {heading && (
                <h2 className="border-b border-white/15 pb-2 font-display text-sm font-extrabold tracking-wide text-lime uppercase">
                  {heading}
                </h2>
              )}
              <QuestionBlock q={q} n={i + 1} answers={answers} setAnswer={setAnswer} error={missing.includes(q.id)} />
            </section>
          )
        })}

        <ContactSection
          survey={survey}
          contact={contact}
          setContact={(c) => {
            setContact(c)
            setContactErrors({})
          }}
          errors={contactErrors}
        />

        <div className="flex flex-col gap-3">
          <div className="lg:hidden">
            <Progress answered={answered} total={total} />
          </div>
          {failed && (
            <p role="alert" className="text-sm font-semibold text-amber">
              We could not send your answers. Check your connection and try again.
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-semibold hover:bg-brand-dark disabled:opacity-60 sm:w-auto sm:self-start"
          >
            <Send size={18} aria-hidden /> {sending ? 'Sending…' : 'Submit survey'}
          </button>
          <p className="text-sm text-white/60">{survey.note}</p>
        </div>
      </form>

      <aside className="hidden rounded-md bg-white/[0.08] p-6 lg:sticky lg:top-28 lg:block">
        <p className="font-display text-lg font-extrabold">Your progress</p>
        <div className="mt-4">
          <Progress answered={answered} total={total} />
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-white/80">
          <Clock size={16} className="text-lime" aria-hidden /> About {survey.minutes} minutes
        </p>
        <p className="mt-4 text-sm text-white/60">{survey.note}</p>
      </aside>
      </div>
    </Shell>
  )
}

export default function SurveyPage() {
  const { slug } = useParams()
  const survey = surveyBySlug(slug)
  if (!survey) return <Navigate to="/survey" replace />
  return <SurveyForm key={survey.slug} survey={survey} />
}
