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
      var result = null;
      var m = w.location.search.match(/[?&]s=([^&]+)/);
      if (m) {
        result = JSON.parse(decodeURIComponent(m[1]));
      }
      var tMatch = w.location.search.match(/[?&](?:trip|id)=([^&]+)/);
      if (tMatch) {
        if (!result) result = {};
        result.trip = decodeURIComponent(tMatch[1]);
      }
      return result;
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
    var queryState = readQuery();
    var storeState = readStore() || {};
    var s = queryState ? Object.assign({}, storeState, queryState) : storeState;
    state = {};
    for (var k in DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) {
        state[k] = (s[k] === undefined || s[k] === null) ? DEFAULTS[k] : s[k];
      }
    }
    if (state.pax < 1) state.pax = 1;
    writeStore(state);
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
  function isDeposit() { return (load().payMode || 'deposit') === 'deposit'; }
  function deposit() { return Math.min(w.RoamlyData.DEPOSIT || 1000, total()); }
  function amountToPay() { return isDeposit() ? deposit() : total(); }
  function balance() { return isDeposit() ? Math.max(0, total() - deposit()) : 0; }

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
    { id: 'home',     label: 'Home',           href: 'index.html' },
    { id: 'upcoming', label: 'Upcoming Trips', href: 'index.html#upcoming' },
    { id: 'about',    label: 'About Us',       href: 'index.html#about' },
    { id: 'faqs',     label: 'FAQs',           href: 'index.html#faqs' }
  ];

  var STEPS = [
    { n: '01', cap: 'Roster',     page: 'book-1.html' },
    { n: '02', cap: 'Intel',      page: 'book-2.html' },
    { n: '03', cap: 'Extraction', page: 'book-3.html' },
    { n: '04', cap: 'Secure',     page: 'book-4.html' }
  ];

  function logoMark(small) {
    var box = small ? 'w-6 h-6 rounded text-[10px]' : 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm';
    var size = small ? 'text-lg sm:text-xl' : 'text-lg sm:text-2xl';
    // Wordmark is its own element so narrow viewports can drop it and keep
    // the R mark — otherwise the logo, CTA and menu button don't fit at 320.
    return '<a href="index.html" class="font-display font-extrabold ' + size +
           ' tracking-tighter flex items-center gap-1.5 sm:gap-2 shrink-0">' +
           '<span class="bg-brand text-accent ' + box +
           ' flex items-center justify-center italic font-black shrink-0">R</span>' +
           '<span class="wordmark tracking-tighter">ROAMLY</span></a>';
  }

  function navMarketing(active) {
    // Active state is a single toggled class, never a className rewrite —
    // rewriting it dropped the responsive utilities (`hidden md:inline-flex`)
    // and un-hid desktop-only pills on phones.
    var PILL = 'nav-pill-btn px-4.5 sm:px-5 py-2 rounded-full text-[12px] uppercase tracking-wider';
    var links = NAV_LINKS.map(function (l) {
      var on = l.id === active;
      return '<a href="' + l.href + '" data-nav-id="' + l.id + '" class="' + PILL +
             (on ? ' is-active' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' +
             l.label + '</a>';
    }).join('');

    // Same links again for the mobile drawer. Kept as separate nodes rather
    // than moved, so the desktop row never has to be re-parented on resize.
    var drawerLinks = NAV_LINKS.concat([
      { id: 'account', label: 'My Trip', href: 'my-trip.html', tag: 'Soon' }
    ]).map(function (l) {
      var tag = l.tag ? '<span class="ml-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent text-brand inline-block">' + l.tag + '</span>' : '';
      return '<a href="' + l.href + '" data-nav-id="' + l.id + '" class="drawer-link' +
        (l.id === active ? ' is-active' : '') + '"><span>' + l.label + tag + '</span>' +
        '<i class="fa-solid fa-chevron-right chev" aria-hidden="true"></i></a>';
    }).join('') +
    '<a href="trips.html" class="drawer-cta-btn">' +
      '<span>Book Now</span> <i class="fa-solid fa-arrow-right text-xs"></i></a>';

    return '<div class="max-w-7xl mx-auto glass rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center ' +
      'justify-between border border-border-subtle shadow-sm gap-4 sm:gap-6">' +
        '<div class="flex items-center gap-6 lg:gap-10 min-w-0">' + logoMark(false) +
          '<div class="nav-links-desktop">' +
            links +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-3">' +
          '<a href="my-trip.html" data-nav-id="account" class="nav-pill-btn nav-desktop-only px-4 sm:px-5 py-2 rounded-full text-[12px] uppercase tracking-wider text-muted hover:text-ink hover:bg-black/5 font-bold inline-flex items-center gap-1.5"><span>My Trip</span><span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent text-brand">Soon</span></a>' +
          '<a href="trips.html" class="nav-cta-btn nav-desktop-only bg-brand text-accent px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-brand whitespace-nowrap">Book Now</a>' +
          '<button type="button" class="nav-toggle nav-mobile-only" id="navToggle" aria-expanded="false" ' +
            'aria-controls="navDrawer" aria-label="Open menu">' +
            '<i class="fa-solid fa-bars" aria-hidden="true"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="nav-scrim" id="navScrim" hidden></div>' +
      '<div class="nav-drawer" id="navDrawer" role="dialog" aria-modal="true" aria-label="Menu" tabindex="-1">' +
        drawerLinks +
      '</div>';
  }

  /* ---------- responsive copy ----------
     Swap search placeholders cleanly based on viewport so they never clip
     on compact mobile screens while remaining descriptive on desktop. */
  function mountResponsiveText() {
    if (!w.matchMedia) return;
    var mq = w.matchMedia('(max-width: 640px)');

    function apply() {
      var isMobile = mq.matches;

      var heroInput = d.getElementById('basecamp');
      if (heroInput) {
        heroInput.setAttribute('placeholder', isMobile ? 'Search by trip name...' : 'Search by trip name, peak, or region...');
      }

      var tripInput = d.getElementById('tripSearchInput');
      if (tripInput) {
        tripInput.setAttribute('placeholder', isMobile ? 'Search by trip name...' : 'Search by trip name, region, grade...');
      }
    }

    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  /* ---------- mobile drawer ---------- */
  function mountDrawer() {
    var toggle = d.getElementById('navToggle');
    var drawer = d.getElementById('navDrawer');
    var scrim  = d.getElementById('navScrim');
    if (!toggle || !drawer || !scrim) return;

    var open = false;

    function setOpen(next) {
      if (next === open) return;
      open = next;
      drawer.classList.toggle('open', open);
      scrim.classList.toggle('open', open);
      scrim.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      toggle.innerHTML = '<i class="fa-solid fa-' + (open ? 'xmark' : 'bars') + '" aria-hidden="true"></i>';
      d.body.classList.toggle('nav-open', open);

      if (open) {
        drawer.focus({ preventScroll: true });
      } else {
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!open);
    });

    scrim.addEventListener('click', function () {
      setOpen(false);
    });

    // Following a link closes the drawer immediately
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('.drawer-link, .drawer-cta-btn')) {
        setOpen(false);
      }
    });

    d.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      // keep focus inside the panel while it is modal
      var items = drawer.querySelectorAll('.drawer-link, .drawer-cta-btn');
      if (!items.length) return;
      var firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && d.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && d.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    });

    // Crossing into desktop must not leave a hidden drawer holding the scroll lock.
    if (w.matchMedia) {
      var mq = w.matchMedia('(min-width: 768px)');
      var onChange = function (e) { if (e.matches) setOpen(false); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
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

    // Phones get a compact counter instead of nothing at all.
    var dots = STEPS.map(function (s, i) {
      var idx = i + 1;
      return '<i class="' + (idx < cur ? 'done' : (idx === cur ? 'now' : '')) + '"></i>';
    }).join('');
    var mini = '<div class="step-mini" role="progressbar" aria-valuemin="1" aria-valuemax="' +
      STEPS.length + '" aria-valuenow="' + cur + '" aria-label="Booking step ' + cur +
      ' of ' + STEPS.length + ': ' + STEPS[cur - 1].cap + '">' +
      '<span class="step-mini-dots" aria-hidden="true">' + dots + '</span>' +
      '<span class="step-mini-cap">' + pad(cur) + '/' + pad(STEPS.length) + ' ' + STEPS[cur - 1].cap + '</span>' +
      '</div>';

    // At 320px the three children overflowed the pill — and because the nav is
    // `fixed`, that overflow never showed up in document scrollWidth. Each
    // child now shrinks or drops its label instead of pushing the row wider.
    var compactLogo =
      '<a href="index.html" class="font-display font-extrabold text-lg sm:text-xl tracking-tighter ' +
      'flex items-center gap-2 shrink-0">' +
      '<span class="bg-brand text-accent w-6 h-6 rounded flex items-center justify-center text-[10px] italic font-black">R</span>' +
      '<span class="hidden sm:inline">ROAMLY</span></a>';

    return '<div class="max-w-7xl mx-auto glass rounded-full px-4 sm:px-6 py-3 flex items-center ' +
      'justify-between border border-border-subtle shadow-sm gap-2 sm:gap-3 min-w-0">' +
        compactLogo +
        mini +
        '<div class="hidden lg:flex items-center gap-6">' + parts + '</div>' +
        '<a href="' + url('trip.html') + '" aria-label="Cancel booking" ' +
          'class="shrink-0 inline-flex items-center justify-center min-w-[44px] min-h-[44px] ' +
          'rounded-full text-[10px] font-black uppercase tracking-widest text-muted ' +
          'hover:text-brand hover:bg-black/5 transition-colors">' +
          '<span class="hidden sm:inline">Cancel</span>' +
          '<i class="fa-solid fa-xmark text-base sm:hidden" aria-hidden="true"></i></a>' +
      '</div>';
  }

  function navAccount() {
    return '<div class="max-w-7xl mx-auto glass rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center ' +
      'justify-between border border-border-subtle shadow-sm gap-3">' +
        logoMark(false) +
        '<div class="flex items-center gap-3 sm:gap-6">' +
          '<a href="trips.html" class="hidden xs:inline-block sm:inline-block text-[11px] font-extrabold uppercase tracking-wider ' +
            'text-muted hover:text-brand transition-colors">Browse Trips</a>' +
          '<a href="index.html" class="bg-brand text-accent w-9 h-9 sm:w-10 sm:h-10 rounded-full flex ' +
            'items-center justify-center shadow-brand" aria-label="Home">' +
            '<i class="fa-solid fa-house text-xs"></i></a>' +
        '</div>' +
      '</div>';
  }

  /* ---------- footer ---------- */
  function footerFull() {
    return '<div class="max-w-7xl mx-auto">' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-16">' +
        '<div class="md:col-span-2">' +
          '<a href="index.html" class="font-display font-extrabold text-3xl sm:text-4xl tracking-tighter ' +
            'inline-flex items-center gap-2 mb-4 sm:mb-6">ROAMLY</a>' +
          '<p class="text-muted max-w-sm mb-6 sm:mb-8 leading-relaxed font-medium text-sm sm:text-base">Redefining adventure ' +
            'for the modern explorer. We build experiences that challenge you and stories that ' +
            'stay with you.</p>' +
          '<div class="flex gap-3.5 sm:gap-4">' +
            ['instagram', 'whatsapp'].map(function (b) {
              var href = b === 'whatsapp' ? 'https://wa.link/77nyt0' : '#';
              var target = b === 'whatsapp' ? ' target="_blank" rel="noopener noreferrer"' : '';
              return '<a href="' + href + '"' + target + ' aria-label="' + b + '" class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-surface ' +
                'border border-border-subtle flex items-center justify-center hover:bg-brand ' +
                'hover:text-accent tx"><i class="fa-brands fa-' + b + ' text-lg sm:text-xl"></i></a>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="pt-4 md:pt-0"><h4 class="font-display font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-ink mb-4 sm:mb-6">Support</h4>' +
          '<ul class="space-y-3 sm:space-y-4 text-[11px] font-extrabold text-muted uppercase tracking-wider">' +
            '<li><a href="https://wa.link/77nyt0" target="_blank" rel="noopener noreferrer" class="hover:text-brand transition-colors">Basecamp Help / WhatsApp</a></li>' +
            '<li><a href="#" class="hover:text-brand transition-colors">Safety Protocols</a></li>' +
            '<li><a href="#" class="hover:text-brand transition-colors">Eco-Policy</a></li>' +
            '<li><a href="#" class="hover:text-brand transition-colors">Careers</a></li>' +
          '</ul></div>' +
      '</div>' + footerBar() + '</div>';
  }

  function footerBar() {
    return '<div class="pt-8 md:pt-12 border-t border-border-subtle flex flex-col md:flex-row ' +
      'justify-between items-center gap-4 md:gap-6 text-center md:text-left">' +
      '<p class="text-[10px] font-bold uppercase tracking-widest text-muted">' +
        '© 2026 Piyush Yadav. All rights reserved.</p>' +
      '<div class="flex flex-wrap justify-center gap-6 sm:gap-8 text-[10px] font-bold uppercase tracking-widest text-muted">' +
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
  function tripCard(t) {
    var badge = t.badges && t.badges[0]
      ? '<div class="absolute top-3.5 left-3.5 sm:top-6 sm:left-6"><span class="bg-brand text-accent px-3 py-1 sm:px-4 sm:py-1.5 ' +
        'rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest shadow-md sm:shadow-xl">' +
        esc(t.badges[0]) + '</span></div>' : '';

    var cleanTitle = t.name.length > 38 ? t.name.slice(0, 36) + '…' : t.name;

    return '<article class="group trip-card flex flex-col h-full">' +
      '<a href="trip.html?trip=' + t.id + '" data-trip="' + t.id + '" class="flex flex-col h-full block">' +
        '<div class="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 border ' +
          'border-border-subtle shadow-sm shrink-0">' +
          '<img class="w-full h-full object-cover trip-image" loading="lazy" src="' + t.hero +
            '" alt="' + esc(t.heroAlt) + '">' + badge +
        '</div>' +
        '<div class="px-2 flex flex-col flex-1">' +
          '<div class="flex justify-between items-start gap-4 mb-2">' +
            '<h3 class="font-display font-extrabold text-2xl tracking-tight leading-tight min-h-[3.75rem] line-clamp-2 ' +
              'group-hover:text-brand transition-colors">' + esc(cleanTitle) + '</h3>' +
            '<div class="flex items-center gap-1.5 text-xs font-black shrink-0 pt-1 text-brand">' +
              '<i class="fa-solid fa-star"></i> ' + t.rating.toFixed(1) +
            '</div>' +
          '</div>' +
          '<p class="text-muted text-[11px] font-bold uppercase tracking-widest mb-6">' +
            pad(t.days) + ' Days • Grade: ' + esc(t.grade) + '</p>' +
          '<div class="flex justify-between items-end border-t border-border-subtle pt-6 mt-auto">' +
            '<div>' +
              '<p class="text-[9px] text-muted uppercase tracking-[0.2em] font-black mb-1">Starting from</p>' +
              '<p class="text-3xl font-display font-black tracking-tighter text-ink">' + inr(t.price) + '</p>' +
            '</div>' +
            '<span class="rm-btn-trail">View Trip</span>' +
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
        '<p class="text-[9px] font-black uppercase tracking-[0.2em] ' + dim + ' mb-0.5 sm:mb-1">' + label + '</p>' +
        '<p class="font-bold ' + val + ' uppercase text-xs sm:text-sm tracking-wide">' + value + '</p></div>';
    }

    var html =
      '<div class="space-y-4 sm:space-y-6 mb-6 sm:mb-8">' +
        row('Target Expedition', esc(t.name)) +
        '<div class="flex justify-between gap-4">' +
          row('Duration', t.days === 1 ? '1 Day' : (t.days + ' Days')) +
          row('Schedule', esc(s.date || t.dates), true) +
        '</div>' +
        '<div class="flex justify-between gap-4">' +
          row('Team Size', pad(s.pax) + (s.pax === 1 ? ' Climber' : ' Climbers')) +
          row('Grade', esc(t.grade), true) +
        '</div>' +
      '</div>' +
      '<div class="pt-6 sm:pt-8 border-t ' + line + ' space-y-3 sm:space-y-4 mb-6 sm:mb-8">' +
        '<div class="flex justify-between text-xs font-bold uppercase tracking-wider ' + dim + '">' +
          '<span>Base fee × ' + s.pax + '</span><span>' + inr(t.price) + '</span></div>' +
        '<div class="flex justify-between items-end pt-2">' +
          '<span class="' + dim + ' font-black uppercase tracking-[0.2em] text-[10px]">Total Amount</span>' +
          '<span class="text-3xl sm:text-4xl font-display font-black tracking-tighter ' + val + ' tabular-nums">' + inr(total()) + '</span>' +
        '</div>' +
      '</div>';

    var payMode = opts.payMode || (load().payMode || 'deposit');
    var isDep = (payMode === 'deposit') && (deposit() < total());
    var toPay = isDep ? deposit() : total();
    var bal = isDep ? Math.max(0, total() - deposit()) : 0;

    if (opts.deposit && total() > 0) {
      if (isDep) {
        html += '<div class="p-5 sm:p-6 bg-accent text-brand rounded-[1.75rem] sm:rounded-[2rem] shadow-xl mb-6 sm:mb-8" id="depositCallout">' +
          '<div class="flex justify-between items-center mb-1.5 sm:mb-2">' +
            '<span class="text-[10px] font-black uppercase tracking-[0.2em]">Token Deposit</span>' +
            '<span class="text-2xl sm:text-3xl font-display font-black tracking-tighter tabular-nums">' + inr(deposit()) + '</span></div>' +
          '<div class="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-80">' +
            '<span>Pending Balance</span><span>' + inr(bal) + '</span></div>' +
          '<p class="text-[10px] font-bold opacity-75 uppercase tracking-widest leading-relaxed">' +
            'Secure seats now. Settle remaining ' + inr(bal) + ' 15 days before departure.</p></div>';
      } else {
        html += '<div class="p-5 sm:p-6 bg-accent text-brand rounded-[1.75rem] sm:rounded-[2rem] shadow-xl mb-6 sm:mb-8" id="depositCallout">' +
          '<div class="flex justify-between items-center mb-1.5 sm:mb-2">' +
            '<span class="text-[10px] font-black uppercase tracking-[0.2em]">Full Payment (100%)</span>' +
            '<span class="text-2xl sm:text-3xl font-display font-black tracking-tighter tabular-nums">' + inr(total()) + '</span></div>' +
          '<div class="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider mb-2 opacity-80">' +
            '<span>Pending Balance</span><span class="text-brand font-black">₹0 (Paid in Full)</span></div>' +
          '<p class="text-[10px] font-bold opacity-75 uppercase tracking-widest leading-relaxed">' +
            'Complete booking with zero remaining balance.</p></div>';
      }
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

  /* ---------- scroll reveal ----------
     Trip grids are injected all at once, which reads as a single flash.
     Reveal them in document order with a short stagger so the eye gets a
     path to follow. Cards are added by page scripts after load, so a
     MutationObserver picks them up rather than every page opting in. */
  function mountReveal() {
    if (!('IntersectionObserver' in w) || !('MutationObserver' in w)) return;
    if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        // stagger by position within the parent grid, capped so a long
        // list never leaves the last card waiting
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {
          return c.classList.contains('rv');
        });
        var i = Math.min(sibs.indexOf(el), 7);
        el.style.transitionDelay = (i * 60) + 'ms';
        el.classList.add('rv-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    function claim(el) {
      if (el.classList.contains('rv') || el.classList.contains('rv-in')) return;
      el.classList.add('rv');
      io.observe(el);
    }
    function scan(root) {
      if (!root.querySelectorAll) return;
      Array.prototype.forEach.call(root.querySelectorAll('.trip-card, [data-reveal]'), claim);
    }

    scan(d);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (nd) {
          if (nd.nodeType !== 1) return;
          if (nd.classList && (nd.classList.contains('trip-card') || nd.hasAttribute('data-reveal'))) claim(nd);
          scan(nd);
        });
      });
    }).observe(d.body, { childList: true, subtree: true });

    // No blanket timer here on purpose. `.rv` (opacity 0) is only ever
    // applied by this function, so if the script fails to run the content
    // is visible by default — and a timed fallback would prematurely
    // reveal everything below the fold for anyone who scrolls late.
  }

  /* ---------- floating chrome ----------
     Translucent nav thickens once content is passing under it. */
  function mountNavMaterial() {
    var nav = d.querySelector('nav[data-nav]');
    if (!nav) return;
    var on = false, tick = false;
    function check() {
      tick = false;
      var should = w.scrollY > 8;
      if (should !== on) { on = should; nav.classList.toggle('is-scrolled', on); }
    }
    w.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      w.requestAnimationFrame(check);
    }, { passive: true });
    check();
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
      nav.className = 'fixed top-0 left-0 right-0 z-[130] px-4 sm:px-6 py-3 sm:py-4';
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

    function getElementTop(el) {
      var top = 0;
      while (el) {
        top += el.offsetTop || 0;
        el = el.offsetParent;
      }
      return top;
    }

    function smoothScrollToTarget(targetEl, instant) {
      if (!targetEl) return;
      var targetTop = 0;
      if (targetEl.id !== 'hero' && targetEl.id !== 'top' && targetEl.id !== 'main' && targetEl.tagName !== 'BODY') {
        var nav = d.querySelector('nav[data-nav]');
        var navHeight = nav ? nav.offsetHeight : 80;
        targetTop = Math.max(0, getElementTop(targetEl) - navHeight - 12);
      }
      w.scrollTo({
        top: targetTop,
        behavior: instant ? 'auto' : 'smooth'
      });
    }

    // Internal links rebuild their target at click time, so they always
    // carry the booking as it stands right now rather than as it was on load.
    d.addEventListener('click', function (e) {
      var el = e.target;
      if (!el || !el.closest) return;

      var link = el.closest('a');
      if (link) {
        var href = link.getAttribute('href') || '';
        var currentPath = (w.location.pathname || '').split('/').pop() || 'index.html';
        var isHome = currentPath === '' || currentPath === 'index.html' || currentPath === '/';

        var isHomeTarget = href === 'index.html' || href === 'index.html#hero' || href === '#hero' || href === '#top' || href === '#' || href === './' || href === '/' || link.getAttribute('data-nav-id') === 'home';

        // When on Home page and clicking Home link or Logo: smooth scroll to top
        if (isHome && isHomeTarget) {
          e.preventDefault();
          if (w.history && w.history.replaceState) {
            w.history.replaceState(null, '', 'index.html');
          }
          setTimeout(function () {
            w.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
            updateNavActiveState();
          }, 30);
          return;
        }

        var hashIndex = href.indexOf('#');
        if (hashIndex !== -1) {
          var targetHash = href.slice(hashIndex);
          var targetPath = href.slice(0, hashIndex) || 'index.html';

          if (isHome && (targetPath === 'index.html' || targetPath === '' || targetPath === './')) {
            var targetEl = d.querySelector(targetHash);
            if (targetEl) {
              e.preventDefault();
              if (w.history && w.history.pushState) {
                w.history.pushState(null, '', targetHash);
              }
              updateNavActiveState();
              setTimeout(function () {
                smoothScrollToTarget(targetEl, false);
              }, 30);
              return;
            }
          }
        }
      }

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

    // Real-time active button tracker & scroll spy
    var lastActiveId = null;
    function updateNavActiveState() {
      var marketingNav = d.querySelector('[data-nav="marketing"]');
      if (!marketingNav) return;
      var currentPath = (w.location.pathname || '').split('/').pop() || 'index.html';
      var currentHash = (w.location.hash || '').replace('#', '');

      var activeId = 'home';
      if (currentPath.indexOf('trips.html') !== -1 || currentPath.indexOf('trip.html') !== -1) {
        activeId = 'upcoming';
      } else if (currentPath.indexOf('my-trip.html') !== -1) {
        activeId = 'account';
      } else {
        var scrollY = w.scrollY || d.documentElement.scrollTop || 0;
        var faqsSec = d.getElementById('faqs');
        var aboutSec = d.getElementById('about');
        var upcomingSec = d.getElementById('upcoming');
        var scrollPos = scrollY + 220;

        if (scrollY < 180) {
          activeId = 'home';
          if (w.history && w.history.replaceState && currentHash) {
            w.history.replaceState(null, '', currentPath || 'index.html');
          }
        } else if (faqsSec && scrollPos >= getElementTop(faqsSec)) {
          activeId = 'faqs';
        } else if (aboutSec && scrollPos >= getElementTop(aboutSec)) {
          activeId = 'about';
        } else if (upcomingSec && scrollPos >= getElementTop(upcomingSec)) {
          activeId = 'upcoming';
        } else {
          activeId = 'home';
        }
      }

      // Bail before touching the DOM if nothing changed. This runs on every
      // scroll frame; rewriting className each time invalidates layout right
      // after getElementTop has just forced it, which is what made the
      // scroll feel like it was stalling.
      if (activeId === lastActiveId) return;
      lastActiveId = activeId;

      Array.prototype.forEach.call(marketingNav.querySelectorAll('.nav-pill-btn'), function (btn) {
        var on = btn.getAttribute('data-nav-id') === activeId;
        btn.classList.toggle('is-active', on);
        if (on) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
      });

      // Drawer links mirror the same active state. Toggled by class rather
      // than rewriting className, so their own styling survives.
      Array.prototype.forEach.call(marketingNav.querySelectorAll('.drawer-link'), function (a) {
        var on = a.getAttribute('data-nav-id') === activeId;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
    }

    /* Landing on a hash from another page (trips.html → index.html#about).

       Three things used to fight each other here and produced the visible
       jitter: html{scroll-behavior:smooth} made the browser animate its own
       hash jump all the way down from the top, this function then fired
       three more scrolls at 0/200/500ms, and each one recomputed a target
       that had moved as late assets settled.

       Now: smooth is suppressed while the page places itself, the position
       is set instantly (so corrections are silent rather than animated),
       and smooth is handed back once things are stable. */
    var hashSettleTimer = null;

    function suppressSmooth() {
      d.documentElement.style.scrollBehavior = 'auto';
    }
    function restoreSmooth() {
      d.documentElement.style.scrollBehavior = '';
    }

    function placeOnHash() {
      var targetEl;
      try { targetEl = w.location.hash ? d.querySelector(w.location.hash) : null; }
      catch (e) { return; }          // hashes like "#pay/x" are not valid selectors
      if (!targetEl) { restoreSmooth(); return; }

      suppressSmooth();
      smoothScrollToTarget(targetEl, true);

      // Re-place silently for one short window in case a late image or
      // font shifts the layout, then give smooth scrolling back.
      clearTimeout(hashSettleTimer);
      w.requestAnimationFrame(function () { smoothScrollToTarget(targetEl, true); });
      hashSettleTimer = setTimeout(function () {
        smoothScrollToTarget(targetEl, true);
        restoreSmooth();
        updateNavActiveState();
      }, 180);
    }

    // Kill the browser's animated hash jump before it can start.
    if (w.location.hash) suppressSmooth();

    // One layout read per frame at most, instead of one per scroll event.
    var spyTick = false;
    w.addEventListener('scroll', function () {
      if (spyTick) return;
      spyTick = true;
      w.requestAnimationFrame(function () {
        spyTick = false;
        updateNavActiveState();
      });
    }, { passive: true });

    w.addEventListener('hashchange', function () {
      var targetEl;
      try { targetEl = d.querySelector(w.location.hash); } catch (e) { return; }
      if (targetEl) smoothScrollToTarget(targetEl, false);   // one smooth scroll
      updateNavActiveState();
    });

    w.addEventListener('popstate', function () {
      if (w.location.hash) {
        placeOnHash();
      } else {
        updateNavActiveState();
      }
    });

    updateNavActiveState();

    if (d.readyState === 'complete') placeOnHash();
    else w.addEventListener('load', placeOnHash);

    mountCursor();
    mountNavMaterial();
    mountReveal();
    mountDrawer();
    mountResponsiveText();
    mountHomeSmoothTransitions();
  }

  /* ---------- smooth return to home ---------- */
  function mountHomeSmoothTransitions() {
    if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var currentPath = (w.location.pathname || '').split('/').pop() || 'index.html';
    var isHome = currentPath === 'index.html' || currentPath === '';

    // Smooth reveal when landing on home page
    if (isHome) {
      d.body.classList.add('home-entering');
      setTimeout(function () {
        d.body.classList.remove('home-entering');
      }, 400);
    }

    // Smooth exit when leaving any subpage to return to Home
    d.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;

      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var href = link.getAttribute('href');
      if (!href) return;

      var isGoingHome = href === 'index.html' || href.startsWith('index.html#') || href === '/' || href.startsWith('/#');

      // If we are currently on a subpage and navigating to Home:
      if (!isHome && isGoingHome) {
        e.preventDefault();
        d.body.classList.add('page-smooth-exit');
        setTimeout(function () {
          w.location.href = href;
        }, 140);
      }
    });

    w.addEventListener('pageshow', function () {
      d.body.classList.remove('page-smooth-exit');
      d.body.classList.remove('home-entering');
    });
  }

  w.Roamly = {
    state: { get: load, set: set, url: url },
    go: go,
    trip: trip,
    total: total,
    deposit: deposit,
    balance: balance,
    isDeposit: isDeposit,
    amountToPay: amountToPay,
    makeRef: makeRef,
    pickup: pickup,
    lead: lead,
    inr: inr,
    pad: pad,
    esc: esc,
    tripCard: tripCard,
    summaryBody: summaryBody,
    toast: toast
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window, document);
