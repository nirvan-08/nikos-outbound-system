# Nikos outbound system

Finds and tracks customers for Nikos Technologies' shop-floor ERP (Indian CNC/VMC job shops).

- **`dashboard/index.html`**: the Manufacturer Pipeline dashboard. Prospects with status sub-tabs (New, Contacted, Replied, Meeting, Accepted, Denied), segment and fit scoring, a 4-question first-call check, Gmail sending with an in-page confirm, WhatsApp links with per-segment opening lines, a call log, and a separate Clients tab.
- **`lead-finder/PROMPT.md`**: the prompt the weekday scheduled task runs to add ~10 new qualified leads.
- **`docs/data-model.md`**: the fields each record holds.

## How it runs today

The page is published as a private claude.ai artifact. It relies on the claude.ai runtime (`window.claude`):

- `db` for prospects and clients (shared document store),
- `mcp` to call the viewer's Gmail connector (`send_message`).

Opened anywhere else (a plain browser, Cloudflare Pages), it shows "Open this page on claude.ai" and loads no data.

## Sign-in screen

`LOGIN_HASH` in `dashboard/index.html` is a placeholder. Set it to the SHA-256 hex of `username:password` (username lowercased), for example:

```sh
printf '%s' 'myuser:mypassword' | sha256sum
```

This screen is a convenience lock only. Real access control is the artifact's private sharing on claude.ai.

## Hosted version (Cloudflare Pages + Supabase)

`web/index.html` is the same dashboard wired to Supabase instead of the claude.ai runtime. Data lives in a locked `outbound` schema inside the ERP Supabase project (`supabase/migrations/`). ERP tables are not touched, and only users listed in `outbound.allowed_users` can read or write.

Cloudflare Pages settings:

| Setting | Value |
| --- | --- |
| Build command | `node build.mjs` |
| Build output directory (Pages) | `web` |
| Deploy command (Workers) | `npx wrangler deploy` (uses `wrangler.jsonc`, which serves `web/`) |
| Build variable `SUPABASE_URL` | `https://ttjqlzrrlwnlcyovebvy.supabase.co` |
| Build variable `SUPABASE_ANON_KEY` | the project's publishable key (Supabase → Project Settings → API Keys) |

One-time Supabase setup:

1. Project Settings → Data API → Exposed schemas: add `outbound`.
2. Authentication → Users → Add user: email `<username>@nikos-outbound.local`, a password, tick Auto Confirm. The login page accepts the bare username.
3. Add that user's id to `outbound.allowed_users`.
4. Edge Function secrets for email: `GMAIL_USER` and `GMAIL_APP_PASSWORD` (a Google app password). Without them the page still offers "Open in Gmail".

Edge functions (`supabase/functions/`): `send-email` (signed-in allowed users only, sends after the in-page confirm) and `ingest-leads` (the lead finder's add-only endpoint, token checked against `outbound.ingest_tokens`). The lead finder prompt for this version is `lead-finder/PROMPT-supabase.md`.
