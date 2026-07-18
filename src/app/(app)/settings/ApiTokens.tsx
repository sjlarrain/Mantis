'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createToken, revokeToken, type TokenRow } from '@/lib/actions/tokens'
import { SCOPES, type Scope } from '@/app/api/v1/_lib/scopes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Badge } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'

const DEFAULT_SCOPES: Scope[] = ['crm:read', 'crm:write', 'inbox:write']

// Manage personal access tokens (mnt_…) used by Secretariat/WhatsApp and Claude.
export function ApiTokens({ initialTokens }: { initialTokens: TokenRow[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<Scope[]>(DEFAULT_SCOPES)
  const [freshToken, setFreshToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function toggle(s: Scope) {
    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  }

  function create() {
    start(async () => {
      const res = await createToken({ name, scopes })
      if (res.ok) {
        setFreshToken(res.raw)
        setName('')
        setError(null)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Card className="p-4">
      <p className="mb-3 text-sm text-muted">
        Tokens let Secretariat (WhatsApp) and Claude reach your data through the API and MCP. The
        full token is shown once — copy it now.
      </p>

      {freshToken && (
        <div className="mb-4 rounded-[var(--radius)] border border-accent bg-accent-soft p-3">
          <p className="eyebrow mb-1">New token — copy it now</p>
          <code className="block break-all font-mono text-xs text-accent-ink">{freshToken}</code>
          <button
            className="mt-2 text-xs text-accent-ink underline"
            onClick={() => setFreshToken(null)}
          >
            I&apos;ve copied it
          </button>
        </div>
      )}

      <div className="mb-4 space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name (e.g. Secretariat)"
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-3">
          {SCOPES.map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggle(s)} />
              <code className="font-mono text-xs">{s}</code>
            </label>
          ))}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button size="sm" onClick={create} disabled={pending}>
          {pending ? 'Creating…' : 'Create token'}
        </Button>
      </div>

      <ul className="divide-y divide-line">
        {initialTokens.length === 0 && <li className="py-2 text-sm text-faint">No tokens yet.</li>}
        {initialTokens.map((t) => {
          const revoked = t.revoked_at !== null
          return (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {t.name} {revoked && <Badge tone="neutral">revoked</Badge>}
                </p>
                <p className="font-mono text-xs text-faint">
                  {t.scopes.join(' · ')} · created {formatDate(t.created_at)}
                  {t.last_used_at ? ` · last used ${formatDate(t.last_used_at)}` : ''}
                </p>
              </div>
              {!revoked && (
                <RevokeButton id={t.id} onDone={() => router.refresh()} />
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function RevokeButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (window.confirm('Revoke this token? Anything using it will stop working.')) {
          start(async () => { await revokeToken(id); onDone() })
        }
      }}
    >
      Revoke
    </Button>
  )
}
