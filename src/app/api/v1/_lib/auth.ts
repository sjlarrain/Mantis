import { supabaseAdmin } from '@/lib/supabase/admin'
import { hashToken } from '@/lib/auth/tokens'
import {
  ROLE_SCOPES,
  bearerToken,
  classifyToken,
  hasScope,
  type Scope,
} from './scopes'

export type { Scope }
export { hasScope }

export interface AuthContext {
  userId: string
  role: 'admin' | 'user'
  scopes: Scope[]
  authType: 'jwt' | 'pat'
}

/**
 * Authenticate an API request from its Authorization header.
 * Accepts a Supabase JWT (interactive) or an mnt_ PAT (server-to-server).
 * Returns null when no valid credential is present.
 */
export async function authenticate(req: Request): Promise<AuthContext | null> {
  const token = bearerToken(req.headers.get('authorization'))
  if (!token) return null
  return classifyToken(token) === 'pat' ? verifyPAT(token) : verifyJWT(token)
}

async function verifyPAT(raw: string): Promise<AuthContext | null> {
  const hash = hashToken(raw)
  const { data: pat } = await supabaseAdmin
    .from('api_tokens')
    .select('owner_id, scopes, expires_at, revoked_at')
    .eq('token_hash', hash)
    .single()

  if (!pat || pat.revoked_at) return null
  if (pat.expires_at && new Date(pat.expires_at) < new Date()) return null

  // Fire-and-forget last-used bump.
  void supabaseAdmin
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', hash)

  const role = await roleFor(pat.owner_id)
  return { userId: pat.owner_id, role, scopes: pat.scopes as Scope[], authType: 'pat' }
}

async function verifyJWT(jwt: string): Promise<AuthContext | null> {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(jwt)
  if (error || !user) return null

  const role = await roleFor(user.id)
  return { userId: user.id, role, scopes: ROLE_SCOPES[role], authType: 'jwt' }
}

async function roleFor(userId: string): Promise<'admin' | 'user'> {
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return (data?.role ?? 'user') as 'admin' | 'user'
}
