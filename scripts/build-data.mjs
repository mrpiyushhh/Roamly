#!/usr/bin/env node
/* ============================================================
   Roamly — build assets/data.js from Supabase

   Runs during `vercel build`. Pulls trips + settings with the ANON
   key (trips are world-readable by policy) and writes the same
   generated file the nine public pages have always loaded, so none
   of them change.

   Members and expenses are deliberately NOT fetched here. They are
   blocked by RLS for anonymous callers, and they must never reach a
   file that ships to visitors.

   Falls back to the committed assets/data.json when Supabase env vars
   are absent, so a local build or a preview deploy without secrets
   still produces a working site.

       node scripts/build-data.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rowToTrip } from './map.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'data.js');

const RAW_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const RAW_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The shipped .env.local starts life full of placeholders. Treat those as
// "not configured yet" rather than trying to fetch from a fake host — a
// DNS failure is a confusing way to learn you haven't filled the file in.
// Anything that looks real still fails loudly if it doesn't work.
const isPlaceholder = v =>
  !v || /YOUR-PROJECT|YOUR-ANON|eyJhbGciOi\.\.\.|\.\.\.$/.test(v);

const URL_ = isPlaceholder(RAW_URL) ? null : RAW_URL;
const KEY = isPlaceholder(RAW_KEY) ? null : RAW_KEY;

if ((RAW_URL || RAW_KEY) && (!URL_ || !KEY)) {
  console.log('  .env.local still has placeholder values — using assets/data.json');
}

async function fromSupabase() {
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

  const tripsRes = await fetch(
    `${URL_}/rest/v1/trips?select=*&order=sort_order.asc`, { headers });
  if (!tripsRes.ok) throw new Error(`trips ${tripsRes.status}: ${await tripsRes.text()}`);
  const trips = (await tripsRes.json()).map(rowToTrip);

  const setRes = await fetch(
    `${URL_}/rest/v1/settings?id=eq.1&select=deposit,categories`, { headers });
  if (!setRes.ok) throw new Error(`settings ${setRes.status}: ${await setRes.text()}`);
  const settings = (await setRes.json())[0] || { deposit: 1000, categories: [] };

  // A guard, not a formality: if RLS were ever misconfigured to expose
  // members, this build would happily bake customer phone numbers into a
  // public file. Fail loudly instead.
  const leak = await fetch(`${URL_}/rest/v1/members?select=id&limit=1`, { headers });
  if (leak.ok) {
    const rows = await leak.json();
    if (Array.isArray(rows) && rows.length) {
      throw new Error(
        'SECURITY: members are readable with the anon key. Check RLS on public.members ' +
        'before deploying — build aborted so PII is not baked into data.js.');
    }
  }

  return { trips, deposit: settings.deposit, categories: settings.categories };
}

function fromLocalJson() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'data.json'), 'utf8'));
  return { trips: raw.trips, deposit: raw.deposit, categories: raw.categories };
}

function render({ trips, deposit, categories }, source) {
  const payload = { deposit, categories, trips };
  return `/* ============================================================
   Roamly — content
   GENERATED FILE — do not edit by hand.
   Built from ${source} by scripts/build-data.mjs.
   Member and expense records are intentionally NOT included here.
   Generated: ${new Date().toISOString()}
   ============================================================ */
(function (w) {
  'use strict';

  var DATA = ${JSON.stringify(payload, null, 2)};

  w.RoamlyData = {
    trips: DATA.trips,
    categories: DATA.categories,
    DEPOSIT: DATA.deposit,
    byId: function (id) {
      for (var i = 0; i < DATA.trips.length; i++) {
        if (DATA.trips[i].id === id) return DATA.trips[i];
      }
      return DATA.trips[0];
    }
  };
})(window);
`;
}

const useSupabase = Boolean(URL_ && KEY);
try {
  const data = useSupabase ? await fromSupabase() : fromLocalJson();
  if (!data.trips || !data.trips.length) throw new Error('no trips returned — refusing to write an empty data.js');

  fs.writeFileSync(OUT, render(data, useSupabase ? 'Supabase' : 'assets/data.json (local fallback)'));
  console.log(
    `  data.js written — ${data.trips.length} trips, deposit ${data.deposit}, ` +
    `source: ${useSupabase ? 'Supabase' : 'local data.json'}`);
} catch (err) {
  console.error('  build-data failed:', err.message);
  process.exit(1);
}
