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
