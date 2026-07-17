import { readFileSync } from 'fs'
import { join } from 'path'

const MIGRATIONS = join(__dirname, '..', '..', 'supabase', 'migrations')
const schema = readFileSync(join(MIGRATIONS, '001_schema.sql'), 'utf8')
const rls = readFileSync(join(MIGRATIONS, '002_rls.sql'), 'utf8')
const functions = readFileSync(join(MIGRATIONS, '003_functions.sql'), 'utf8')

// Owner-scoped domain tables that MUST be isolated per user.
const OWNER_TABLES = [
  'tags',
  'companies',
  'contacts',
  'actions',
  'notes',
  'wishlist_positions',
  'entity_tags',
  'api_tokens',
]

// user_profiles is keyed by id (= auth.uid), not owner_id.
const ALL_TABLES = ['user_profiles', ...OWNER_TABLES]

describe('schema tenancy', () => {
  it.each(OWNER_TABLES)('%s has an owner_id referencing auth.users', (table) => {
    const body = tableBody(schema, table)
    expect(body).toMatch(/owner_id\s+uuid\s+not null\s+references auth\.users\(id\)/i)
  })

  it('every owner_id reference cascades on user delete', () => {
    const refs = schema.match(/owner_id\s+uuid\s+not null\s+references auth\.users\(id\)[^,]*/gi) ?? []
    expect(refs.length).toBe(OWNER_TABLES.length)
    for (const r of refs) expect(r).toMatch(/on delete cascade/i)
  })
})

describe('row level security', () => {
  it.each(ALL_TABLES)('RLS is enabled on %s', (table) => {
    expect(rls).toMatch(new RegExp(`alter table\\s+${table}\\s+enable row level security`, 'i'))
  })

  it.each(OWNER_TABLES)('%s has an owner_id = auth.uid() policy', (table) => {
    const re = new RegExp(`create policy[^;]+on ${table}[^;]+owner_id = auth\\.uid\\(\\)`, 'is')
    expect(rls).toMatch(re)
  })

  it('user_profiles is scoped by id = auth.uid()', () => {
    expect(rls).toMatch(/create policy[^;]+on user_profiles[^;]+id = auth\.uid\(\)/is)
  })
})

describe('bootstrap and helpers', () => {
  it('seeds the required tag categories for new users', () => {
    for (const cat of ['contact_class', 'recruiting_channel', 'action_type', 'wishlist_status']) {
      expect(rls).toContain(`'${cat}'`)
    }
  })

  it('create_contact_bundle enforces company/contact presence', () => {
    expect(functions).toMatch(/create or replace function create_contact_bundle/i)
    expect(functions).toContain('COMPANY_NAME_REQUIRED')
    expect(functions).toContain('CONTACT_NAME_REQUIRED')
    expect(functions).toContain('COMPANY_NOT_FOUND')
  })

  it('exposes contact_last_action for the follow-up dashboard', () => {
    expect(functions).toMatch(/create view contact_last_action/i)
  })
})

/** Extract the column body of a `create table <name> ( ... );` block. */
function tableBody(sql: string, table: string): string {
  const m = sql.match(new RegExp(`create table ${table}\\s*\\(([\\s\\S]*?)\\n\\);`, 'i'))
  if (!m) throw new Error(`table ${table} not found`)
  return m[1]
}
