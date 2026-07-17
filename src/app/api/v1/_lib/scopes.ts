// API scopes and pure token-classification helpers.
// Kept free of DB/network so they can be unit-tested directly.

export const SCOPES = [
  'crm:read',
  'crm:write',
  'inbox:write',
  'inbox:promote',
] as const

export type Scope = (typeof SCOPES)[number]

// Roles map to a default scope set for interactive (JWT/OAuth) sessions.
export const ROLE_SCOPES: Record<'admin' | 'user', Scope[]> = {
  admin: ['crm:read', 'crm:write', 'inbox:write', 'inbox:promote'],
  user: ['crm:read', 'crm:write', 'inbox:write', 'inbox:promote'],
}

export type TokenKind = 'pat' | 'jwt'

/** mnt_-prefixed tokens are PATs; anything else is treated as a Supabase JWT. */
export function classifyToken(token: string): TokenKind {
  return token.startsWith('mnt_') ? 'pat' : 'jwt'
}

/** Extract the bearer token from an Authorization header, or null. */
export function bearerToken(header: string | null): string | null {
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token.length > 0 ? token : null
}

export function hasScope(scopes: Scope[], required: Scope): boolean {
  return scopes.includes(required)
}
