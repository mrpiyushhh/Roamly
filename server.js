#!/usr/bin/env node
/* ============================================================
   Roamly - local content + operations server

   Serves the public site and backs the admin panel:
     · trips     full CRUD
     · members   per-trip bookings, payment status, attendance
     · payments  global and per-trip money summaries
     · roster    printable PDF of confirmed members

   assets/data.json is the source of truth. Every write
   regenerates assets/data.js so the public pages keep working
   with no server running.

   PRIVACY: members never enter assets/data.js. That file is
   loaded by the public site; member contact details are
   admin-only and stay in data.json.

   Zero dependencies. Node 16+.

       node server.js                             → :4000
       PORT=8080 node server.js
       ROAMLY_ADMIN_TOKEN=secret node server.js    (gate writes)
   ============================================================ */
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT      = __dirname;
const DATA_JSON = path.join(ROOT, 'assets', 'data.json');
const DATA_JS   = path.join(ROOT, 'assets', 'data.js');
const BACKUPS   = path.join(ROOT, 'assets', 'backups');

const PORT  = Number(process.env.PORT || 4000);
const TOKEN = process.env.ROAMLY_ADMIN_TOKEN || '';

const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.pdf':'application/pdf',
  '.md':'text/markdown; charset=utf-8'
};

/* ============================================================
   DATA
   ============================================================ */

function readData() {
  const d = JSON.parse(fs.readFileSync(DATA_JSON, 'utf8'));
  if (!Array.isArray(d.members)) d.members = [];
  return d;
}

function writeData(data) {
  data.updated = new Date().toISOString();

  try {
    fs.mkdirSync(BACKUPS, { recursive: true });
    if (fs.existsSync(DATA_JSON)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(DATA_JSON, path.join(BACKUPS, `data.${stamp}.json`));
      const old = fs.readdirSync(BACKUPS).filter(f => f.endsWith('.json')).sort();
      old.slice(0, Math.max(0, old.length - 20)).forEach(f => fs.unlinkSync(path.join(BACKUPS, f)));
    }
  } catch (e) { console.warn('  ! backup skipped:', e.message); }

  fs.writeFileSync(DATA_JSON, JSON.stringify(data, null, 2) + '\n');

  // NOTE: members are deliberately excluded - the public site must not ship PII.
  const publicData = { deposit: data.deposit, categories: data.categories, trips: data.trips };

  fs.writeFileSync(DATA_JS,
`/* ============================================================
   Roamly - content
   GENERATED FILE - do not edit by hand.
   Source of truth is assets/data.json; this is rewritten by
   server.js whenever the admin panel saves.
   Member records are intentionally NOT included here.
   Last generated: ${data.updated}
   ============================================================ */
(function (w) {
  'use strict';

  var DATA = ${JSON.stringify(publicData, null, 2)};

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
`);
  return data;
}

/* ============================================================
   VALIDATION
   ============================================================ */

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const s = v => (typeof v === 'string' ? v.trim() : '');
const n = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

function validateTrip(t, all, originalId) {
  const e = [];
  if (!SLUG.test(s(t.id))) e.push('id must be lowercase letters, numbers and hyphens');
  else if (all.some(x => x.id === t.id && x.id !== originalId)) e.push(`id "${t.id}" is already taken`);

  if (!s(t.name))    e.push('name is required');
  if (!s(t.short))   e.push('short name is required');
  if (!s(t.region))  e.push('region is required');
  if (!s(t.grade))   e.push('grade is required');
  if (!s(t.dates))   e.push('departure dates are required');
  if (!s(t.hero))    e.push('hero image URL is required');
  if (!s(t.heroAlt)) e.push('hero alt text is required (accessibility)');
  if (!/^[A-Z]{2,4}$/.test(s(t.code))) e.push('code must be 2–4 uppercase letters');

  const num = (k, min, max) => {
    const v = Number(t[k]);
    if (!Number.isFinite(v) || v < min || v > max) e.push(`${k} must be between ${min} and ${max}`);
  };
  num('days',1,60); num('price',0,1000000); num('rating',0,5);
  num('reviews',0,100000); num('slots',1,100);

  if (!Array.isArray(t.blurb)     || !t.blurb.filter(Boolean).length) e.push('at least one blurb paragraph is required');
  if (!Array.isArray(t.itinerary) || !t.itinerary.length)             e.push('at least one itinerary stage is required');
  if (!Array.isArray(t.pickups)   || !t.pickups.length)               e.push('at least one pickup point is required');
  if (!Array.isArray(t.gallery)   || t.gallery.length !== 4)          e.push('gallery must have exactly 4 images (the detail mosaic expects 4)');

  (t.itinerary || []).forEach((x, i) => { if (!s(x && x.t)) e.push(`itinerary stage ${i+1} needs a title`); });
  (t.pickups || []).forEach((p, i) => {
    if (!s(p && p.place)) e.push(`pickup ${i+1} needs a place`);
    if (!s(p && p.time))  e.push(`pickup ${i+1} needs a reporting time`);
    if (!SLUG.test(s(p && p.id))) e.push(`pickup ${i+1} needs a valid id`);
  });
  const pids = (t.pickups||[]).map(p => p && p.id);
  if (new Set(pids).size !== pids.length) e.push('pickup ids must be unique within a trip');
  if ((t.pickups||[]).length && !(t.pickups||[]).some(p => p && p.recommended)) e.push('mark one pickup as recommended');
  if (!t.guide || !s(t.guide.name)) e.push('guide name is required');
  if (t.category && !['weekend','alpine','expert'].includes(t.category)) e.push('category must be weekend, alpine or expert');
  return e;
}

