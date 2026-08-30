/* ============================================================
   Roamly — GET /api/roster-pdf?trip=<id>[&all=1]

   Vercel serverless function. Returns the confirmed-member roster as
   a PDF with an attendance column.

   Auth: the caller must pass the Supabase access token of a signed-in
   admin as `Authorization: Bearer <token>`. Members are protected by
   RLS, so an anonymous or invalid token simply reads no rows — but we
   reject it explicitly rather than quietly returning an empty roster,
   which would look like "this trip has no bookings".
   ============================================================ */
'use strict';

const { buildRosterPDF } = require('../lib/roster-pdf.js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function rowToTrip(r) {
  return {
    id: r.id, code: r.code, name: r.name, short: r.short, region: r.region,
    days: r.days, grade: r.grade, dates: r.dates,
    guide: r.guide || {}, pickups: r.pickups || []
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!SUPABASE_URL || !ANON_KEY) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  const tripId = (req.query.trip || '').toString();
  const all = req.query.all === '1';
  if (!tripId) return res.status(400).json({ error: 'missing ?trip=<id>' });

  const auth = req.headers.authorization || '';
  if (!/^Bearer\s+.+/i.test(auth)) {
    return res.status(401).json({
      error: 'sign in required — member records are not publicly readable'
    });
  }

  // Forward the admin's own token so Postgres evaluates RLS as that user.
  // The service-role key is deliberately not used here: this function is
  // reachable from the internet, and a leaked bypass would expose every
  // customer record.
  const headers = { apikey: ANON_KEY, Authorization: auth };

  try {
    const tRes = await fetch(
      `${SUPABASE_URL}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}&select=*`, { headers });
    if (!tRes.ok) throw new Error(`trips ${tRes.status}`);
    const trips = await tRes.json();
    if (!trips.length) return res.status(404).json({ error: `no trip "${tripId}"` });
    const trip = rowToTrip(trips[0]);

    const filter = all ? '' : '&status=eq.paid';
    const mRes = await fetch(
      `${SUPABASE_URL}/rest/v1/members?trip_id=eq.${encodeURIComponent(tripId)}` +
      `${filter}&select=*&order=name.asc`, { headers });
    if (mRes.status === 401 || mRes.status === 403) {
      return res.status(401).json({ error: 'session expired — sign in again' });
    }
    if (!mRes.ok) throw new Error(`members ${mRes.status}`);

    const members = (await mRes.json()).map(m => {
      const p = (trip.pickups || []).find(x => x.id === m.pickup_id);
      return {
        name: m.name, phone: m.phone, email: m.email,
        age: m.age, gender: m.gender, ref: m.ref, paid: m.paid,
        _pickup: p ? `${p.place} ${p.time}` : ''
      };
    });

    const pdf = buildRosterPDF(trip, members, { all });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Content-Disposition',
      `attachment; filename="roamly-${trip.id}-roster.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(pdf);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
