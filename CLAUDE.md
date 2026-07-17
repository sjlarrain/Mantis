@AGENTS.md

# Mantis

Networking CRM (Next.js 16 App Router + Supabase, Vercel-hosted PWA). See `PLAN.md`
for the full design and `docs/secretariat-integration.md` for the WhatsApp bridge.

## READ FIRST
Read `RULES.md` at the start of every session. Non-negotiable working rules
(tests before commits, no co-authored commits, only Santiago authorizes push).

## Commands
- Dev: `npm run dev`
- Test: `npx jest`
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`

## Conventions
- Multi-user, private per owner: every domain table has `owner_id` and RLS
  `owner_id = auth.uid()`. Never add a table without both (a lint test enforces it).
- Zod schemas in `src/lib/schemas` are the single source of validation for forms and API.
- API routes live under `src/app/api/v1`, auth via `_lib/auth.ts` (Supabase JWT or `mnt_` PAT).
- Design tokens are CSS variables in `src/app/globals.css`; use `eyebrow`/`tnum` helpers.