function normaliseTrip(t) {
  return {
    id:s(t.id), code:s(t.code).toUpperCase(), name:s(t.name), short:s(t.short),
    accent:s(t.accent), region:s(t.region), category:s(t.category)||'weekend',
    days:n(t.days), grade:s(t.grade), price:n(t.price),
    rating:Math.round(n(t.rating)*10)/10, reviews:n(t.reviews), slots:n(t.slots),
    badges:(t.badges||[]).map(s).filter(Boolean),
    featured:s(t.featured)||undefined,
    hero:s(t.hero), heroAlt:s(t.heroAlt),
    gallery:(t.gallery||[]).map(g=>({src:s(g.src),alt:s(g.alt)})),
    blurb:(t.blurb||[]).map(s).filter(Boolean),
    dates:s(t.dates),
    itinerary:(t.itinerary||[]).map(i=>({t:s(i.t),d:s(i.d)})),
    guide:{ name:s(t.guide&&t.guide.name), role:s(t.guide&&t.guide.role),
            bio:s(t.guide&&t.guide.bio), quote:s(t.guide&&t.guide.quote),
            photo:s(t.guide&&t.guide.photo) },
    pickups:(t.pickups||[]).map(p=>{
      const o={id:s(p.id),place:s(p.place),note:s(p.note),time:s(p.time)};
      if (p.recommended) o.recommended = true;
      return o;
    })
  };
}

function validateMember(m, trips) {
  const e = [];
  if (!s(m.name)) e.push('name is required');
  if (!trips.some(t => t.id === m.tripId)) e.push(`trip "${m.tripId}" does not exist`);
  if (!s(m.phone) && !s(m.email)) e.push('a phone number or an email is required');
  if (s(m.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s(m.email))) e.push('email looks invalid');
  if (!['paid','pending'].includes(m.status)) e.push('status must be paid or pending');
  const amt = Number(m.amount);
  if (!Number.isFinite(amt) || amt < 0) e.push('amount must be zero or more');
  const paid = Number(m.paid);
  if (!Number.isFinite(paid) || paid < 0) e.push('paid must be zero or more');
  if (paid > amt) e.push('paid cannot exceed the amount due');
  if (m.age !== '' && m.age != null && (n(m.age) < 5 || n(m.age) > 95)) e.push('age must be between 5 and 95');
  return e;
}

function normaliseMember(m, trips) {
  const trip = trips.find(t => t.id === m.tripId);
  const amount = m.amount === '' || m.amount == null ? (trip ? trip.price : 0) : n(m.amount);
  const status = m.status === 'paid' ? 'paid' : 'pending';
  // Marking someone paid means the money is fully in.
  const paid = status === 'paid' ? amount : n(m.paid);
  return {
    id: s(m.id) || newId(),
    tripId: s(m.tripId),
    name: s(m.name),
    phone: s(m.phone),
    email: s(m.email),
    age: m.age === '' || m.age == null ? '' : n(m.age),
    gender: s(m.gender),
    pickupId: s(m.pickupId),
    ref: s(m.ref) || (trip ? trip.code : 'RML') + '-' + Math.floor(1000 + Math.random()*9000),
    amount, paid, status,
    note: s(m.note),
    bookedAt: s(m.bookedAt) || new Date().toISOString(),
    paidAt: status === 'paid' ? (s(m.paidAt) || new Date().toISOString()) : ''
  };
}

