# Mantis MCP server

Mantis exposes a Model Context Protocol server so Claude (Claude Code, desktop, or any MCP client) can operate the CRM directly — search, log touchpoints, capture and classify notes, and see what needs attention.

- **Endpoint:** `${NEXT_PUBLIC_APP_URL}/api/mcp` (streamable HTTP)
- **Server name:** `mantis`
- **Auth:** bearer token — a Mantis PAT (`mnt_…`) from **Settings → API tokens**, or a Supabase JWT. Same scopes as the REST API (`crm:read`, `crm:write`, `inbox:write`).

## Connecting

### Claude Code (`.mcp.json`)

```json
{
  "mcpServers": {
    "mantis": {
      "type": "http",
      "url": "https://mantis.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer mnt_your_token_here" }
    }
  }
}
```

### claude.ai / Claude Desktop
Add a custom connector pointing at the same URL with the `Authorization` header. (Interactive OAuth login is not wired yet — use a PAT for now.)

## Tools

| Tool | Scope | Purpose |
|---|---|---|
| `mantis_search` | crm:read | Search companies, contacts, notes. **Call before creating** to avoid duplicates. |
| `mantis_get_contact` | crm:read | Full profile: company, actions, notes. |
| `mantis_list_follow_ups` | crm:read | Due/overdue follow-ups and contacts gone quiet. |
| `mantis_create_contact` | crm:write | Create a contact, creating its company inline (`{id}` or `{name}`). Atomic. |
| `mantis_log_action` | crm:write | Log a touchpoint, optionally with a follow-up date. |
| `mantis_add_note` | crm:write | Add a note to a contact. |
| `mantis_classify_inbox_note` | crm:write | Link an inbox note to a contact. |
| `mantis_capture_inbox_note` | inbox:write | Quick-capture an unclassified note (idempotent on `source_ref`). |
| `mantis_add_wishlist` | crm:write | Save an interesting position. |

## Working rules for the agent

1. **Search before you create.** Always `mantis_search` first; link an existing record rather than make a near-duplicate.
2. **Never leave loose knots.** `mantis_create_contact` always attaches to a company — pass `{ id }` for an existing one, or `{ name }` to create it in the same call.
3. **Tag fields take ids, not labels.** `class_tag_id`, `type_tag_id`, etc. must be tag ids (from the REST `GET /tags` catalog). If you don't have one, omit it or capture free text instead.
4. **When unsure who a note belongs to, capture it to the inbox** (`mantis_capture_inbox_note`) rather than guessing a contact; classify later.

See [API.md](API.md) for the underlying REST contract these tools mirror.
