# Mantis REST API

Base URL: `${NEXT_PUBLIC_APP_URL}/api/v1` (e.g. `https://mantis.vercel.app/api/v1`).
Machine-readable spec: `GET /api/v1/openapi.json` (public, no auth).

Every response is JSON and **owner-scoped** — a token only ever sees its owner's data.

## Authentication

Send a bearer token:

```
Authorization: Bearer <token>
```

Two token types are accepted:

- **Supabase JWT** — an interactive user session (the web app uses this automatically).
- **Personal access token (PAT)** — `mnt_…`, for server-to-server callers (Secretariat/WhatsApp, scripts, Claude). Create and revoke these in **Settings → API tokens**. The full value is shown once at creation; only its SHA-256 hash is stored.

### Scopes

| Scope | Grants |
|---|---|
| `crm:read` | Read companies, contacts, actions, notes, tags, search, follow-ups |
| `crm:write` | Create/update/delete those records |
| `inbox:write` | Quick-capture notes to the inbox (`POST /inbox`) |
| `inbox:promote` | Reserved for future inbox promotion flows |

A request without the required scope gets `403`; without a valid token, `401`.

## Errors

```json
{ "error": { "code": "invalid_request", "message": "Validation failed", "issues": [ ... ] } }
```

Common codes: `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `invalid_request` (422), `server_error` (500).

## Endpoints

### Companies
- `GET /companies` → `{ items: Company[] }`
- `POST /companies` — body: `{ name, website?, industry?, location?, description?, recruiting_channel_tag_id?, priority_tag_id?, notes? }` → `201 Company` (409 on duplicate name)
- `GET /companies/:id` → `Company`
- `PATCH /companies/:id` — any subset of the create fields
- `DELETE /companies/:id` — soft delete

### Contacts
- `GET /contacts` → `{ items: Contact[] }` (each with `company`)
- `POST /contacts` — **atomic bundle** (see below) → `201 { company_id, contact_id, action_id?, note_id? }`
- `GET /contacts/:id` → `Contact` with `actions[]` and `notes[]`
- `PATCH /contacts/:id` — update contact fields
- `DELETE /contacts/:id` — soft delete

**The bundle (no loose knots).** `POST /contacts` creates a company (if new) and the contact together in one transaction, so a person is never saved without a company:

```jsonc
POST /contacts
{
  "company": { "name": "Ring" },          // or { "id": "<uuid>" } to link an existing one
  "contact": { "full_name": "Karla Torres", "how_i_know": "LinkedIn", "email": "k@ring.com" },
  "action":  { "type_tag_id": "<uuid>", "occurred_on": "2026-04-01", "summary": "First call", "follow_up_on": "2026-04-15" }, // optional
  "note":    { "body": "Warm; will intro me to her manager." }   // optional
}
```

### Actions
- `GET /actions?contact_id=<uuid>` → `{ items: Action[] }`
- `POST /actions` — body: `{ contact_id, type_tag_id?, occurred_on?, summary?, follow_up_on?, source? }`. Setting `follow_up_on` updates the contact's next follow-up.

### Notes & inbox
- `GET /notes?contact_id=<uuid>` → `{ items: Note[] }`
- `POST /notes` — `{ body, contact_id?, action_id?, source? }`. With `contact_id` it's linked; without, it lands in the inbox.
- `GET /inbox` → unclassified inbox notes (needs `crm:read`)
- `POST /inbox` — `{ text, source?, source_ref? }` (needs `inbox:write`). **Idempotent** on `(source, source_ref)`: a replayed request returns the existing note with `{ deduped: true }` (200) instead of creating a duplicate. This is what Secretariat/WhatsApp calls.

### Tags
- `GET /tags?category=<cat>&active=true` → `{ items: Tag[] }`. Categories: `contact_class`, `recruiting_channel`, `action_type`, `position_title`, `wishlist_status`, `label`.
- `POST /tags` — `{ category, value, color?, sort_order? }`

### Search & follow-ups
- `GET /search?q=<text>` → `{ companies, contacts, notes }`
- `GET /follow-ups?due=today|overdue|quiet|all` → due/overdue follow-ups and contacts gone quiet (per-class thresholds, defaults Target 14d / Reach 30d / Backup 60d)

## Examples

```bash
# Capture a WhatsApp-style note (idempotent)
curl -X POST "$BASE/inbox" -H "Authorization: Bearer $MANTIS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"met Karla from Ring","source":"whatsapp","source_ref":"wamid.123"}'

# What needs attention today
curl "$BASE/follow-ups?due=overdue" -H "Authorization: Bearer $MANTIS_TOKEN"
```