function newId() {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ============================================================
   SUMMARIES
   ============================================================ */

function paymentSummary(data) {
  const byTrip = data.trips.map(t => {
    const ms = data.members.filter(m => m.tripId === t.id);
    const confirmed = ms.filter(m => m.status === 'paid');
    const collected = ms.reduce((a, m) => a + n(m.paid), 0);
    const expected  = ms.reduce((a, m) => a + n(m.amount), 0);
    return {
      id: t.id, name: t.name, short: t.short, region: t.region,
      price: t.price, slots: t.slots, dates: t.dates,
      members: ms.length,
      confirmed: confirmed.length,
      pending: ms.length - confirmed.length,
      collected, expected,
      outstanding: expected - collected,
      fill: t.slots ? Math.round((ms.length / t.slots) * 100) : 0
    };
  });

  const totals = byTrip.reduce((a, t) => ({
    members: a.members + t.members,
    confirmed: a.confirmed + t.confirmed,
    pending: a.pending + t.pending,
    collected: a.collected + t.collected,
    expected: a.expected + t.expected,
    outstanding: a.outstanding + t.outstanding
  }), { members:0, confirmed:0, pending:0, collected:0, expected:0, outstanding:0 });

  totals.tripsWithBookings = byTrip.filter(t => t.members > 0).length;
  return { totals, trips: byTrip };
}

/* ============================================================
   PDF  - minimal writer, no dependencies
   A4 landscape roster with an attendance column.
   ============================================================ */

function pdfText(v) {
  // PDF standard fonts are Latin-1; drop anything outside it, escape delimiters.
  return String(v == null ? '' : v)
    .normalize('NFKD')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–-]/g, '-').replace(/₹/g, 'Rs.')
    .replace(/[·•]/g, '|')          // keep separators visible in Latin-1
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function fit(v, max) {
  const t = String(v == null ? '' : v);
  return t.length <= max ? t : t.slice(0, Math.max(0, max - 1)) + '…';
}

