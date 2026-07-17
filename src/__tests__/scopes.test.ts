import {
  classifyToken,
  bearerToken,
  hasScope,
  ROLE_SCOPES,
} from '@/app/api/v1/_lib/scopes'

describe('classifyToken', () => {
  it('treats mnt_ tokens as PATs and others as JWTs', () => {
    expect(classifyToken('mnt_abc')).toBe('pat')
    expect(classifyToken('eyJhbGci.header.sig')).toBe('jwt')
  })
})

describe('bearerToken', () => {
  it('extracts the token from a Bearer header', () => {
    expect(bearerToken('Bearer mnt_abc')).toBe('mnt_abc')
  })
  it('returns null for missing or malformed headers', () => {
    expect(bearerToken(null)).toBeNull()
    expect(bearerToken('Basic xyz')).toBeNull()
    expect(bearerToken('Bearer ')).toBeNull()
  })
})

describe('hasScope', () => {
  it('checks membership', () => {
    expect(hasScope(['crm:read'], 'crm:read')).toBe(true)
    expect(hasScope(['crm:read'], 'inbox:write')).toBe(false)
  })
  it('interactive roles get full CRM + inbox scopes', () => {
    expect(ROLE_SCOPES.user).toEqual(
      expect.arrayContaining(['crm:read', 'crm:write', 'inbox:write'])
    )
  })
})
