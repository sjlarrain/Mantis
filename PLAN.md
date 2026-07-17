# Mantis — Networking CRM: Build Plan

## Context

Mantis is a personal networking CRM for managing a job-search / networking pipeline: target companies, the people inside them, every touchpoint (meetings, cold outreach, email responses), notes, follow-ups, and a wishlist of interesting positions. It replaces the spreadsheet workflow (Company / recruiting channel / contact class / contacts / title / channels / last action / notes).

Two existing projects inform the design:

- **GG Capital** (`C:\Users\sjlar\Tetef\GGCapital`) — a proven Next.js + Supabase CRM whose architecture Mantis borrows: versioned REST API with token auth, MCP server for Claude, staging/classification pipeline, tag catalog manager, transactional "promote" that creates company + contact together.
- **Secretariat** (`C:\Users\sjlar\Tetef\Secretariat`) — the WhatsApp bot (Node/Express on Render, Kapso gateway, slash commands). It will forward quick notes to Mantis via a new `/note` command. That integration is specified in a **separate document**: `docs/secretariat-integration.md` (not implemented in this plan).

### Decisions already made

| Topic | Decision |
|---|---|
| Hosting | Vercel + Supabase (new, dedicated Supabase project) |
| Mobile | Responsive **PWA** — one Next.js codebase, mobile-first, installable |
| Multi-user | **Private per user** from day one: every row has `owner_id`, RLS `owner_id = auth.uid()` (unlike GG Capital, where all authenticated users share data) |
| Design | **Fresh minimal design system** (not GG Capital's Bulma) — Tailwind CSS v4, custom primitives |
| Language | English UI, labels centralized for future translation |
| OCR/BCR/Academic Intern | Modeled as an editable tag category **"Recruiting channel"** (these are MBA recruiting channels: On-Campus Recruiting / Beyond Campus Recruiting / Academic Internship). User will confirm meaning later; tags are renameable |
| Follow-ups | Both manual follow-up dates **and** automatic "gone quiet" detection (no activity for N days, threshold configurable per contact class) |
| Secretariat | Mantis ships the API ready; Secretariat-side changes live in the separate spec doc |

---

## 1. Tech stack

- **Next.js 16 (App Router) + React 19 + TypeScript** — same major versions as GG Capital so patterns transfer directly.
- **Tailwind CSS v4** — fresh minimal design system (see §6).
- **Supabase**: Postgres + Auth (email/password with email confirm) + RLS. Clients via `@supabase/ssr` + `@supabase/supabase-js` (same setup as GG Capital `src/lib/supabase/`).
- **Zod v4** for all form/API validation (shared schemas between UI forms and API routes).
- **`mcp-handler` + `@modelcontextprotocol/sdk`** for the MCP endpoint (copy GG Capital's `src/app/api/[transport]/route.ts` pattern).
- **Jest + ts-jest** for unit tests (auth, schemas, follow-up engine).
- Deploy: Vercel (app + API), Supabase (DB/auth). No separate backend server.

## 2. Data model (Supabase migrations)

All tables: `id uuid pk default gen_random_uuid()`, `owner_id uuid not null references auth.users(id)`, `created_at`, `updated_at` (shared trigger, as in GG Capital `001_schema.sql`), soft delete via `deleted_at` where useful. RLS on every table: `owner_id = auth.uid()` for select/insert/update/delete.

### Core tables

- **`user_profiles`** — `id` (= auth.users.id), `display_name`, `role` (`user`/`admin`), settings jsonb (follow-up thresholds per class, defaults e.g. Target 14d / Reach 30d / Backup 60d). Created by trigger on signup.
- **`companies`** — `name` (unique per owner), `website`, `industry`, `location`, `description` ("what they do"), `recruiting_channel_tag_id` → tags (OCR/BCR/Academic Intern), `priority_tag_id` → tags (Target/Reach/Backup at company level, as in the spreadsheet), `notes`.
- **`contacts`** — `company_id not null` → companies (**people must belong to a company**), `full_name`, `title_tag_id` → tags (position catalog) **plus** `title_free text` (either/or; catalog keeps inputs consistent, free text keeps entry fast), `class_tag_id` → tags (Target/Reach/Backup), `how_i_know` text ("LinkedIn", "Anderson alum", "Introduction from Camilo"), `email`, `phone`, `linkedin_url` (all three channels storable at once), `next_follow_up_date` (denormalized cache, maintained by the app).
- **`actions`** — the event log: `contact_id not null` → contacts, `type_tag_id` → tags (Meeting, Cold outreach, Email response, Coffee chat, Intro, Panel…), `occurred_on date`, `summary`, `follow_up_on date null`, `follow_up_done_at`, `source` (`app`/`api`/`whatsapp`). A contact's "last action" (spreadsheet's *Date action taken*) = latest action by `occurred_on`.
- **`notes`** — `body` (markdown), `contact_id null`, `action_id null`, `source` (`app`/`whatsapp`/`claude`), `status` (`inbox` | `linked`). A note with `status='inbox'` and no links is a **jot note** waiting for classification; meeting notes link to an action and surface on the person's profile timeline.
- **`wishlist_positions`** — `company_id` → companies, `title`, `url`, `status_tag_id` → tags (Interested/Applied/Interviewing/Offer/Closed), `notes`, `follow_up_on`.
- **`tags`** — `category` (enum-ish text: `contact_class`, `recruiting_channel`, `action_type`, `position_title`, `wishlist_status`, `label`), `value`, `color`, `sort_order`, `archived_at`. Per-owner, seeded on signup with sensible defaults (Target/Reach/Backup; OCR/BCR/Academic Intern; Meeting/Cold outreach/Email/Intro/Coffee chat; wishlist statuses). Managed in Settings → Tag Manager (pattern: GG Capital `TagCatalogManager.tsx`).
- **`entity_tags`** — optional free-form many-to-many labels on companies/contacts (polymorphic `entity_type`, `entity_id`, `tag_id`).
- **`api_tokens`** — PATs for Secretariat/Claude: `token_hash`, `scopes text[]`, `expires_at`, `revoked_at`, `last_used_at`. Copy GG Capital `010_api_tokens.sql` + `src/lib/auth/tokens.ts` (hash-at-rest, `mnt_` prefix instead of `ggc_`).

### "No loose knots" (transactional creation)

Postgres function `create_contact_bundle(...)` modeled on GG Capital's `promote_staging_event` (`012_staging.sql`): creates company (if new) + contact + optional first action + note **in one transaction** — never a contact without a company, never a partial write. Used by both the web forms and the API inbox promote.

## 3. API surface

### REST — `/api/v1/*` (pattern: GG Capital `src/app/api/v1/`)

Auth middleware (copy `_lib/auth.ts`): `Authorization: Bearer` accepting Supabase JWT (web/interactive) or PAT `mnt_…` (Secretariat, scripts). Scopes: `crm:read`, `crm:write`, `inbox:write`, `inbox:promote`.

- `GET/POST /companies`, `GET/PATCH/DELETE /companies/:id`
- `GET/POST /contacts`, `GET/PATCH/DELETE /contacts/:id` (POST accepts inline `company` object → bundle function)
- `GET/POST /actions` (+ `POST /actions/:id/complete-follow-up`)
- `GET/POST /notes`
- `GET/POST /wishlist`, `PATCH /wishlist/:id`
- `GET /tags`, `POST /tags` (settings-scoped)
- `GET /search?q=` — cross-entity (companies, contacts, notes)
- `GET /follow-ups?due=today|overdue|quiet` — the follow-up engine, also feeds the dashboard
- **Inbox (capture → classify → promote):**
  - `POST /inbox` — `{ text, source, source_ref }` → creates `notes` row with `status='inbox'` (idempotent on `source_ref`). This is what Secretariat calls.
  - `GET /inbox` — pending notes
  - `POST /inbox/:id/classify` — link to existing contact/action or propose new company+contact
  - `POST /inbox/:id/promote` — runs the bundle function
- `GET /openapi.json` — serve the spec (as GG Capital does) so Claude can discover the API.

### MCP — `/api/mcp` (pattern: GG Capital `src/app/api/[transport]/route.ts`)

`mcp-handler` + `withMcpAuth` reusing the same bearer verification. Initial tools: `search_crm`, `get_contact_profile` (with timeline), `log_action`, `add_note`, `capture_inbox_note`, `list_follow_ups`, `classify_inbox_item`, `add_wishlist_position`. OAuth for claude.ai connectors is a later phase — GG Capital's `014_oauth.sql` + `src/lib/oauth/` can be ported when needed; PATs suffice for Claude Code/desktop first.

## 4. Views (pages)

App shell: left sidebar on desktop, bottom tab bar on mobile (Dashboard · People · Companies · Notes · More).

1. **Dashboard `/`** — "what needs my attention": overdue + due-today follow-ups, **gone-quiet contacts** (no action within their class threshold), inbox count badge, wishlist items with follow-ups, recent activity feed, and quick-capture buttons (note / action / person).
2. **Full table `/table`** — the spreadsheet replica: rows grouped by company (rowspan look), columns: Company · Recruiting channel · Class · Contact · Title · How I know · Email · Phone · LinkedIn · Last action + date · Notes preview. Sticky header, filters (class, channel, company priority, "has pending follow-up"), text search, CSV export. Horizontal scroll on mobile.
3. **People `/people`, `/people/[id]`** — list + profile. Profile = header card (title, company, class, channels as tappable links: mailto/tel/LinkedIn) + activity timeline interleaving actions and notes (pattern: GG Capital `ActivityTimeline.tsx`) + pending follow-ups + quick "log action / add note" inline.
4. **Companies `/companies`, `/companies/[id]`** — profile: description ("what they do"), recruiting channel, priority, its people, related wishlist positions.
5. **Forms** — `/people/new`, `/actions/new`, `/notes/new`, `/wishlist/new`, edit pages. Company and contact selectors are searchable-select-with-inline-create (pattern: GG Capital `SearchableSelect.tsx` / `Autocomplete.tsx`) so nothing can be saved pointing at a nonexistent parent.
6. **Jot notes `/notes`** — two tabs: **Inbox** (unclassified quick notes from app/WhatsApp/Claude, each with a one-tap classify flow) and **All notes**. Global "＋ note" button in the shell for instant capture.
7. **Wishlist `/wishlist`** — cards/table of positions with status pipeline and follow-up dates.
8. **Settings `/settings`** — Tag Manager (all categories, add/rename/reorder/archive), follow-up thresholds per class, API tokens (create/revoke `mnt_` PATs with scopes), profile.
9. **Auth** — `/login`, `/signup` via Supabase Auth.

## 5. Follow-up engine

- Manual: any action can carry `follow_up_on`; completing it stamps `follow_up_done_at`. `contacts.next_follow_up_date` kept in sync for cheap table queries.
- Automatic: SQL view `quiet_contacts` — contacts whose latest action is older than the threshold for their class (thresholds from `user_profiles.settings`). Dashboard and `/follow-ups` read from it. No cron needed — computed at read time.

## 6. Design system (fresh, minimal)

Built with the `frontend-design` skill at implementation time. Direction:

- Neutral near-white/near-black surfaces, one accent color (mantis green), generous whitespace, hairline borders instead of shadows.
- Geist or Inter; tabular numerals in tables; small-caps section labels.
- Few primitives, built once in `src/components/ui/`: Button, Input, Select, Badge/Tag chip, Card, Modal/Drawer (mobile bottom-sheet), Table, EmptyState, Toast.
- Light + dark via `prefers-color-scheme`.
- Mobile-first: every page usable at 375px; forms single-column; bottom sheet for quick capture.
- PWA: `manifest.json` + icons + theme color; installable on iOS/Android home screen. (Service-worker offline support deferred.)

## 7. Repo layout

```
Mantis/
  PLAN.md, README.md, CLAUDE.md
  docs/secretariat-integration.md   ← separate spec (already written)
  supabase/migrations/001_schema.sql, 002_rls.sql, 003_seed_tags.sql, 004_api_tokens.sql, 005_functions.sql
  src/
    app/(app)/...        pages per §4
    app/api/v1/...       REST per §3 (+ _lib/auth.ts, respond.ts, validate.ts)
    app/api/[transport]/route.ts    MCP
    components/ui/, components/forms/, components/...
    lib/supabase/, lib/auth/, lib/schemas/, lib/mcp/, lib/labels.ts (centralized UI strings)
    types/
```

## 8. Build phases

1. **Scaffold** — `create-next-app` (TS, App Router, Tailwind v4), Supabase project + env, auth (login/signup, middleware, `user_profiles` trigger), app shell (sidebar/bottom-nav), UI primitives, git init + first Vercel deploy.
2. **Schema + tags + companies/people** — migrations 001–005, seed default tags, Tag Manager in Settings, companies & contacts CRUD with inline-create selectors and the bundle function.
3. **Actions + notes + profiles + full table** — action logging, notes (linked + jot inbox with classify flow), person/company profiles with timeline, the spreadsheet-style full table with filters/export.
4. **Dashboard + follow-ups + wishlist** — follow-up engine (manual + quiet detection), dashboard, wishlist CRUD.
5. **API v1 + tokens** — auth middleware, endpoints, OpenAPI json, PAT management UI, Jest tests for auth/validation, verify with curl.
6. **MCP + polish** — `/api/mcp` tools, PWA manifest, mobile QA at 375px, dark mode pass, seed/import script for the existing spreadsheet CSV.

Each phase ends deployed to Vercel and verified in the browser (desktop + mobile viewport).

## 9. Verification

- Per phase: run `next dev`, exercise the new flows in the browser preview (including 375px mobile viewport); Jest for pure logic (auth token hashing, zod schemas, quiet-contact threshold math).
- API: curl/PowerShell scripts hitting `/api/v1/inbox` etc. with a test PAT; confirm RLS isolation by creating a second user.
- End-to-end "no loose knots": create a note from the API inbox naming an unknown company+person → classify → promote → verify company, contact, action and note all exist and are linked.
- Import the real spreadsheet CSV via the seed script and eyeball the Full Table against the original.

## 10. Open items (need your input later)

- Confirm what OCR/BCR/Academic Intern actually mean for your workflow (tags are renameable regardless).
- Exact follow-up thresholds per class (defaults: Target 14d, Reach 30d, Backup 60d).
- Whether claude.ai (web/mobile) connector access is needed soon → would pull the OAuth port forward.
- Spreadsheet import: send the real file when ready.
