'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { AuthFrame } from '../login/page'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <AuthFrame subtitle="Check your email">
        <p className="text-center text-sm text-muted">
          We sent a confirmation link to <span className="text-ink">{email}</span>. Open it to
          finish creating your account, then sign in.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-accent-ink underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame subtitle="Create your networking desk.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-accent-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  )
}
