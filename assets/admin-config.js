/* ============================================================
   Roamly — admin front-end config

   These two values are PUBLIC by design. The anon key is meant to be
   in the browser; what protects your data is Row Level Security in
   supabase/schema.sql, not the secrecy of this key.

   Never put SUPABASE_SERVICE_ROLE_KEY here — it bypasses RLS.
   ============================================================ */
window.ROAMLY_SUPABASE = {
  url: 'https://vfooeyygzfntnjkqzffq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmb29leXlnemZudG5qa3F6ZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNjg1MTIsImV4cCI6MjEwMzY0NDUxMn0.1IpUHQFLu5pc1aFiYjq8XP9Mi1weGyeWtkoajYDzg4k'
};
