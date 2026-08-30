# Deploying Roamly — Vercel + Supabase

Static front end on Vercel's CDN. Trips, members and expenses in Supabase
Postgres, with Auth and Row Level Security guarding the admin.

```
Vercel (static + 1 function)          Supabase (Postgres)
├── index / trips / trip              ├── trips      ← world-readable
├── book-1…4 / confirmation           ├── members    ← signed-in only (PII)
├── my-trip                           ├── expenses   ← signed-in only
├── assets/data.js  ◄── built ────────┤ settings     ← world-readable
├── admin.html ──────────────────────►┘ Auth + RLS
└── api/roster-pdf.js
```

**The public site never talks to Supabase at runtime.** `assets/data.js` is
generated at build time and served as a static file, so all nine public pages
work exactly as they do today — no async, no loading states, no API dependency.
Only the admin holds a live connection.

---

## 1. Create the Supabase project

1. New project at [supabase.com](https://supabase.com) — note the region.
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → Run.
3. **Project Settings → API** — copy the Project URL, the `anon` key, and the
   `service_role` key.

## 2. Create your admin user

**Authentication → Users → Add user.** Use a real email and a strong password,
and tick *Auto Confirm User*.

There is no public sign-up: the schema grants write access to any
`authenticated` role, so only users you create here can edit anything. If you
later open sign-ups, tighten those policies first.

## 3. Migrate the existing data

Run once from this folder. The `service_role` key bypasses RLS — keep it out of
git, and out of the browser.

```bash
SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
node scripts/seed-supabase.mjs --dry-run     # inspect first

SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-supabase.mjs
```

Moves 13 trips, 21 members, 6 expenses and your settings row. Safe to re-run —
rows upsert on primary key.

**Then verify RLS actually holds**, using the *anon* key:

```bash
curl "$SUPABASE_URL/rest/v1/members?select=id" -H "apikey: <ANON KEY>"
```

This must return `[]`. If it returns rows, members are publicly readable — stop
and fix the policies before deploying.

## 4. Point the admin at your project

Edit `assets/admin-config.js`:

```js
window.ROAMLY_SUPABASE = {
  url: 'https://YOUR-PROJECT.supabase.co',
  anonKey: 'eyJ...'          // anon key — safe in the browser
};
```

The anon key is *meant* to be public. RLS is what protects the data, not the
secrecy of that key. Never put `service_role` here.

## 5. Deploy to Vercel

```bash
npx vercel          # preview
npx vercel --prod   # production
```

Set these in **Project Settings → Environment Variables** (Production *and*
Preview):

| Variable | Value | Why |
|---|---|---|
| `SUPABASE_URL` | your project URL | build + PDF function |
| `SUPABASE_ANON_KEY` | anon key | build + PDF function |

`vercel.json` runs `node scripts/build-data.mjs` on every deploy, which pulls
trips from Supabase and writes `assets/data.js`. Without the env vars it falls
back to the committed `assets/data.json`, so a preview build still succeeds.

## 6. Publishing content changes

The public site reads a build artifact, so edits in the admin go live on the
next build:

1. **Vercel → Settings → Git → Deploy Hooks** → create one, e.g. `admin-publish`.
2. Paste the URL and the site rebuilds in ~30s with the new data.

Trigger it manually, or wire it to a "Publish" button in the admin later.

---

## What runs where

| Piece | Where | Notes |
|---|---|---|
| 9 public pages | Vercel CDN | fully static |
| `assets/data.js` | built at deploy | trips + settings only, never PII |
| `admin.html` | Vercel CDN | talks to Supabase from the browser |
| Trips / members / expenses | Supabase Postgres | RLS enforced |
| Sign-in | Supabase Auth | email + password |
| Roster PDF | `api/roster-pdf.js` | Vercel function, needs the caller's token |

## Security notes

- **Members are never in `data.js`.** `scripts/build-data.mjs` actively checks
  whether the anon key can read members and **aborts the build** if it can,
  rather than baking customer phone numbers into a public file.
- **The PDF function forwards the caller's token** rather than using
  `service_role`. It is internet-reachable, so a bypass key there would expose
  every customer record.
- **`assets/data.js` is gitignored** — it is generated, and committing it invites
  drift with Supabase.

## Local development

`server.js` still works unchanged for offline use:

```bash
npm run dev        # http://localhost:4000
```

It reads and writes `assets/data.json` directly. **Once you migrate, Supabase is
authoritative** — editing locally through `server.js` will drift from it. Use it
for previewing the front end, and the deployed admin for real edits. Retire it
once you are happy.

To rebuild `assets/data.js` from Supabase locally:

```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run build
```
