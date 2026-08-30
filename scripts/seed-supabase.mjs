#!/usr/bin/env node
/* ============================================================
   Roamly — one-time migration: assets/data.json → Supabase

   Uses the SERVICE ROLE key, which bypasses RLS. That key must never
   be committed or exposed to a browser — run this from your machine
   with the value pasted in the environment, once.

       SUPABASE_URL=https://xxxx.supabase.co \
       SUPABASE_SERVICE_ROLE_KEY=eyJ... \
       node scripts/seed-supabase.mjs

   Add --dry-run to see what would be sent without writing anything.
   Safe to re-run: rows are upserted on primary key.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tripToRow, memberToRow, expenseToRow } from './map.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.error(`
  Missing credentials.

    SUPABASE_URL=https://<project>.supabase.co \\
    SUPABASE_SERVICE_ROLE_KEY=<service_role key> \\
    node scripts/seed-supabase.mjs

  Both are in your Supabase dashboard under Project Settings → API.
  The service_role key bypasses Row Level Security — keep it out of
  git and out of the browser.
`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'data.json'), 'utf8'));

const trips = (data.trips || []).map(tripToRow);
const members = (data.members || []).map(memberToRow);
const expenses = (data.expenses || []).map(expenseToRow);
const settings = [{ id: 1, deposit: data.deposit ?? 1000, categories: data.categories ?? [] }];


/* Validate against the schema's constraints before touching the network.
   A dry run that only counts rows tells you nothing you didn't know; this
   catches the rows Postgres would reject. */
function validateRows(trips, members, expenses) {
  const tripIds = new Set(trips.map(t => t.id));
  const p = [];
  trips.forEach(t => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(t.id || '')) p.push(`trips[${t.id}] id is not a slug`);
    ['code','name','short','region','grade','dates','hero','hero_alt']
      .forEach(k => { if (!t[k]) p.push(`trips[${t.id}] NOT NULL violated: ${k}`); });
    if (!(t.days >= 1 && t.days <= 60))   p.push(`trips[${t.id}] days out of 1..60`);
    if (!(t.rating >= 0 && t.rating <= 5)) p.push(`trips[${t.id}] rating out of 0..5`);
    if (!(t.slots >= 1 && t.slots <= 100)) p.push(`trips[${t.id}] slots out of 1..100`);
    if (!['active','upcoming','completed'].includes(t.status)) p.push(`trips[${t.id}] bad status`);
  });
  members.forEach(m => {
    if (!m.name) p.push(`members[${m.id}] NOT NULL violated: name`);
    if (!tripIds.has(m.trip_id)) p.push(`members[${m.id}] FK violated: no trip ${m.trip_id}`);
    if (m.paid > m.amount) p.push(`members[${m.id}] CHECK paid<=amount violated`);
    if (!['paid','pending'].includes(m.status)) p.push(`members[${m.id}] bad status`);
  });
  expenses.forEach(e => {
    if (!tripIds.has(e.trip_id)) p.push(`expenses[${e.id}] FK violated: no trip ${e.trip_id}`);
    if (!e.title) p.push(`expenses[${e.id}] NOT NULL violated: title`);
  });
  return p;
}

async function upsert(table, rows) {
  if (!rows.length) { console.log(`  ${table.padEnd(9)} 0 rows — skipped`); return; }
  if (DRY) { console.log(`  ${table.padEnd(9)} ${rows.length} rows (dry run)`); return; }

  const res = await fetch(`${URL_}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  console.log(`  ${table.padEnd(9)} ${rows.length} rows upserted`);
}

console.log(DRY ? '\n  DRY RUN — nothing will be written\n' : '\n  Seeding Supabase\n');

const problems = validateRows(trips, members, expenses);
if (problems.length) {
  console.error(`  ${problems.length} row(s) would be rejected by Postgres:`);
  problems.forEach(x => console.error('    - ' + x));
  console.error('\n  Fix these before seeding.\n');
  process.exit(1);
}
console.log(`  validated ${trips.length} trips, ${members.length} members, ${expenses.length} expenses against schema.sql\n`);
try {
  // trips first: members and expenses reference them
  await upsert('trips', trips);
  await upsert('settings', settings);
  await upsert('members', members);
  await upsert('expenses', expenses);

  console.log(`
  Done. Next:
    1. Verify in the Supabase table editor.
    2. Confirm RLS blocks anonymous member reads:
       curl "$SUPABASE_URL/rest/v1/members?select=id" -H "apikey: <ANON key>"
       → must return [] or a 401, never rows.
    3. node scripts/build-data.mjs   (regenerates assets/data.js from Supabase)
`);
} catch (err) {
  console.error('\n  Seed failed:', err.message, '\n');
  process.exit(1);
}
