// Lets the scheduled lead finder read existing keys (for dedupe) and add NEW prospects only.
// Auth: header "x-ingest-token" whose sha256 is in outbound.ingest_tokens (or equals the optional
// INGEST_TOKEN secret). It can never update or delete existing prospects.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { db: { schema: "outbound" } });
  const given = req.headers.get("x-ingest-token") ?? "";
  if (given.length < 20) return json(401, { error: "bad token" });
  const envToken = Deno.env.get("INGEST_TOKEN");
  let ok = !!envToken && given === envToken;
  if (!ok) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(given));
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const { data } = await sb.from("ingest_tokens").select("token_sha256").eq("token_sha256", hex).maybeSingle();
    ok = !!data;
  }
  if (!ok) return json(401, { error: "bad token" });

  if (req.method === "GET") {
    const keys: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from("prospects").select("id,data->>company,data->>phone,data->>website").range(from, from + 999);
      if (error) return json(500, { error: error.message });
      keys.push(...data);
      if (data.length < 1000) break;
    }
    return json(200, { count: keys.length, prospects: keys });
  }
  if (req.method !== "POST") return json(405, { error: "GET or POST" });

  let p: { prospects?: { id: string; data: Record<string, unknown> }[]; run?: Record<string, unknown> };
  try { p = await req.json(); } catch { return json(400, { error: "invalid JSON" }); }
  const rows = (p.prospects ?? []).filter((r) => r && /^[a-z0-9-]{1,80}$/.test(r.id) && r.data && typeof r.data.company === "string")
    .slice(0, 50).map((r) => ({ id: r.id, data: { ...r.data, status: "New", activity: [] } }));
  let added: string[] = [];
  if (rows.length) {
    const { data, error } = await sb.from("prospects").upsert(rows, { onConflict: "id", ignoreDuplicates: true }).select("id");
    if (error) return json(500, { error: error.message });
    added = (data ?? []).map((r: { id: string }) => r.id);
  }
  const { count } = await sb.from("prospects").select("id", { count: "exact", head: true });
  const run = { lastRun: new Date().toISOString(), added: added.length, total: count ?? null, note: String(p.run?.note ?? "").slice(0, 300) };
  await sb.from("meta").upsert({ id: "finder", data: run });
  return json(200, { added, skipped: rows.length - added.length, total: count });
});
