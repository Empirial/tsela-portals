import { Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { isSignedIn, signIn } from './auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)

  if (isSignedIn()) return <Navigate to="/admin" replace />

  const emailOk = /\S+@\S+\.\S+/.test(email)
  const passOk = password.length >= 6

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!emailOk || !passOk) return
    signIn()
    navigate('/admin')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy p-4">
      <img src="/signin-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 bg-navy/80" />
      <form
        onSubmit={submit}
        noValidate
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-12 w-auto" />
          <div className="leading-tight">
            <p className="font-display text-xl font-extrabold">TSELA</p>
            <p className="text-[11px] font-bold tracking-wide text-brand">COMMAND CONSOLE</p>
          </div>
        </div>
        <h1 className="font-display text-2xl font-extrabold">Owner sign in</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Oversee users, jobs, payments and subscriptions.</p>

        <label className="block text-sm font-semibold" htmlFor="email">
          Email
        </label>
        <div className="mt-1.5 flex h-12 items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-brand">
          <Mail size={18} className="text-muted" aria-hidden />
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-full flex-1 bg-transparent outline-none"
            placeholder="you@example.com"
          />
        </div>
        {touched && !emailOk ? <p className="mt-1 text-xs font-semibold text-danger">Enter a valid email.</p> : null}

        <label className="mt-4 block text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <div className="mt-1.5 flex h-12 items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-brand">
          <Lock size={18} className="text-muted" aria-hidden />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-full flex-1 bg-transparent outline-none"
            placeholder="At least 6 characters"
          />
        </div>
        {touched && !passOk ? (
          <p className="mt-1 text-xs font-semibold text-danger">Password must be at least 6 characters.</p>
        ) : null}

        <Button type="submit" className="mt-6 h-12 w-full">
          Sign in
        </Button>
        <p className="mt-6 text-center text-xs text-muted">
          <Link to="/" className="font-semibold text-brand hover:underline">
            ← Back to the Tsela website
          </Link>
        </p>
      </form>
    </div>
  )
}
