import { mintToken, hashToken, isPAT } from '@/lib/auth/tokens'

describe('PAT tokens', () => {
  it('mints an mnt_-prefixed raw token with a matching hash', () => {
    const { raw, hash } = mintToken()
    expect(raw.startsWith('mnt_')).toBe(true)
    expect(isPAT(raw)).toBe(true)
    expect(hash).toBe(hashToken(raw))
  })

  it('hashes deterministically and never returns the raw token', () => {
    const { raw, hash } = mintToken()
    expect(hash).toHaveLength(64) // sha256 hex
    expect(hash).not.toContain(raw)
    expect(hashToken(raw)).toBe(hash)
  })

  it('mints unique tokens', () => {
    const a = mintToken()
    const b = mintToken()
    expect(a.raw).not.toBe(b.raw)
    expect(a.hash).not.toBe(b.hash)
  })

  it('rejects non-PAT tokens', () => {
    expect(isPAT('eyJhbGciOi...')).toBe(false)
    expect(isPAT('ggc_something')).toBe(false)
  })
})
