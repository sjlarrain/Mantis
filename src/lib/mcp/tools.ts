/**
 * MCP tool surface for Mantis — the agent's "hands" for the networking CRM.
 * Each tool mirrors a REST operation and reuses the same building blocks:
 * supabaseAdmin, the create_contact_bundle RPC, and the dashboard computation.
 * Identity arrives via withMcpAuth's verifier in extra.authInfo.extra and is
 * checked with hasScope — the same contract as the REST API. Everything is
 * owner-scoped to the authenticated user.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type { ServerRequest, ServerNotification, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

import { hasScope, type Scope } from '@/app/api/v1/_lib/scopes'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { syncNextFollowUp } from '@/lib/followup-sync'
import { computeDashboard } from '@/lib/dashboard-core'
import { mapBundleError } from '@/lib/contacts-helpers'

type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>
interface Ctx {
  userId: string
  scopes: Scope[]
}

function toolOk(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}
function toolErr(message: string): CallToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true }
}

function guard(extra: Extra, scope: Scope): { ctx: Ctx } | { error: CallToolResult } {
  const info = extra.authInfo
  const meta = info?.extra as { userId?: string } | undefined
  if (!info || !meta?.userId) return { error: toolErr('Unauthorized') }
  const scopes = (info.scopes ?? []) as Scope[]
  if (!hasScope(scopes, scope)) return { error: toolErr(`Forbidden: missing scope ${scope}`) }
  return { ctx: { userId: meta.userId, scopes } }
}

export function registerMantisTools(server: McpServer): void {
  server.registerTool(
    'mantis_search',
    {
      title: 'Search',
      description: 'Search companies, contacts, and notes by text. Use before creating records to avoid duplicates.',
      inputSchema: { q: z.string().min(2).describe('Search text, ≥2 chars') },
    },
    async ({ q }, extra) => {
      const g = guard(extra, 'crm:read'); if ('error' in g) return g.error
      const like = `%${q}%`
      const [companies, contacts, notes] = await Promise.all([
        supabaseAdmin.from('companies').select('id, name').eq('owner_id', g.ctx.userId).is('deleted_at', null).ilike('name', like).limit(10),
        supabaseAdmin.from('contacts').select('id, full_name, company:companies(id, name)').eq('owner_id', g.ctx.userId).is('deleted_at', null).ilike('full_name', like).limit(10),
        supabaseAdmin.from('notes').select('id, body, contact_id').eq('owner_id', g.ctx.userId).ilike('body', like).limit(10),
      ])
      return toolOk({ companies: companies.data ?? [], contacts: contacts.data ?? [], notes: notes.data ?? [] })
    }
  )

  server.registerTool(
    'mantis_get_contact',
    {
      title: 'Get contact profile',
      description: 'Fetch one contact with its company, actions, and notes (the full profile/timeline).',
      inputSchema: { id: z.string().uuid() },
    },
    async ({ id }, extra) => {
      const g = guard(extra, 'crm:read'); if ('error' in g) return g.error
      const { data } = await supabaseAdmin
        .from('contacts')
        .select('*, company:companies(id, name), actions(*), notes(*)')
        .eq('id', id).eq('owner_id', g.ctx.userId).is('deleted_at', null).maybeSingle()
      if (!data) return toolErr('Not found')
      return toolOk(data)
    }
  )

  server.registerTool(
    'mantis_create_contact',
    {
      title: 'Create contact',
      description: 'Create a contact, creating its company inline if needed (link by id or create by name). Atomic — never leaves a company-less contact.',
      inputSchema: {
        company: z.union([z.object({ id: z.string().uuid() }), z.object({ name: z.string().min(1) })]).describe('Existing company {id} or new {name}'),
        full_name: z.string().min(1),
        title_free: z.string().optional(),
        class_tag_id: z.string().uuid().optional(),
        how_i_know: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        linkedin_url: z.string().optional(),
      },
    },
    async (args, extra) => {
      const g = guard(extra, 'crm:write'); if ('error' in g) return g.error
      const { company, ...contact } = args
      const { data, error } = await supabaseAdmin.rpc('create_contact_bundle', {
        p_owner: g.ctx.userId, p_company: company, p_contact: contact, p_action: null, p_note: null,
      })
      if (error) return toolErr(mapBundleError(error.message))
      return toolOk(data)
    }
  )

  server.registerTool(
    'mantis_log_action',
    {
      title: 'Log action',
      description: 'Log a touchpoint (meeting, outreach, reply…) on a contact, optionally with a follow-up date.',
      inputSchema: {
        contact_id: z.string().uuid(),
        type_tag_id: z.string().uuid().optional(),
        occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        summary: z.string().optional(),
        follow_up_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      },
    },
    async (args, extra) => {
      const g = guard(extra, 'crm:write'); if ('error' in g) return g.error
      const { data: contact } = await supabaseAdmin.from('contacts').select('id').eq('id', args.contact_id).eq('owner_id', g.ctx.userId).maybeSingle()
      if (!contact) return toolErr('Contact not found')
      const { data, error } = await supabaseAdmin.from('actions').insert({ owner_id: g.ctx.userId, ...args, source: 'claude' }).select('*').single()
      if (error) return toolErr(error.message)
      await syncNextFollowUp(supabaseAdmin, args.contact_id, g.ctx.userId)
      return toolOk(data)
    }
  )

  server.registerTool(
    'mantis_add_note',
    {
      title: 'Add note',
      description: 'Add a note to a contact.',
      inputSchema: { contact_id: z.string().uuid(), body: z.string().min(1) },
    },
    async ({ contact_id, body }, extra) => {
      const g = guard(extra, 'crm:write'); if ('error' in g) return g.error
      const { data, error } = await supabaseAdmin.from('notes').insert({ owner_id: g.ctx.userId, contact_id, body, status: 'linked', source: 'claude' }).select('*').single()
      if (error) return toolErr(error.message)
      return toolOk(data)
    }
  )

  server.registerTool(
    'mantis_capture_inbox_note',
    {
      title: 'Capture inbox note',
      description: 'Quick-capture an unclassified note into the inbox for later linking. Idempotent on source_ref.',
      inputSchema: { text: z.string().min(1), source_ref: z.string().optional() },
    },
    async ({ text, source_ref }, extra) => {
      const g = guard(extra, 'inbox:write'); if ('error' in g) return g.error
      if (source_ref) {
        const { data: existing } = await supabaseAdmin.from('notes').select('id').eq('owner_id', g.ctx.userId).eq('source', 'claude').eq('source_ref', source_ref).maybeSingle()
        if (existing) return toolOk({ id: existing.id, deduped: true })
      }
      const { data, error } = await supabaseAdmin.from('notes').insert({ owner_id: g.ctx.userId, body: text, source: 'claude', source_ref: source_ref ?? null, status: 'inbox' }).select('id').single()
      if (error) return toolErr(error.message)
      return toolOk(data)
    }
  )

  server.registerTool(
    'mantis_classify_inbox_note',
    {
      title: 'Classify inbox note',
      description: 'Link an inbox note to a contact, moving it out of the inbox.',
      inputSchema: { note_id: z.string().uuid(), contact_id: z.string().uuid() },
    },
    async ({ note_id, contact_id }, extra) => {
      const g = guard(extra, 'crm:write'); if ('error' in g) return g.error
      const { data, error } = await supabaseAdmin.from('notes').update({ contact_id, status: 'linked' }).eq('id', note_id).eq('owner_id', g.ctx.userId).select('id').maybeSingle()
      if (error) return toolErr(error.message)
      if (!data) return toolErr('Note not found')
      return toolOk({ id: data.id, linked_to: contact_id })
    }
  )

  server.registerTool(
    'mantis_list_follow_ups',
    {
      title: 'List follow-ups',
      description: 'What needs attention: due/overdue follow-ups and contacts gone quiet.',
      inputSchema: {},
    },
    async (_args, extra) => {
      const g = guard(extra, 'crm:read'); if ('error' in g) return g.error
      const dash = await computeDashboard(supabaseAdmin, g.ctx.userId)
      return toolOk({ followUps: dash.followUps, quiet: dash.quiet, inboxCount: dash.inboxCount })
    }
  )

  server.registerTool(
    'mantis_add_wishlist',
    {
      title: 'Add wishlist position',
      description: 'Save an interesting position to the wishlist.',
      inputSchema: {
        title: z.string().min(1),
        company_id: z.string().uuid().optional(),
        url: z.string().optional(),
        follow_up_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      },
    },
    async (args, extra) => {
      const g = guard(extra, 'crm:write'); if ('error' in g) return g.error
      const { data, error } = await supabaseAdmin.from('wishlist_positions').insert({ owner_id: g.ctx.userId, ...args }).select('*').single()
      if (error) return toolErr(error.message)
      return toolOk(data)
    }
  )
}
