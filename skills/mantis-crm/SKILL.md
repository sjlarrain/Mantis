---
name: mantis-crm
description: >-
  Manage the Mantis networking CRM (companies, contacts, actions, notes, follow-ups,
  wishlist) through its MCP connector or REST API. Use when the user asks to add or
  update people/companies, log a meeting or outreach, capture or classify a note,
  check who needs a follow-up or has gone quiet, or triage the note inbox. Teaches
  the required fields, the tag catalog, the "no loose knots" rule, and idempotent
  capture.
---

# Mantis networking CRM

You operate Mantis — a personal job-search / networking CRM — through the **`mantis` MCP
connector** (or the REST API under `/api/v1`; see `docs/API.md`). Your job is to keep the
data clean: complete, de-duplicated, correctly linked, and never orphaned.

## Golden rules

1. **Search before you create.** Always call `mantis_search` first. Linking an existing
   company/contact beats a near-duplicate.
2. **No loose knots.** A contact always belongs to a company. Create both in one call with
   `mantis_create_contact`, passing `company: { id }` (existing) or `company: { name }` (new).
   Never try to create a contact with no company.
3. **Tag fields take ids, not labels.** `class_tag_id`, `type_tag_id`, `status_tag_id`,
   `recruiting_channel_tag_id` must be tag ids from the catalog (`GET /api/v1/tags`). If you
   don't have a matching id, omit the field or use the free-text alternative
   (`title_free`, action `summary`). Never pass a label where an id is expected.
4. **Capture uncertain notes to the inbox.** If you can't confidently tie a note to a person,
   use `mantis_capture_inbox_note` and let it be classified later — don't guess a contact.
5. **Idempotent capture.** When forwarding an external message (e.g. WhatsApp), pass a stable
   `source_ref` (the message id). Re-sends return the existing note instead of duplicating.

## Required fields

- **company** → `name`
- **contact** → `full_name` + a company (`{id}` or `{name}`)
- **action** → `contact_id` (+ optional `type_tag_id`, `occurred_on` `YYYY-MM-DD`, `summary`, `follow_up_on`)
- **inbox note** → `text`

## Tools

Reads: `mantis_search`, `mantis_get_contact`, `mantis_list_follow_ups`.
Writes: `mantis_create_contact`, `mantis_log_action`, `mantis_add_note`,
`mantis_classify_inbox_note`, `mantis_add_wishlist`.
Capture: `mantis_capture_inbox_note` (needs `inbox:write`).

## Common workflows

**Add someone you just met**
1. `mantis_search` their name and company.
2. `mantis_create_contact` with the company (`{id}` if found, else `{name}`), `full_name`,
   `how_i_know`, and any channels (`email`, `phone`, `linkedin_url`).
3. Optionally `mantis_log_action` for the meeting with a `follow_up_on` date.

**Log a touchpoint**
`mantis_log_action` with `contact_id`, a summary, and — if you owe them a reply — `follow_up_on`.

**Daily triage**
1. `mantis_list_follow_ups` → work the overdue/today items and the "gone quiet" list.
2. Review inbox notes: `mantis_search` or the app's inbox, then `mantis_classify_inbox_note`
   to link each to the right contact.

**Capture from a chat message**
`mantis_capture_inbox_note` with the text and the message id as `source_ref`. Classify later.

## Follow-up model

A contact needs attention if it has a due/overdue `follow_up_on`, or has gone **quiet** — no
action within its class threshold (defaults: Target 14 days, Reach 30, Backup 60; the user can
change these in Settings). `mantis_list_follow_ups` returns both.

See `docs/MCP.md` for connection setup and `docs/API.md` for the REST contract.
