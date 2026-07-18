import { buildOpenApi } from '@/lib/openapi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public: lets Claude / tooling discover the API without a token.
export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return Response.json(buildOpenApi(base))
}
