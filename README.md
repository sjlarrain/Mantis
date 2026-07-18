# Mantis

A personal networking / job-search CRM: track target companies, the people inside them,
every touchpoint, notes, follow-ups, and a wishlist of interesting positions. Built as a
mobile-first PWA so it installs on your phone, with a REST API and an MCP server so Claude and
WhatsApp (via Secretariat) can operate it too.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth +
RLS) · Zod · MCP (`mcp-handler`). Hosted on Vercel + Supabase.

## Architecture
- **Multi-user, private per owner.** Every table has `owner_id` and RLS `owner_id = auth.uid()`.
- **Web UI** uses Server Actions scoped by the user's session (RLS).
- **REST API** (`/api/v1`, service-role) and **MCP** (`/api/mcp`) authenticate via Supabase JWT
  or `mnt_` personal access tokens, and enforce owner scoping in code.
- **No loose knots:** contacts are created together with their company in one transaction
  (`create_contact_bundle`), from both the forms and the API.

## Getting started
1. Create a Supabase project; run the SQL in `supabase/migrations/` in order (001 → 003).
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL + anon key + service-role key.
3. `npm install` then `npm run dev`. Sign up at `/signup` (email confirmation per your Supabase
   settings). Your profile and default tags are seeded automatically on first sign-in.

## Commands
`npm run dev` · `npm run build` · `npx jest` (tests) · `npx tsc --noEmit` (typecheck)

## Docs
- [docs/API.md](docs/API.md) — REST API reference (auth, scopes, endpoints)
- [docs/MCP.md](docs/MCP.md) — connect the MCP server and its tools
- [skills/mantis-crm/SKILL.md](skills/mantis-crm/SKILL.md) — Claude skill for operating Mantis
- [docs/secretariat-integration.md](docs/secretariat-integration.md) — WhatsApp capture bridge
- [PLAN.md](PLAN.md) — full design · [RULES.md](RULES.md) — working rules

## Views
Dashboard (follow-ups + gone-quiet) · People · Companies · Full table · Notes (inbox + classify)
· Wishlist · Settings (Tag Manager, API tokens).
