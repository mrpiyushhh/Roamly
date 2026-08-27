# Roamly — working site

Nine independent prototypes, rebuilt as one end-to-end website. Open `index.html`
in a browser and click all the way through to a confirmed booking.

## Structure

```
index.html          Home — hero, search, featured bento, categories, story, CTA
trips.html          Browse — live category filter + sort
trip.html           Detail — gallery mosaic, accordion itinerary, booking widget
book-1.html         Roster      — team size + departure
book-2.html         Intel       — traveller details
book-3.html         Extraction  — pickup point
book-4.html         Secure      — payment
confirmation.html   Booking reference, ticket, share/print
my-trip.html        Dashboard — journey tracker, extraction, roster, docs, balance

assets/
  theme.js          Tailwind tokens — the single source of truth
  roamly.css        Component layer (option cards, fields, stepper, motion)
  data.js           All nine trips: pricing, itineraries, guides, pickup points
  roamly.js         Booking state, nav/footer components, shared helpers
```

## How it holds together

**One theme.** `assets/theme.js` carries the seven color tokens, both typefaces and
the radius scale. Every page loads it. Changing `brand` there restyles all nine
screens — previously that was nine separate edits to nine copy-pasted config blocks.

**One component layer.** The navbar, footer and checkout stepper are rendered by
`roamly.js` into `<nav data-nav="…">` and `<footer data-footer="…">` placeholders.
The navbar had drifted into four variants across the prototypes; there is now one,
with three modes (`marketing`, `checkout`, `account`).

**One content source.** Trips were hardcoded into each page. They now live in
`assets/data.js`, and Home, Browse, Detail and all four checkout steps read from it.
Adding a tenth trip means adding one object.

**Booking state travels in the URL.** Each internal link is rebuilt at click time
with the current booking encoded into `?s=`. That is deliberate: Chrome blocks
`sessionStorage` on `file://` origins, so a storage-only approach would break the
moment you double-click `index.html`. Storage is still written when available, so a
refresh or a pasted URL recovers.

## What changed from the prototypes

| | Before | Now |
|---|---|---|
| Internal links | All pointed at `*__desktop.html`, which never existed | Resolve to real files |
| Design language | Expedition on 7 screens, Heritage on checkout steps 2–3 | One system throughout |
| Theme config | Copy-pasted 9×, already drifted | One file |
| `bg-canvas` | Referenced on 4 pages, defined on none of them | Defined |
| Font weights | Inter loaded 300–600, markup asked for 700/900 | 400–900 loaded |
| Font Awesome | JS kit 6.4.0 *and* CSS 6.0.0 on every page | CSS 6.4.0 only |
| Navigation | `onclick="location.href=…"` on divs and buttons | Real anchors and form submits |
| Focus states | `outline-none` with no replacement | Visible focus ring everywhere |
| Forms | No validation, no `required` | Validated with inline, specific errors |
| Gender field | Male / Female only | Four options including "Prefer not to say" |
| Reduced motion | Not handled | Respected; custom cursor disabled |

The Heritage theme was retired, but two things were carried across from it into the
Expedition skin: **real form semantics** (`<form>`, `required`, `type="submit"`) and
the **selectable option card** — a `<label>` wrapping a real radio, now used for both
the departure picker and the pickup step.

## Notes

- Tailwind runs from the CDN, as in the prototypes. Fine for a prototype; a real
  deployment would compile it.
- Photography still points at the original `storage.googleapis.com` URLs, so the
  pages need a connection to render images.
- Payment is a demo. No card is charged, and card fields accept anything.
- The original nine `01-Roamly - *.html` files are untouched, alongside
  `design-system.md` and `design-system.html` which document them.
# Roamly
