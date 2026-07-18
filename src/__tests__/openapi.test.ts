import { buildOpenApi } from '@/lib/openapi'
import { SCOPES } from '@/app/api/v1/_lib/scopes'

const spec = buildOpenApi('https://mantis.example.com')

describe('OpenAPI spec', () => {
  it('is OpenAPI 3.1 with a server under /api/v1', () => {
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.servers[0].url).toBe('https://mantis.example.com/api/v1')
  })

  it('documents every implemented endpoint (guards against drift)', () => {
    const paths = Object.keys(spec.paths).sort()
    expect(paths).toEqual(
      [
        '/actions',
        '/companies',
        '/companies/{id}',
        '/contacts',
        '/contacts/{id}',
        '/follow-ups',
        '/inbox',
        '/notes',
        '/search',
        '/tags',
      ].sort()
    )
  })

  it('declares bearer auth', () => {
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
  })

  it('the scope set is exactly the four API scopes', () => {
    expect([...SCOPES].sort()).toEqual(['crm:read', 'crm:write', 'inbox:promote', 'inbox:write'])
  })
})
