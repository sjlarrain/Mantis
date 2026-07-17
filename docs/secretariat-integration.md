# Secretariat ↔ Mantis Integration Spec

Separate spec, to be implemented in the **Secretariat** repo (`C:\Users\sjlar\Tetef\Secretariat`) once Mantis's API v1 is deployed. Nothing here blocks the Mantis build — Mantis only needs `POST /api/v1/inbox` live.

## Goal

Capture quick networking notes from WhatsApp ("met Karla from Ring, she'll intro me to her manager, follow up in 2 weeks") into Mantis's note inbox, where they are later classified and linked to a person/company from the Mantis UI (or by Claude via MCP).

## How Secretariat works today (relevant facts)

- Node/TypeScript + Express on Render; WhatsApp via the Kapso gateway; state in Upstash Redis; deterministic slash-command parsing (no LLM yet).
- Inbound flow: `POST /webhook/whatsapp` → `backend/src/routes/webhook.ts` → whitelist + dedup → `parseCommand()` → `switch(command)` dispatch to a handler.
- The documented "add a command" recipe (Secretariat `CLAUDE.md`): registry entry + switch case + handler + manual menu update.
- Best existing template: the `ideas` command — `handlers/ideas.handler.ts` stores free text in Redis and replies a confirmation. The Mantis note flow is the same shape with an HTTP POST instead of Redis.
- Outbound HTTP client patterns to mirror: `kapso/client.ts` (SDK + retry/backoff/timeout) and `kapso/platform.ts` (raw `fetch` with API-key header).
- Secrets: env vars validated with Zod at boot in `backend/src/env.ts`, documented in `.env.example`.

## Changes in Secretariat

1. **Env** (`backend/src/env.ts`, `.env.example`):
   - `MANTIS_API_URL` — e.g. `https://mantis.vercel.app`
   - `MANTIS_API_KEY` — a Mantis PAT (`mnt_…`) created in Mantis → Settings → API tokens, scope `inbox:write`.

2. **Client** — new `backend/src/integrations/mantis.ts`:
   - `captureNote({ text, sourceRef }): Promise<{ id }>` → `POST ${MANTIS_API_URL}/api/v1/inbox` with header `Authorization: Bearer ${MANTIS_API_KEY}` and body:
     ```json
     { "text": "<message text>", "source": "whatsapp", "source_ref": "<whatsapp messageId>" }
     ```
   - `source_ref` = the WhatsApp message id already used for dedup → the endpoint is idempotent (Mantis has `unique(source, source_ref)`), so webhook retries can't double-save.
   - Mirror `kapso/client.ts` retry/timeout handling; on final failure, fall back to saving the text in Redis under `secretariat:mantis:pending` so no note is ever lost, and say so in the reply.

3. **Command** — `/note <free text>`:
   - Add `note` to `registries/commands.registry.ts` (alias: `/n`). No flags needed for v1; later: `--person <name>` to pre-suggest a link.
   - Add `case 'note':` in `routes/webhook.ts` dispatching to new `handlers/note.handler.ts`.
   - Handler: call `captureNote`, reply `📝 Saved to Mantis inbox (#<short-id>). Classify later in the app.`
   - Update `menu.handler.ts` manually (menu does not auto-build).

## Mantis side (already in the main plan)

- `POST /api/v1/inbox` — creates a `notes` row with `status='inbox'`, `source='whatsapp'`; idempotent on `(source, source_ref)`; requires scope `inbox:write`; returns `201 { id }` (or `200` with the existing id on replay).
- Classification then happens in Mantis (Notes → Inbox tab) or via Claude through Mantis's MCP tools (`classify_inbox_item`, `capture_inbox_note`).

## Later ideas (out of scope)

- `/followups` command: `GET /api/v1/follow-ups?due=today` → WhatsApp digest each morning (Secretariat already has QStash cron infrastructure for scheduled sends).
- Natural-language capture without the `/note` prefix once Secretariat's planned NLP layer (its backlog v1.12) exists — Claude could then classify at capture time by calling Mantis MCP tools directly.

## Verification

1. Create a PAT in Mantis with only `inbox:write`; confirm it cannot read contacts (`GET /api/v1/contacts` → 403).
2. From WhatsApp: `/note test note from whatsapp` → confirmation reply → note appears in Mantis Inbox with source `whatsapp`.
3. Replay the same webhook payload (Kapso retry simulation) → no duplicate note.
4. Kill `MANTIS_API_URL` temporarily → `/note` still replies, text parked in Redis fallback.
