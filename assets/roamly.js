/* ============================================================
   Roamly — shared behaviour
   Booking state, the nav/footer component layer, and the small
   interactions every page shares.

   State transport: the booking is encoded into the ?s= query
   param on every internal link. That works when the site is
   opened straight off disk (file://), where Chrome refuses
   sessionStorage. sessionStorage is still written when it is
   available, so a refresh or a hand-typed URL recovers.
   ============================================================ */
(function (w, d) {
  'use strict';

  var KEY = 'roamly.booking';

  var DEFAULTS = {
    trip: 'kashmir',
    pax: 1,
    date: '',
    pickup: '',
    travellers: [],
    ref: '',
    method: 'upi',
    deposited: false,
    settled: false
  };

  /* ---------- state ---------- */
  var state = null;

  function readQuery() {
    try {
      var m = w.location.search.match(/[?&]s=([^&]+)/);
      if (!m) return null;
      return JSON.parse(decodeURIComponent(m[1]));
    } catch (e) { return null; }
  }

  function readStore() {
    try { return JSON.parse(w.sessionStorage.getItem(KEY) || 'null'); }
    catch (e) { return null; }
  }

  function writeStore(s) {
    try { w.sessionStorage.setItem(KEY, JSON.stringify(s)); }
    catch (e) { /* file:// or private mode — the URL carries it instead */ }
  }

  function load() {
    if (state) return state;
    var s = readQuery() || readStore() || {};
    state = {};
    for (var k in DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) {
        state[k] = (s[k] === undefined || s[k] === null) ? DEFAULTS[k] : s[k];
      }
    }
    if (state.pax < 1) state.pax = 1;
    return state;
  }

  function encode() {
    return encodeURIComponent(JSON.stringify(load()));
  }

  function set(patch) {
    var s = load();
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) s[k] = patch[k];
    }
    writeStore(s);
    // Keep the address bar in sync so a refresh doesn't lose the booking.
    try {
      w.history.replaceState(null, '', w.location.pathname + '?s=' + encode());
    } catch (e) { /* replaceState is rejected on some file:// origins */ }
    return s;
  }

  function url(page) {
    return page + '?s=' + encode();
  }

  function go(page) { w.location.href = url(page); }

  /* ---------- derived ---------- */
  function trip() { return w.RoamlyData.byId(load().trip); }
  function total() { return trip().price * load().pax; }
  function deposit() { return Math.min(w.RoamlyData.DEPOSIT, total()); }
  function balance() { return Math.max(0, total() - deposit()); }

  function makeRef() {
    var s = load();
    if (s.ref) return s.ref;
    var n = 1000 + Math.floor(Math.random() * 9000);
    set({ ref: trip().code + '-' + n });
    return load().ref;
  }

  function pickup() {
    var t = trip(), s = load(), i;
    for (i = 0; i < t.pickups.length; i++) {
      if (t.pickups[i].id === s.pickup) return t.pickups[i];
    }
    for (i = 0; i < t.pickups.length; i++) {
      if (t.pickups[i].recommended) return t.pickups[i];
    }
    return t.pickups[0];
  }

  function lead() {
    var t = load().travellers;
    return (t && t[0]) ? t[0] : { name: '', email: '', phone: '' };
  }

  /* ---------- formatting ---------- */
  function inr(n) {
    if (!n) return 'Free';
    return '₹' + Number(n).toLocaleString('en-IN');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- nav ---------- */
  var NAV_LINKS = [
    { id: 'expeditions', label: 'Expeditions',   href: 'trips.html' },
    { id: 'weekend',     label: 'Weekend Peaks', href: 'trips.html#weekend' },
    { id: 'alpine',      label: 'Alpine Tours',  href: 'trips.html#alpine' },
    { id: 'expert',      label: 'Expert Ridges', href: 'trips.html#expert' }
  ];

  var STEPS = [
    { n: '01', cap: 'Roster',     page: 'book-1.html' },
    { n: '02', cap: 'Intel',      page: 'book-2.html' },
    { n: '03', cap: 'Extraction', page: 'book-3.html' },
    { n: '04', cap: 'Secure',     page: 'book-4.html' }
  ];

  function logoMark(small) {
    var box = small ? 'w-6 h-6 rounded text-[10px]' : 'w-8 h-8 rounded-lg text-sm';
    var size = small ? 'text-xl' : 'text-2xl';
    return '<a href="index.html" class="font-display font-extrabold ' + size +
           ' tracking-tighter flex items-center gap-2">' +
           '<span class="bg-brand text-accent ' + box +
           ' flex items-center justify-center italic font-black">R</span> ROAMLY</a>';
  }

  function navMarketing(active) {
    var links = NAV_LINKS.map(function (l) {
      var on = l.id === active ? ' text-brand' : '';
      return '<a href="' + l.href + '" class="hover:text-brand transition-colors' + on + '"' +
             (l.id === active ? ' aria-current="page"' : '') + '>' + l.label + '</a>';
    }).join('');

    return '<div class="max-w-7xl mx-auto glass rounded-full px-6 py-3 flex items-center ' +
      'justify-between border border-border-subtle shadow-sm">' +
        '<div class="flex items-center gap-12">' + logoMark(false) +
          '<div class="hidden lg:flex items-center gap-8 text-[13px] font-semibold uppercase tracking-wider">' +
            links +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2 sm:gap-4">' +
          '<a href="my-trip.html" class="text-sm font-bold uppercase tracking-widest px-4 py-2 ' +
            'hover:bg-black/5 rounded-full transition-all">My Trip</a>' +
          '<a href="trips.html" class="bg-brand text-accent px-6 py-2.5 rounded-full text-sm ' +
            'font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-brand">Book Now</a>' +
        '</div>' +
      '</div>';
  }

  function navCheckout(step) {
    var cur = parseInt(step, 10) || 1;
    var parts = '';
    STEPS.forEach(function (s, i) {
      var idx = i + 1;
      var st = idx < cur ? 'done' : (idx === cur ? 'now' : 'todo');
      if (i > 0) {
        parts += '<div class="step-line" data-state="' + (idx <= cur ? 'done' : 'todo') + '"></div>';
      }
      var inner = '<span class="step-chip">' +
        (st === 'done' ? '<i class="fa-solid fa-check"></i>' : s.n) +
        '</span><span class="step-cap">' + s.cap + '</span>';
      // Completed steps stay reachable — people go back to fix a typo.
      parts += (st === 'done')
        ? '<a href="' + url(s.page) + '" class="step-item" data-state="done">' + inner + '</a>'
        : '<div class="step-item" data-state="' + st + '"' +
          (st === 'now' ? ' aria-current="step"' : '') + '>' + inner + '</div>';
    });

    return '<div class="max-w-7xl mx-auto glass rounded-full px-6 py-3 flex items-center ' +
      'justify-between border border-border-subtle shadow-sm">' +
        logoMark(true) +
        '<div class="hidden md:flex items-center gap-6">' + parts + '</div>' +
        '<a href="' + url('trip.html') + '" class="text-[10px] font-black uppercase ' +
          'tracking-widest hover:text-brand transition-colors">Cancel</a>' +
      '</div>';
  }

  function navAccount() {
    return '<div class="max-w-7xl mx-auto glass rounded-full px-6 py-3 flex items-center ' +
      'justify-between border border-border-subtle shadow-sm">' +
        logoMark(false) +
        '<div class="flex items-center gap-6">' +
          '<a href="trips.html" class="text-[10px] font-black uppercase tracking-widest ' +
            'text-muted hover:text-brand transition-colors">Browse Trails</a>' +
          '<a href="index.html" class="bg-brand text-accent w-10 h-10 rounded-full flex ' +
            'items-center justify-center shadow-brand" aria-label="Account">' +
            '<i class="fa-solid fa-user text-xs"></i></a>' +
        '</div>' +
      '</div>';
  }

  /* ---------- footer ---------- */
  function footerFull() {
    return '<div class="max-w-7xl mx-auto">' +
      '<div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">' +
        '<div class="md:col-span-2">' +
          '<a href="index.html" class="font-display font-extrabold text-4xl tracking-tighter ' +
            'inline-flex items-center gap-2 mb-8">ROAMLY</a>' +
          '<p class="text-muted max-w-sm mb-8 leading-relaxed font-medium">Redefining adventure ' +
            'for the modern explorer. We build experiences that challenge you and stories that ' +
            'stay with you.</p>' +
          '<div class="flex gap-4">' +
            ['instagram', 'whatsapp', 'tiktok'].map(function (b) {
              return '<a href="#" aria-label="' + b + '" class="w-12 h-12 rounded-2xl bg-surface ' +
                'border border-border-subtle flex items-center justify-center hover:bg-brand ' +
                'hover:text-accent transition-all"><i class="fa-brands fa-' + b + ' text-xl"></i></a>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div><h4 class="font-display font-black text-sm uppercase tracking-widest mb-8">Expeditions</h4>' +
          '<ul class="space-y-4 text-[11px] font-black text-muted uppercase tracking-wider">' +
            '<li><a href="trips.html#weekend" class="hover:text-brand transition-colors">Weekend Peaks</a></li>' +
            '<li><a href="trips.html#alpine" class="hover:text-brand transition-colors">Alpine Tours</a></li>' +
            '<li><a href="trips.html#weekend" class="hover:text-brand transition-colors">Coastal Hikes</a></li>' +
            '<li><a href="trips.html#expert" class="hover:text-brand transition-colors">Expert Ridges</a></li>' +
          '</ul></div>' +
        '<div><h4 class="font-display font-black text-sm uppercase tracking-widest mb-8">Support</h4>' +
          '<ul class="space-y-4 text-[11px] font-black text-muted uppercase tracking-wider">' +
            '<li><a href="my-trip.html" class="hover:text-brand transition-colors">Basecamp Help</a></li>' +
            '<li><a href="#" class="hover:text-brand transition-colors">Safety Protocols</a></li>' +
            '<li><a href="#" class="hover:text-brand transition-colors">Eco-Policy</a></li>' +
            '<li><a href="#" class="hover:text-brand transition-colors">Careers</a></li>' +
          '</ul></div>' +
      '</div>' + footerBar() + '</div>';
  }

  function footerBar() {
    return '<div class="pt-12 border-t border-border-subtle flex flex-col md:flex-row ' +
      'justify-between items-center gap-6">' +
      '<p class="text-[10px] font-bold uppercase tracking-widest text-muted">' +
        '© 2026 Roamly Adventures Pvt Ltd. All rights reserved.</p>' +
      '<div class="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-muted">' +
        '<a href="index.html" class="hover:text-brand">Back to Base</a>' +
        '<a href="#" class="hover:text-brand">Privacy</a>' +
        '<a href="#" class="hover:text-brand">Terms</a>' +
        '<a href="#" class="hover:text-brand">Cancellations</a>' +
      '</div></div>';
  }

  function footerSlim() {
    return '<div class="max-w-7xl mx-auto">' + footerBar() + '</div>';
  }

  /* ---------- trip card ---------- */
  function stars(n) {
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += '<i class="fa-solid fa-star text-brand text-[10px]' +
             (i < Math.round(n) ? '' : ' opacity-25') + '"></i>';
    }
    return out;
  }

  function tripCard(t) {
    var badge = t.badges && t.badges[0]
      ? '<div class="absolute top-6 left-6"><span class="bg-brand text-accent px-4 py-1.5 ' +
        'rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">' +
        esc(t.badges[0]) + '</span></div>' : '';

    return '<article class="group trip-card">' +
      '<a href="trip.html" data-trip="' + t.id + '" class="block">' +
        '<div class="relative aspect-[4/5] rounded-card overflow-hidden mb-6 border ' +
          'border-border-subtle shadow-sm">' +
          '<img class="w-full h-full object-cover trip-image" loading="lazy" src="' + t.hero +
            '" alt="' + esc(t.heroAlt) + '">' + badge +
        '</div>' +
        '<div class="px-2">' +
          '<div class="flex justify-between items-start gap-4 mb-2">' +
            '<h3 class="font-display font-extrabold text-2xl tracking-tight leading-tight ' +
              'group-hover:text-brand transition-colors">' + esc(t.name) + '</h3>' +
            '<div class="flex items-center gap-1.5 text-xs font-black shrink-0 pt-1">' +
              '<i class="fa-solid fa-star text-brand"></i> ' + t.rating.toFixed(1) +
            '</div>' +
          '</div>' +
          '<p class="text-muted text-[11px] font-bold uppercase tracking-widest mb-6">' +
            pad(t.days) + ' Days • Grade: ' + esc(t.grade) + '</p>' +
          '<div class="flex justify-between items-end border-t border-border-subtle pt-6">' +
            '<div>' +
              '<p class="text-[9px] text-muted uppercase tracking-[0.2em] font-black mb-1">Starting from</p>' +
              '<p class="text-3xl font-display font-black tracking-tighter">' + inr(t.price) + '</p>' +
            '</div>' +
            '<span class="bg-ink text-white px-8 py-3 rounded-2xl text-[11px] font-bold uppercase ' +
              'tracking-widest group-hover:bg-brand group-hover:text-accent transition-all">View Trail</span>' +
          '</div>' +
        '</div>' +
      '</a></article>';
  }

  /* ---------- checkout summary panel ----------
     One rail, four steps. `dark` swaps the brand ground for ink
     on the payment step; `deposit` adds the split-payment block. */
  function summaryBody(opts) {
    opts = opts || {};
    var t = trip(), s = load();
    var dim  = opts.dark ? 'text-white/40' : 'text-white/50';
    var val  = opts.dark ? 'text-white'    : 'text-white';
    var line = opts.dark ? 'border-white/10' : 'border-white/15';

    function row(label, value, right) {
      return '<div' + (right ? ' class="text-right"' : '') + '>' +
        '<p class="text-[9px] font-black uppercase tracking-[0.2em] ' + dim + ' mb-1">' + label + '</p>' +
        '<p class="font-bold ' + val + ' uppercase text-sm">' + value + '</p></div>';
    }

    var html =
      '<div class="space-y-6 mb-8">' +
        row('Target', esc(t.name)) +
        '<div class="flex justify-between gap-4">' +
          row('Duration', t.days + ' Days') +
          row('Start', esc(s.date || t.dates), true) +
        '</div>' +
        '<div class="flex justify-between gap-4">' +
          row('Team', pad(s.pax) + (s.pax === 1 ? ' Unit' : ' Units')) +
          row('Grade', esc(t.grade), true) +
        '</div>' +
      '</div>' +
      '<div class="pt-8 border-t ' + line + ' space-y-4 mb-8">' +
        '<div class="flex justify-between text-xs font-bold uppercase tracking-widest ' + dim + '">' +
          '<span>Base cost × ' + s.pax + '</span><span>' + inr(t.price) + '</span></div>' +
        '<div class="flex justify-between items-end pt-2">' +
          '<span class="' + dim + ' font-black uppercase tracking-[0.2em] text-[10px]">Total Extraction</span>' +
          '<span class="text-4xl font-display font-black tracking-tighter ' + val + ' tabular-nums">' + inr(total()) + '</span>' +
        '</div>' +
      '</div>';

    if (opts.deposit && total() > 0) {
      html += '<div class="p-6 bg-accent text-brand rounded-[2rem] shadow-xl mb-8">' +
        '<div class="flex justify-between items-center mb-2">' +
          '<span class="text-[10px] font-black uppercase tracking-[0.2em]">Authorized Deposit</span>' +
          '<span class="text-2xl font-display font-black tracking-tighter tabular-nums">' + inr(deposit()) + '</span></div>' +
        '<p class="text-[10px] font-bold opacity-75 uppercase tracking-widest leading-relaxed">' +
          'Secure seats now. Settle the balance of ' + inr(balance()) +
          ' 15 days before extraction.</p></div>';
    }
    return html;
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    var el = d.getElementById('toast');
    if (!el) {
      el = d.createElement('div');
      el.id = 'toast';
      el.setAttribute('role', 'status');
      d.body.appendChild(el);
    }
    el.textContent = msg;
    // force reflow so the transition replays on repeat calls
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  /* ---------- cursor ---------- */
  function mountCursor() {
    if (!w.matchMedia || !w.matchMedia('(min-width: 1024px)').matches) return;
    if (w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!w.matchMedia('(hover: hover)').matches) return;
    var c = d.createElement('div');
    c.id = 'cursor';
    c.setAttribute('aria-hidden', 'true');
    d.body.appendChild(c);
    d.addEventListener('mousemove', function (e) {
      c.style.opacity = '1';
      c.style.transform = 'translate(' + (e.clientX - 16) + 'px,' + (e.clientY - 16) + 'px)';
    });
  }

  /* ---------- wiring ---------- */
  function mount() {
    // nav
    var nav = d.querySelector('[data-nav]');
    if (nav) {
      var kind = nav.getAttribute('data-nav');
      nav.className = 'fixed top-0 left-0 right-0 z-[100] px-6 py-4';
      if (kind === 'checkout')      nav.innerHTML = navCheckout(nav.getAttribute('data-step'));
      else if (kind === 'account')  nav.innerHTML = navAccount();
      else                          nav.innerHTML = navMarketing(nav.getAttribute('data-active'));
    }

    // footer
    var f = d.querySelector('[data-footer]');
    if (f) {
      f.className = 'pt-20 pb-12 px-6';
      f.innerHTML = f.getAttribute('data-footer') === 'slim' ? footerSlim() : footerFull();
    }

    // Internal links rebuild their target at click time, so they always
    // carry the booking as it stands right now rather than as it was on load.
    d.addEventListener('click', function (e) {
      var el = e.target;
      if (!el || !el.closest) return;

      var trip = el.closest('[data-trip]');
      if (trip) {
        e.preventDefault();
        set({ trip: trip.getAttribute('data-trip') });
        go('trip.html');
        return;
      }
      var keep = el.closest('[data-keep]');
      if (keep) {
        e.preventDefault();
        go(keep.getAttribute('data-keep'));
        return;
      }
      var goTo = el.closest('[data-go]');
      if (goTo) {
        e.preventDefault();
        go(goTo.getAttribute('data-go'));
      }
    });

    // Give the same links a real href so middle-click and "copy link" work.
    Array.prototype.forEach.call(d.querySelectorAll('a[data-keep]'), function (a) {
      a.setAttribute('href', url(a.getAttribute('data-keep')));
    });

    mountCursor();
  }

  w.Roamly = {
    state: { get: load, set: set, url: url },
    go: go,
    trip: trip,
    total: total,
    deposit: deposit,
    balance: balance,
    makeRef: makeRef,
    pickup: pickup,
    lead: lead,
    inr: inr,
    pad: pad,
    esc: esc,
    stars: stars,
    tripCard: tripCard,
    summaryBody: summaryBody,
    toast: toast
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window, document);
