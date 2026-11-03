// Sends one email from Nirvan's Gmail over SMTP. Called by the dashboard after the user confirms.
// Secrets: GMAIL_USER (address), GMAIL_APP_PASSWORD (16-char Google app password), optional GMAIL_FROM_NAME.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { SMTPClient } from "jsr:@worker-tools/denomailer@0.16.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { code: "bad_request", message: "POST only" });

  // Only signed-in users listed in outbound.allowed_users may send.
  const auth = req.headers.get("Authorization") ?? "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    db: { schema: "outbound" },
  });
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return json(401, { code: "not_allowed", message: "Sign in first." });
  const { data: allowed } = await sb.rpc("is_allowed");
  if (allowed !== true) return json(403, { code: "not_allowed", message: "This login can't send." });

  let p: { to?: string; subject?: string; body?: string };
  try { p = await req.json(); } catch { return json(400, { code: "bad_request", message: "Invalid JSON" }); }
  const to = String(p.to ?? "").trim(), subject = String(p.subject ?? "").trim(), body = String(p.body ?? "");
  if (!isEmail(to) || !subject || !body.trim()) return json(400, { code: "bad_request", message: "Need to, subject and body." });

  const user = Deno.env.get("GMAIL_USER"), pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) return json(503, { code: "not_configured", message: "Gmail app password not set." });
  const fromName = Deno.env.get("GMAIL_FROM_NAME") ?? "Nikos Technologies";

  const client = new SMTPClient({
    connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: user, password: pass.replace(/\s+/g, "") } },
  });
  try {
    await client.send({ from: `${fromName} <${user}>`, to, subject, content: body });
    await client.close();
    return json(200, { ok: true, sentAt: new Date().toISOString() });
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    const msg = e instanceof Error ? e.message : String(e);
    if (/auth|535|534|credentials/i.test(msg)) return json(502, { code: "auth_failed", message: msg });
    return json(502, { code: "send_failed", message: msg });
  }
});
