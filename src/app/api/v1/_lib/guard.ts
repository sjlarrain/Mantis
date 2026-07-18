import { authenticate, type AuthContext } from './auth'
import { hasScope, type Scope } from './scopes'
import { unauthorized, forbidden } from './respond'

// Authenticate a request and require a scope. Returns the AuthContext on success,
// or a ready-to-return error Response. Callers: `const a = await requireAuth(req,
// 'crm:read'); if (a instanceof Response) return a`.
export async function requireAuth(
  req: Request,
  scope: Scope
): Promise<AuthContext | Response> {
  const ctx = await authenticate(req)
  if (!ctx) return unauthorized()
  if (!hasScope(ctx.scopes, scope)) return forbidden(scope)
  return ctx
}

// Parse a JSON body, returning null on any parse error.
export async function readJson(req: Request): Promise<unknown> {
  return req.json().catch(() => null)
}
