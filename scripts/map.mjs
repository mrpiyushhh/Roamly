/* ============================================================
   Roamly — row ⇄ object mapping

   Postgres columns are snake_case; the front-end has always used
   camelCase. One place owns that translation so the seed script and
   the build script can never disagree about it.
   ============================================================ */

export function tripToRow(t, i = 0) {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    short: t.short,
    accent: t.accent ?? '',
    region: t.region,
    category: t.category ?? 'weekend',
    days: Number(t.days),
    grade: t.grade,
    price: Number(t.price),
    rating: Number(t.rating ?? 0),
    reviews: Number(t.reviews ?? 0),
    slots: Number(t.slots),
    status: t.status ?? 'upcoming',
    start_date: t.startDate ?? '',
    end_date: t.endDate ?? '',
    dates: t.dates,
    featured: t.featured ?? null,
    hero: t.hero,
    hero_alt: t.heroAlt,
    badges: t.badges ?? [],
    gallery: t.gallery ?? [],
    blurb: t.blurb ?? [],
    itinerary: t.itinerary ?? [],
    guide: t.guide ?? {},
    pickups: t.pickups ?? [],
    sort_order: i
  };
}

export function rowToTrip(r) {
  // Shape must match exactly what the nine public pages already read.
  const t = {
    id: r.id,
    code: r.code,
    name: r.name,
    short: r.short,
    accent: r.accent || '',
    region: r.region,
    category: r.category,
    days: r.days,
    grade: r.grade,
    price: r.price,
    rating: Number(r.rating),
    reviews: r.reviews,
    slots: r.slots,
    status: r.status,
    startDate: r.start_date || '',
    endDate: r.end_date || '',
    badges: r.badges ?? [],
    hero: r.hero,
    heroAlt: r.hero_alt,
    gallery: r.gallery ?? [],
    blurb: r.blurb ?? [],
    dates: r.dates,
    itinerary: r.itinerary ?? [],
    guide: r.guide ?? {},
    pickups: r.pickups ?? []
  };
  // `featured` is absent rather than null in the current data.js
  if (r.featured) t.featured = r.featured;
  return t;
}

export function memberToRow(m) {
  return {
    id: m.id,
    trip_id: m.tripId,
    name: m.name,
    phone: m.phone ?? '',
    email: m.email ?? '',
    age: m.age === '' || m.age == null ? null : Number(m.age),
    gender: m.gender ?? '',
    pickup_id: m.pickupId ?? '',
    ref: m.ref ?? '',
    amount: Number(m.amount ?? 0),
    paid: Number(m.paid ?? 0),
    status: m.status === 'paid' ? 'paid' : 'pending',
    attended: !!m.attended,
    note: m.note ?? '',
    booked_at: m.bookedAt || new Date().toISOString(),
    paid_at: m.paidAt || null
  };
}

export function rowToMember(r) {
  return {
    id: r.id,
    tripId: r.trip_id,
    name: r.name,
    phone: r.phone || '',
    email: r.email || '',
    age: r.age ?? '',
    gender: r.gender || '',
    pickupId: r.pickup_id || '',
    ref: r.ref || '',
    amount: r.amount,
    paid: r.paid,
    status: r.status,
    attended: !!r.attended,
    note: r.note || '',
    bookedAt: r.booked_at,
    paidAt: r.paid_at || ''
  };
}

export function expenseToRow(e) {
  return {
    id: e.id,
    trip_id: e.tripId,
    title: e.title,
    category: e.category ?? '',
    amount: Number(e.amount ?? 0),
    date: e.date ?? '',
    notes: e.notes ?? ''
  };
}

export function rowToExpense(r) {
  return {
    id: r.id,
    tripId: r.trip_id,
    title: r.title,
    category: r.category || '',
    amount: r.amount,
    date: r.date || '',
    notes: r.notes || ''
  };
}
