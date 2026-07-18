import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { registerMantisTools } from '@/lib/mcp/tools'
import { authenticate } from '@/app/api/v1/_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Streamable-HTTP MCP transport at /api/mcp. Tools register once per init; auth
// reuses the same PAT/JWT verification as the REST API. Identity is carried into
// tool handlers via AuthInfo.extra.
const base = createMcpHandler(
  (server) => {
    registerMantisTools(server)
  },
  { serverInfo: { name: 'mantis', version: '1.0.0' } },
  { basePath: '/api', disableSse: true, maxDuration: 60 }
)

async function verifyBearer(req: Request, token?: string): Promise<AuthInfo | undefined> {
  const ctx = await authenticate(req)
  if (!ctx || !token) return undefined
  return {
    token,
    clientId: ctx.authType,
    scopes: ctx.scopes,
    extra: { userId: ctx.userId, role: ctx.role, authType: ctx.authType },
  }
}

const handler = withMcpAuth(base, verifyBearer, { required: true })

export { handler as GET, handler as POST, handler as DELETE }
