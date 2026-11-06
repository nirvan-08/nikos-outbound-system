// Cloudflare Pages build: writes web/config.js from environment variables.
import { writeFileSync } from "node:fs";
const cfg = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  schema: process.env.SUPABASE_SCHEMA || "outbound",
  loginEmailDomain: process.env.LOGIN_EMAIL_DOMAIN || "nikos-outbound.local",
};
if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
  console.log("SUPABASE_URL / SUPABASE_ANON_KEY not set; keeping the committed web/config.js.");
  process.exit(0);
}
writeFileSync("web/config.js", `window.OUTBOUND_CONFIG=${JSON.stringify(cfg)};\n`);
console.log("Wrote web/config.js");