function buildRosterPDF(trip, members, opts) {
  const W = 842, H = 595;            // A4 landscape
  const L = 36, R = W - 36;
  const COLS = [
    { k:'n',    label:'#',          x:L,       w:26,  max:4  },
    { k:'name', label:'NAME',       x:L+26,    w:168, max:30 },
    { k:'con',  label:'CONTACT',    x:L+194,   w:112, max:20 },
    { k:'ag',   label:'AGE',        x:L+306,   w:44,  max:7  },
    { k:'pick', label:'PICKUP',     x:L+350,   w:170, max:30 },
    { k:'ref',  label:'REF',        x:L+520,   w:78,  max:12 },
    { k:'amt',  label:'PAID',       x:L+598,   w:78,  max:12 },
    { k:'att',  label:'ATTENDANCE', x:L+676,   w:R-(L+676), max:0 }
  ];
  const ROW = 24, TOP = H - 118, BOTTOM = 54;
  const perPage = Math.floor((TOP - BOTTOM) / ROW);
  const pages = [];
  for (let i = 0; i < Math.max(1, Math.ceil(members.length / perPage)); i++) {
    pages.push(members.slice(i * perPage, (i + 1) * perPage));
  }

  const streams = pages.map((rows, pi) => {
    let c = '';
    const txt = (x, y, str, size, bold) =>
      `BT /${bold ? 'FB' : 'FR'} ${size} Tf ${x} ${y} Td (${pdfText(str)}) Tj ET\n`;
    const line = (x1, y1, x2, y2, w) =>
      `${w} w ${x1} ${y1} m ${x2} ${y2} l S\n`;
    const box = (x, y, w, h) => `0.45 w ${x} ${y} ${w} ${h} re S\n`;

    // header
    c += '0 0 0 rg 0 0 0 RG\n';
    c += txt(L, H - 52, 'ROAMLY', 20, true);
    c += txt(L + 96, H - 52, (opts && opts.all) ? 'ALL BOOKINGS' : 'CONFIRMED ROSTER', 12, false);
    c += txt(L, H - 72, fit(trip.name, 70), 13, true);
    c += txt(L, H - 88,
      `${trip.region}  ·  ${trip.dates}  ·  ${trip.days} day${trip.days === 1 ? '' : 's'}  ·  Grade: ${trip.grade}`, 9, false);
    c += txt(R - 210, H - 52,
      `Generated ${new Date().toISOString().slice(0, 10)}`, 9, false);
    c += txt(R - 210, H - 66,
      `Confirmed: ${members.length}   Guide: ${fit(trip.guide && trip.guide.name || '-', 22)}`, 9, false);

    c += line(L, H - 100, R, H - 100, 1.1);

    // column headers
    COLS.forEach(col => { c += txt(col.x + 4, TOP + 8, col.label, 7.5, true); });
    c += line(L, TOP + 2, R, TOP + 2, 0.7);

    // rows
    rows.forEach((m, i) => {
      const y = TOP - (i * ROW) - 14;
      const idx = pi * perPage + i + 1;
      const cells = {
        n: String(idx),
        name: fit(m.name, 30),
        con: fit(m.phone || m.email || '-', 20),
        ag: [m.age || '', (m.gender || '').slice(0, 1)].filter(Boolean).join(' ') || '-',
        pick: fit(m._pickup || '-', 30),
        ref: fit(m.ref || '-', 12),
        amt: 'Rs.' + Number(m.paid || 0).toLocaleString('en-IN')
      };
      COLS.forEach(col => {
        if (col.k === 'att') {
          c += box(col.x + 8, y - 5, 15, 15);          // tick box
          c += line(col.x + 32, y - 5, R - 6, y - 5, 0.45); // signature rule
        } else {
          c += txt(col.x + 4, y, cells[col.k], 9, col.k === 'name');
        }
      });
      c += line(L, y - 10, R, y - 10, 0.25);
    });

    if (!rows.length) c += txt(L + 4, TOP - 16, 'No confirmed members yet.', 10, false);

    // footer
    c += line(L, BOTTOM + 16, R, BOTTOM + 16, 0.7);
    c += txt(L, BOTTOM, 'Roamly Adventures Pvt Ltd  ·  carry a photo ID  ·  reporting times are fixed', 8, false);
    c += txt(R - 92, BOTTOM, `Page ${pi + 1} of ${pages.length}`, 8, false);
    return c;
  });

  // assemble objects
  const objs = [];
  const ref = i => `${i} 0 R`;
  const nPages = pages.length;
  const kids = [];
  const FONT_R = 3, FONT_B = 4;
  let next = 5;
  const pageIds = [], contentIds = [];
  for (let i = 0; i < nPages; i++) { pageIds.push(next++); contentIds.push(next++); }

  objs[1] = `<< /Type /Catalog /Pages ${ref(2)} >>`;
  objs[2] = `<< /Type /Pages /Count ${nPages} /Kids [${pageIds.map(ref).join(' ')}] >>`;
  objs[FONT_R] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[FONT_B] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  pageIds.forEach((pid, i) => {
    objs[pid] = `<< /Type /Page /Parent ${ref(2)} /MediaBox [0 0 ${W} ${H}] ` +
      `/Resources << /Font << /FR ${ref(FONT_R)} /FB ${ref(FONT_B)} >> >> /Contents ${ref(contentIds[i])} >>`;
    const body = streams[i];
    objs[contentIds[i]] = `<< /Length ${Buffer.byteLength(body, 'latin1')} >>\nstream\n${body}endstream`;
  });

  let out = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 1; i < objs.length; i++) {
    if (!objs[i]) continue;
    offsets[i] = Buffer.byteLength(out, 'latin1');
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(out, 'latin1');
  const count = objs.length;
  out += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) {
    out += String(offsets[i] || 0).padStart(10, '0') + ' 00000 n \n';
  }
  out += `trailer\n<< /Size ${count} /Root ${ref(1)} >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

/* ============================================================
   HTTP
   ============================================================ */

function json(res, code, body) {
  const b = JSON.stringify(body);
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8',
    'Content-Length':Buffer.byteLength(b), 'Cache-Control':'no-store' });
  res.end(b);
}

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 2e6) { reject(new Error('payload too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('invalid JSON body')); } });
    req.on('error', reject);
  });
}

const authed = req => !TOKEN || (req.headers['x-admin-token'] || '') === TOKEN;

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/')      rel = '/index.html';
  if (rel === '/admin') rel = '/admin.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep)) return json(res, 403, { error:'forbidden' });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8' });
      return res.end('<h1>404</h1><p><a href="/">Site</a> · <a href="/admin">Admin</a></p>');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size, 'Cache-Control':'no-store' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';
  const [pathname, qs] = url.split('?');
  const params = new URLSearchParams(qs || '');

  /* ---- roster PDF (a GET that returns a file) ---- */
  const pdfMatch = pathname.match(/^\/api\/trips\/([^/]+)\/roster\.pdf$/);
  if (pdfMatch && req.method === 'GET') {
    try {
      const data = readData();
      const id = decodeURIComponent(pdfMatch[1]);
      const trip = data.trips.find(t => t.id === id);
      if (!trip) return json(res, 404, { error:`no trip "${id}"` });

      const all = params.get('all') === '1';
      const list = data.members
        .filter(m => m.tripId === id && (all || m.status === 'paid'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(m => {
          const p = (trip.pickups || []).find(x => x.id === m.pickupId);
          return Object.assign({}, m, { _pickup: p ? `${p.place} ${p.time}` : '' });
        });

      const pdf = buildRosterPDF(trip, list, { all });
      const fname = `roamly-${trip.id}-roster.pdf`;
      res.writeHead(200, {
        'Content-Type':'application/pdf',
        'Content-Length':pdf.length,
        'Content-Disposition':`attachment; filename="${fname}"`,
        'Cache-Control':'no-store'
      });
      console.log(`  ↓ roster pdf  ${trip.id} (${list.length} rows)`);
      return res.end(pdf);
    } catch (err) {
      console.error('  ! pdf:', err.message);
      return json(res, 500, { error:err.message });
    }
  }

  if (!pathname.startsWith('/api/')) return serveStatic(req, res, url);

  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && !authed(req)) return json(res, 401, { error:'admin token required' });

  try {
    const data = readData();

    /* ---------- payments ---------- */
    if (pathname === '/api/payments' && req.method === 'GET') {
      return json(res, 200, paymentSummary(data));
    }

    /* ---------- members ---------- */
    if (pathname === '/api/members' && req.method === 'GET') {
      const trip = params.get('trip');
      const list = trip ? data.members.filter(m => m.tripId === trip) : data.members;
      return json(res, 200, { members: list, count: list.length });
    }

    if (pathname === '/api/members' && req.method === 'POST') {
      const m = normaliseMember(await body(req), data.trips);
      const errors = validateMember(m, data.trips);
      if (errors.length) return json(res, 422, { error:'validation failed', errors });
      data.members.push(m);
      writeData(data);
      console.log(`  + member   ${m.name} → ${m.tripId} (${m.status})`);
      return json(res, 201, { ok:true, member:m });
    }

    const memMatch = pathname.match(/^\/api\/members\/([^/]+)$/);
    if (memMatch) {
      const id = decodeURIComponent(memMatch[1]);
      const idx = data.members.findIndex(m => m.id === id);
      if (idx === -1) return json(res, 404, { error:`no member "${id}"` });

      if (req.method === 'PUT') {
        const incoming = await body(req);
        const merged = Object.assign({}, data.members[idx], incoming, { id });
        const m = normaliseMember(merged, data.trips);
        const errors = validateMember(m, data.trips);
        if (errors.length) return json(res, 422, { error:'validation failed', errors });
        data.members[idx] = m;
        writeData(data);
        console.log(`  ~ member   ${m.name} (${m.status})`);
        return json(res, 200, { ok:true, member:m });
      }

      if (req.method === 'DELETE') {
        const [gone] = data.members.splice(idx, 1);
        writeData(data);
        console.log(`  - member   ${gone.name} removed from ${gone.tripId}`);
        return json(res, 200, { ok:true, deleted:gone.id });
      }
    }

    /* ---------- trips ---------- */
    const tripMatch = pathname.match(/^\/api\/trips\/([^/]+)/);
    const tripId = tripMatch ? decodeURIComponent(tripMatch[1]) : null;

    if (pathname.startsWith('/api/trips') && req.method === 'GET') {
      return json(res, 200, tripId ? (data.trips.find(t => t.id === tripId) || null)
                                   : { deposit:data.deposit, categories:data.categories, trips:data.trips });
    }

    if (pathname === '/api/trips' && req.method === 'POST') {
      const trip = normaliseTrip(await body(req));
      const errors = validateTrip(trip, data.trips, null);
      if (errors.length) return json(res, 422, { error:'validation failed', errors });
      data.trips.push(trip);
      writeData(data);
      console.log(`  + trip     ${trip.id}`);
      return json(res, 201, { ok:true, trip, count:data.trips.length });
    }

    if (tripId && req.method === 'POST' && pathname.endsWith('/duplicate')) {
      const src = data.trips.find(t => t.id === tripId);
      if (!src) return json(res, 404, { error:`no trip "${tripId}"` });
      const copy = JSON.parse(JSON.stringify(src));
      let i = 2; while (data.trips.some(t => t.id === `${src.id}-${i}`)) i++;
      copy.id = `${src.id}-${i}`;
      copy.name = `${src.name} (copy)`;
      data.trips.push(copy);
      writeData(data);
      console.log(`  + trip     ${tripId} → ${copy.id}`);
      return json(res, 201, { ok:true, trip:copy });
    }

    if (tripId && req.method === 'PUT') {
      const idx = data.trips.findIndex(t => t.id === tripId);
      if (idx === -1) return json(res, 404, { error:`no trip "${tripId}"` });
      const trip = normaliseTrip(await body(req));
      const errors = validateTrip(trip, data.trips, tripId);
      if (errors.length) return json(res, 422, { error:'validation failed', errors });
      data.trips[idx] = trip;
      // keep member records attached if the id was renamed
      if (trip.id !== tripId) {
        data.members.forEach(m => { if (m.tripId === tripId) m.tripId = trip.id; });
      }
      writeData(data);
      console.log(`  ~ trip     ${tripId}${trip.id !== tripId ? ` → ${trip.id}` : ''}`);
      return json(res, 200, { ok:true, trip });
    }

    if (tripId && req.method === 'DELETE') {
      const idx = data.trips.findIndex(t => t.id === tripId);
      if (idx === -1) return json(res, 404, { error:`no trip "${tripId}"` });
      if (data.trips.length === 1) return json(res, 409, { error:'cannot delete the last trip' });
      const booked = data.members.filter(m => m.tripId === tripId).length;
      if (booked && params.get('force') !== '1') {
        return json(res, 409, {
          error:`"${tripId}" has ${booked} member${booked===1?'':'s'} booked. Remove them first, or confirm deleting them too.`,
          members: booked
        });
      }
      const [gone] = data.trips.splice(idx, 1);
      data.members = data.members.filter(m => m.tripId !== tripId);
      writeData(data);
      console.log(`  - trip     ${gone.id}${booked ? ` (+${booked} members)` : ''}`);
      return json(res, 200, { ok:true, deleted:gone.id, membersRemoved:booked, count:data.trips.length });
    }

    /* ---------- settings ---------- */
    if (pathname === '/api/settings' && req.method === 'PUT') {
      const b = await body(req);
      if (b.deposit !== undefined) {
        const d = Number(b.deposit);
        if (!Number.isFinite(d) || d < 0) return json(res, 422, { error:'deposit must be a positive number' });
        data.deposit = d;
      }
      if (Array.isArray(b.categories)) data.categories = b.categories;
      writeData(data);
      return json(res, 200, { ok:true, deposit:data.deposit, categories:data.categories });
    }

    return json(res, 405, { error:`${req.method} not supported on ${pathname}` });
  } catch (err) {
    console.error('  ! ' + err.message);
    return json(res, 400, { error:err.message });
  }
});

server.listen(PORT, () => {
  const d = readData();
  const p = paymentSummary(d);
  console.log('');
  console.log('  Roamly is running');
  console.log('  ─────────────────────────────────────────');
  console.log(`  Site     http://localhost:${PORT}/`);
  console.log(`  Admin    http://localhost:${PORT}/admin`);
  console.log('');
  console.log(`  ${d.trips.length} trips · ${d.members.length} members · ` +
              `Rs.${p.totals.collected.toLocaleString('en-IN')} collected · ` +
              `Rs.${p.totals.outstanding.toLocaleString('en-IN')} outstanding`);
  console.log('  Member records stay in data.json - never in the public data.js.');
  console.log(TOKEN ? '  Writes require X-Admin-Token.'
                    : '  Writes are unauthenticated - local use only.');
  console.log('');
});
