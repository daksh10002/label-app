// /src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Prefer Vite envs, fallback to hardcoded (so local dev / first deploy doesn't break)
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://buwiisnrenazeyjcmgmo.supabase.co"; // <-- your URL

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1d2lpc25yZW5hemV5amNtZ21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTcyNjksImV4cCI6MjA3NDAzMzI2OX0.L91mL0khI_v36egMn8DmYEL5s5uKTdb__LOacPcpAmA"; // <-- your anon key

if (!SUPABASE_URL) {
  throw new Error("VITE_SUPABASE_URL missing. Set it in Vercel env or fallback.");
}
if (!SUPABASE_ANON_KEY) {
  throw new Error(
    "VITE_SUPABASE_ANON_KEY missing. Set it in Vercel env or fallback."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
