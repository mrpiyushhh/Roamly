/* ============================================================
   Roamly — admin backend (Supabase)

   Replaces the local server.js JSON API with Supabase, without
   rewriting the admin UI: it re-implements the exact same
   `api(method, path, body)` contract the admin already speaks, so
   every existing call site keeps working unchanged.

   Also owns the sign-in gate. Members and expenses are protected by
   Row Level Security, so an unauthenticated visitor who opens /admin
   simply cannot read customer data — the gate is UX, RLS is the
   actual security boundary.

   Load order in admin.html:
     supabase-js (CDN)  →  admin-config.js  →  this file  →  admin's own script
   ============================================================ */
(function (w, d) {
  'use strict';

  var cfg = w.ROAMLY_SUPABASE || {};
  if (!cfg.url || !cfg.anonKey) {
    console.error('[roamly] assets/admin-config.js is missing url/anonKey');
  }

  var sb = w.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  /* ---------- row ⇄ object mapping (mirrors scripts/map.mjs) ---------- */
  function rowToTrip(r) {
    var t = {
      id: r.id, code: r.code, name: r.name, short: r.short,
      accent: r.accent || '', region: r.region, category: r.category,
      days: r.days, grade: r.grade, price: r.price,
      rating: Number(r.rating), reviews: r.reviews, slots: r.slots,
      status: r.status, startDate: r.start_date || '', endDate: r.end_date || '',
      badges: r.badges || [], hero: r.hero, heroAlt: r.hero_alt,
      gallery: r.gallery || [], blurb: r.blurb || [], dates: r.dates,
      itinerary: r.itinerary || [], guide: r.guide || {}, pickups: r.pickups || []
    };
    if (r.featured) t.featured = r.featured;
    return t;
  }
  function tripToRow(t, order) {
    return {
      id: t.id, code: (t.code || '').toUpperCase(), name: t.name, short: t.short,
      accent: t.accent || '', region: t.region, category: t.category || 'weekend',
      days: Number(t.days), grade: t.grade, price: Number(t.price),
      rating: Number(t.rating || 0), reviews: Number(t.reviews || 0),
      slots: Number(t.slots), status: t.status || 'upcoming',
      start_date: t.startDate || '', end_date: t.endDate || '',
      dates: t.dates, featured: t.featured || null,
      hero: t.hero, hero_alt: t.heroAlt,
      badges: t.badges || [], gallery: t.gallery || [], blurb: t.blurb || [],
      itinerary: t.itinerary || [], guide: t.guide || {}, pickups: t.pickups || [],
      sort_order: order == null ? 0 : order
    };
  }
  function rowToMember(r) {
    return {
      id: r.id, tripId: r.trip_id, name: r.name, phone: r.phone || '',
      email: r.email || '', age: r.age == null ? '' : r.age, gender: r.gender || '',
      pickupId: r.pickup_id || '', ref: r.ref || '', amount: r.amount, paid: r.paid,
      status: r.status, attended: !!r.attended, note: r.note || '',
      bookedAt: r.booked_at, paidAt: r.paid_at || ''
    };
  }
  function memberToRow(m) {
    var status = m.status === 'paid' ? 'paid' : 'pending';
    var amount = Number(m.amount || 0);
    return {
      id: m.id, trip_id: m.tripId, name: m.name,
      phone: m.phone || '', email: m.email || '',
      age: (m.age === '' || m.age == null) ? null : Number(m.age),
      gender: m.gender || '', pickup_id: m.pickupId || '', ref: m.ref || '',
      amount: amount,
      paid: status === 'paid' ? amount : Number(m.paid || 0),
      status: status, attended: !!m.attended, note: m.note || '',
      booked_at: m.bookedAt || new Date().toISOString(),
      paid_at: status === 'paid' ? (m.paidAt || new Date().toISOString()) : null
    };
  }

  function newId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function fail(msg, errors) {
    var e = new Error(msg);
    e.error = msg;
    if (errors) e.errors = errors;
    throw e;
  }

  /* ---------- payments summary (was computed in server.js) ---------- */
  function summarise(trips, members) {
    var byTrip = trips.map(function (t) {
      var ms = members.filter(function (m) { return m.tripId === t.id; });
      var confirmed = ms.filter(function (m) { return m.status === 'paid'; });
      var collected = ms.reduce(function (a, m) { return a + Number(m.paid || 0); }, 0);
      var expected = ms.reduce(function (a, m) { return a + Number(m.amount || 0); }, 0);
      return {
        id: t.id, name: t.name, short: t.short, region: t.region,
        price: t.price, slots: t.slots, dates: t.dates,
        members: ms.length, confirmed: confirmed.length,
        pending: ms.length - confirmed.length,
        collected: collected, expected: expected,
        outstanding: expected - collected,
        fill: t.slots ? Math.round((ms.length / t.slots) * 100) : 0
      };
    });
    var totals = byTrip.reduce(function (a, t) {
      return {
        members: a.members + t.members, confirmed: a.confirmed + t.confirmed,
        pending: a.pending + t.pending, collected: a.collected + t.collected,
        expected: a.expected + t.expected, outstanding: a.outstanding + t.outstanding
      };
    }, { members: 0, confirmed: 0, pending: 0, collected: 0, expected: 0, outstanding: 0 });
    totals.tripsWithBookings = byTrip.filter(function (t) { return t.members > 0; }).length;
    return { totals: totals, trips: byTrip };
  }

  /* ---------- loaders ---------- */
  async function loadTrips() {
    var r = await sb.from('trips').select('*').order('sort_order', { ascending: true });
    if (r.error) fail(r.error.message);
    return r.data.map(rowToTrip);
  }
  async function loadSettings() {
    var r = await sb.from('settings').select('deposit,categories').eq('id', 1).single();
    if (r.error) fail(r.error.message);
    return r.data;
  }
  async function loadMembers(tripId) {
    var q = sb.from('members').select('*').order('name', { ascending: true });
    if (tripId) q = q.eq('trip_id', tripId);
    var r = await q;
    if (r.error) fail(r.error.message);
    return r.data.map(rowToMember);
  }

  /* ---------- the api() contract the admin already speaks ---------- */
  async function api(method, path, body) {
    var qs = path.indexOf('?') > -1 ? path.slice(path.indexOf('?') + 1) : '';
    var params = new URLSearchParams(qs);
    var clean = path.split('?')[0];

    /* --- trips --- */
    if (clean === '/api/trips' && method === 'GET') {
      var [trips, settings] = await Promise.all([loadTrips(), loadSettings()]);
      return { trips: trips, deposit: settings.deposit, categories: settings.categories };
    }
    if (clean === '/api/trips' && method === 'POST') {
      var existing = await loadTrips();
      if (existing.some(function (t) { return t.id === body.id; })) {
        fail('validation failed', ['id "' + body.id + '" is already taken']);
      }
      var ins = await sb.from('trips').insert(tripToRow(body, existing.length)).select().single();
      if (ins.error) fail(ins.error.message, [ins.error.message]);
      return { ok: true, trip: rowToTrip(ins.data), count: existing.length + 1 };
    }

    var tripMatch = clean.match(/^\/api\/trips\/([^/]+)(\/duplicate)?$/);
    if (tripMatch) {
      var id = decodeURIComponent(tripMatch[1]);

      if (tripMatch[2] && method === 'POST') {          // duplicate
        var src = await sb.from('trips').select('*').eq('id', id).single();
        if (src.error) fail('no trip "' + id + '"');
        var copy = src.data;
        var all = await loadTrips();
        var n = 2;
        while (all.some(function (t) { return t.id === copy.id + '-' + n; })) n++;
        copy.id = copy.id + '-' + n;
        copy.name = copy.name + ' (copy)';
        delete copy.created_at; delete copy.updated_at;
        var dup = await sb.from('trips').insert(copy).select().single();
        if (dup.error) fail(dup.error.message);
        return { ok: true, trip: rowToTrip(dup.data) };
      }

      if (method === 'PUT') {
        var up = await sb.from('trips').update(tripToRow(body)).eq('id', id).select().single();
        if (up.error) fail(up.error.message, [up.error.message]);
        // members follow a renamed trip; the FK is ON UPDATE restrictive, so
        // move them explicitly when the id actually changed.
        if (body.id && body.id !== id) {
          await sb.from('members').update({ trip_id: body.id }).eq('trip_id', id);
        }
        return { ok: true, trip: rowToTrip(up.data) };
      }

      if (method === 'DELETE') {
        var force = params.get('force') === '1';
        var mem = await sb.from('members').select('id').eq('trip_id', id);
        var booked = (mem.data || []).length;
        if (booked && !force) {
          fail('"' + id + '" has ' + booked + ' member' + (booked === 1 ? '' : 's') +
               ' booked. Remove them first, or confirm deleting them too.');
        }
        var del = await sb.from('trips').delete().eq('id', id);   // cascades to members
        if (del.error) fail(del.error.message);
        return { ok: true, deleted: id, membersRemoved: booked };
      }
    }

    /* --- members --- */
    if (clean === '/api/members' && method === 'GET') {
      var list = await loadMembers(params.get('trip'));
      return { members: list, count: list.length };
    }
    if (clean === '/api/members' && method === 'POST') {
      if (!body.name) fail('validation failed', ['name is required']);
      if (!body.phone && !body.email) {
        fail('validation failed', ['a phone number or an email is required']);
      }
      var tripsForAmount = await loadTrips();
      var t = tripsForAmount.find(function (x) { return x.id === body.tripId; });
      if (!t) fail('validation failed', ['trip "' + body.tripId + '" does not exist']);
      var row = memberToRow(Object.assign({
        id: newId(),
        amount: body.amount === '' || body.amount == null ? t.price : body.amount,
        ref: body.ref || (t.code + '-' + Math.floor(1000 + Math.random() * 9000))
      }, body, { id: body.id || newId() }));
      row.amount = Number(row.amount) || t.price;
      if (row.status === 'paid') row.paid = row.amount;
      var mi = await sb.from('members').insert(row).select().single();
      if (mi.error) fail(mi.error.message, [mi.error.message]);
      return { ok: true, member: rowToMember(mi.data) };
    }

    var memMatch = clean.match(/^\/api\/members\/([^/]+)$/);
    if (memMatch) {
      var mid = decodeURIComponent(memMatch[1]);
      if (method === 'PUT') {
        var cur = await sb.from('members').select('*').eq('id', mid).single();
        if (cur.error) fail('no member "' + mid + '"');
        var merged = Object.assign(rowToMember(cur.data), body, { id: mid });
        var mu = await sb.from('members').update(memberToRow(merged)).eq('id', mid).select().single();
        if (mu.error) fail(mu.error.message, [mu.error.message]);
        return { ok: true, member: rowToMember(mu.data) };
      }
      if (method === 'DELETE') {
        var md = await sb.from('members').delete().eq('id', mid);
        if (md.error) fail(md.error.message);
        return { ok: true, deleted: mid };
      }
    }

    /* --- payments --- */
    if (clean === '/api/payments' && method === 'GET') {
      var [ts, ms] = await Promise.all([loadTrips(), loadMembers(null)]);
      return summarise(ts, ms);
    }

    /* --- settings --- */
    if (clean === '/api/settings' && method === 'PUT') {
      var patch = {};
      if (body.deposit !== undefined) patch.deposit = Number(body.deposit);
      if (Array.isArray(body.categories)) patch.categories = body.categories;
      var su = await sb.from('settings').update(patch).eq('id', 1).select().single();
      if (su.error) fail(su.error.message);
      return { ok: true, deposit: su.data.deposit, categories: su.data.categories };
    }

    fail(method + ' ' + clean + ' is not supported by the Supabase backend');
  }

  /* ---------- roster PDF (serverless function, needs the token) ---------- */
  async function openRosterPdf(tripId, all) {
    var s = await sb.auth.getSession();
    var token = s.data.session && s.data.session.access_token;
    if (!token) { alert('Session expired — sign in again.'); return; }
    var res = await fetch('/api/roster-pdf?trip=' + encodeURIComponent(tripId) + (all ? '&all=1' : ''),
      { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) {
      var e = await res.json().catch(function () { return {}; });
      alert('Could not build the roster: ' + (e.error || res.status));
      return;
    }
    var blob = await res.blob();
    var url = URL.createObjectURL(blob);
    var a = d.createElement('a');
    a.href = url;
    a.download = 'roamly-' + tripId + '-roster.pdf';
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------- sign-in gate & redirect ---------- */
  function redirectToLogin() {
    var path = (w.location.pathname || '').split('/').pop();
    if (path !== 'admin-login.html' && path !== 'login.html') {
      w.location.replace('admin-login.html');
    }
  }

  async function signOut() {
    try {
      await sb.auth.signOut();
    } catch (e) {}
    w.location.replace('admin-login.html');
  }

  /* ---------- boot ---------- */
  w.RoamlyBackend = {
    api: api,
    openRosterPdf: openRosterPdf,
    signOut: signOut,
    client: sb,
    ready: (async function () {
      try {
        var s = await sb.auth.getSession();
        if (!s.data || !s.data.session) {
          redirectToLogin();
          return false;
        }
        return true;
      } catch (err) {
        redirectToLogin();
        return false;
      }
    })()
  };
})(window, document);
