// Cloudflare Pages build: writes web/config.js from environment variables.
import { writeFileSync } from "node:fs";
const cfg = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  schema: process.env.SUPABASE_SCHEMA || "outbound",
  loginEmailDomain: process.env.LOGIN_EMAIL_DOMAIN || "nikos-outbound.local",
};
if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) console.warn("SUPABASE_URL or SUPABASE_ANON_KEY is not set; the site will show a setup message.");
writeFileSync("web/config.js", `window.OUTBOUND_CONFIG=${JSON.stringify(cfg)};\n`);
console.log("Wrote web/config.js");
