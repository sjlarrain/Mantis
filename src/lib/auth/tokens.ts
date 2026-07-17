import { createHash, randomBytes } from 'crypto'

// Personal access tokens for server-to-server callers (Secretariat, Claude).
// The raw token is shown once at creation; only its SHA-256 hash is stored.
const PREFIX = 'mnt_'

export function mintToken(): { raw: string; hash: string } {
  const raw = PREFIX + randomBytes(32).toString('hex')
  return { raw, hash: hashToken(raw) }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function isPAT(token: string): boolean {
  return token.startsWith(PREFIX)
}
