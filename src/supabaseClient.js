// /src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Prefer Vite env at build-time; fall back to your known-good values.
const SUPABASE_URL =
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://buwiisnrenazeyjcmgmo.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1d2lpc25yZW5hemV5amNtZ21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTcyNjksImV4cCI6MjA3NDAzMzI2OX0.L91mL0khI_v36egMn8DmYEL5s5uKTdb__LOacPcpAmA";

// Helpful runtime check in production bundles:
if (!SUPABASE_URL) {
  console.error("Supabase URL missing. Did Vercel env vars build correctly?");
  throw new Error("supabaseUrl is required (no URL after build).");
}
if (!SUPABASE_ANON_KEY) {
  console.error("Supabase anon key missing. Did Vercel env vars build correctly?");
  throw new Error("supabase anon key is required.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
