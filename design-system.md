# Roamly — Design System

Extracted from the nine static HTML prototypes in this folder. Every rule below is
traceable to a line in a real file; references are written as `file:line`.

**Stack:** Tailwind CSS via CDN (`cdn.tailwindcss.com`), configured inline per page
in a `tailwind.config` `<script>` block. No build step, no shared stylesheet — each
page carries its own copy of the theme.

---

## 1. Screen inventory

| # | File | Route intent | Theme |
|---|------|--------------|-------|
| 01 | `01-Roamly - Home.html` | Marketing landing | Expedition (primary) |
| 02 | `02-Roamly - TripDetail.html` | Trip detail + booking widget | Expedition |
| 03 | `03-Roamly - Trips.html` | Browse / filter listing | Expedition |
| 04 | `04-Roamly - BookingStep1.html` | Roster (traveller count) | Expedition |
| 05 | `05-Roamly - BookingStep2.html` | Traveller details | **Heritage (divergent)** |
| 06 | `06-Roamly - BookingStep3.html` | Pickup point | **Heritage (divergent)** |
| 07 | `07-Roamly - BookingStep4.html` | Payment | Expedition |
| 08 | `08-Roamly - BookingConfirmation.html` | Success | Expedition |
| 09 | `09-Roamly - MyTrip.html` | Post-booking dashboard | Expedition |

Two visual languages are in play. Section 10 documents the split and what to do
about it.

---

## 2. Foundations — Theme A "Expedition" (7 of 9 pages)

### 2.1 Color tokens

Defined in `tailwind.config` at `01-Roamly - Home.html:23-31` (identical block in
02:23-31, 03:23-31, 09:23-31; compact one-line form in 04:20, 07:20, 08:20).

| Token | Hex | Role | Example |
|-------|-----|------|---------|
| `bg-canvas` | `#ffffff` | Page ground | `01:58` `<body class="bg-bg-canvas">` |
| `surface` | `#f8f9fa` | Raised panels, inputs, chips | `01:85`, `09:84` |
| `brand` | `#1a4332` | Deep forest green — primary | `01:26` |
| `accent` | `#d4f27a` | Neon lime — *only* on brand/ink | `01:27` |
| `ink` | `#0a0a0a` | Body text, dark panels | `01:28` |
| `muted` | `#666666` | Secondary text | `01:29` |
| `border-subtle` | `#e5e7eb` | Hairlines, card edges | `01:30` |

**Pairing rule.** Lime never sits on white. It appears exclusively as foreground on
`brand` or `ink`: `bg-brand text-accent` (`01:65`, `01:76`, `04:122`, `09:195`) or
`bg-accent text-brand` (`01:206`, `02:195`, `07:129`). White copy on brand is always
transparency-stepped — `text-white/60` for body (`02:194`, `09:197`),
`text-white/40` for labels (`04:127`, `07:113`), `text-white/30` for legal
(`07:143`).

Ad-hoc opacity values in use: `brand/20` `brand/30` `brand/10` `brand/5` (shadows),
`black/5` (hover), `white/10` `white/20` (dividers/borders on dark), `accent/20`.

### 2.2 Typography

Loaded at `01:14` — Space Grotesk 300–700 + Inter 300–600.

| Family | Token | Applied via | Source |
|--------|-------|-------------|--------|
| Inter | `font-sans` (default) | `body { font-family: 'Inter' }` | `01:41` |
| Space Grotesk | `font-display` | `.font-display` utility class | `01:42` |

Note the display font is wired **twice** — as a Tailwind `fontFamily` key (`01:21`)
and as a hand-written CSS class (`01:42`). Markup uses the CSS class.

**Type scale in use:**

| Size | Weight / treatment | Purpose | Reference |
|------|--------------------|---------|-----------|
| `text-6xl md:text-8xl` | `font-extrabold tracking-tighter leading-[0.9] uppercase` | Hero H1 | `01:89` |
| `text-5xl md:text-7xl` | `font-extrabold tracking-tighter leading-none uppercase` | Page H1 | `02:110`, `08:43`, `09:73` |
| `text-4xl md:text-6xl` | same | Checkout H1 | `04:69`, `07:69` |
| `text-3xl` | `font-extrabold tracking-tighter uppercase` | Section H2 | `02:141`, `09:121` |
| `text-2xl` | `font-extrabold uppercase tracking-tight` | Card title / H3 | `01:217`, `04:81` |
| `text-xl` | `font-extrabold uppercase` | Small card title H4 | `01:257` |
| `text-lg` | `text-muted font-medium leading-relaxed` | Lede paragraph | `01:92`, `09:76` |
| `text-sm` | `font-bold uppercase` | Data values | `02:118`, `08:70` |
| `text-[13px]` | `font-semibold uppercase tracking-wider` | Nav links | `01:67` |
| `text-[11px]` | `font-black uppercase tracking-wider` | Footer links, pills | `01:428`, `03:135` |
| `text-[10px]` | `font-black uppercase tracking-widest` | Eyebrow / badge / meta | `01:112`, `01:206` |
| `text-[9px]` | `font-black uppercase tracking-[0.2em]` | Micro-label above a value | `02:208`, `07:113` |

Two decorative outliers: the ghost numeral `text-[12rem] font-black text-surface`
(`01:337-339`) and the watermark icon `text-[15rem]` at `opacity-10` (`01:392`).

**Typographic voice.** Three rules carry the brand:

1. **Uppercase everywhere** above body copy — headings, buttons, labels, badges,
   nav, footer. Sentence case survives only in long prose (`01:92`, `02:143-144`).
2. **Negative tracking on display, wide tracking on micro.** Headings use
   `tracking-tighter`; anything ≤11px uses `tracking-widest` or `tracking-[0.2em]`.
3. **Italic as the accent mark.** The final word of a headline flips to
   `text-brand italic`: `02:111`, `04:69`, `07:69`, `08:44`, `09:74`, `01:341`.
   Also used for the logo glyph (`01:65`) and the roster numeral (`04:80`).

Weights skew heavy: `font-medium` for body, `font-bold` for values,
`font-extrabold` for headings, `font-black` for micro-labels and buttons.

### 2.3 Radius

Tailwind's `borderRadius` is extended at `01:32-35` (`3xl: 1.5rem`, `4xl: 2rem`) but
the markup almost never uses those keys — it reaches for arbitrary values instead.
Effective scale:

| Value | Class | Applied to | Reference |
|-------|-------|------------|-----------|
| 0.5rem | `rounded-lg` | Logo mark, tiny chips | `01:65`, `02:211` |
| 0.75rem | `rounded-xl` | Small icon tiles | `09:120` |
| 1rem | `rounded-2xl` | Inputs, buttons, icon tiles, small cards | `04:87`, `01:96` |
| 1.5rem | `rounded-3xl` | Glass overlays, filter bar | `01:109`, `03:91` |
| 2rem | `rounded-[2rem]` | Search fields, CTA buttons, inner dark panels | `01:132`, `04:153`, `08:78` |
| 2.5rem | `rounded-[2.5rem]` | Media cards, category tiles, success mark | `01:208`, `01:301`, `08:37` |
| 3rem | `rounded-[3rem]` | Major surfaces: hero image, form cards, sidebars | `01:203`, `02:205`, `09:84` |
| 4rem | `rounded-[4rem]` | Full-bleed CTA block | `01:390` |
| pill | `rounded-full` | Nav bar, badges, icon buttons | `01:62`, `01:206` |

Directional variant: the corner ribbon `rounded-bl-[2rem]` (`04:76`, `08:52`).

**Rule of thumb:** radius scales with the element. Controls get 1–2rem, cards get
2.5–3rem, page-level blocks get 4rem.

### 2.4 Spacing & layout

- **Container:** `max-w-7xl mx-auto px-6` on every page shell (`01:62`, `02:99`,
  `09:64`). Checkout content narrows to `max-w-4xl` (`01:131`) or `max-w-2xl`
  (`08:33`).
- **Section rhythm:** `py-24` for marketing (`01:185`, `01:334`), `py-20` for app
  screens (`02:99`, `09:64`), `py-16` between (`01:297`).
- **Fixed-nav offset:** pages start at `pt-32` (`04:64`, `09:64`) or `pt-28`
  (`02:73`); the home hero uses `pt-24` (`01:82`).
- **Grid:** 12-column at `lg` for all detail/checkout layouts — content `lg:col-span-8`
  + rail `lg:col-span-4` (`02:102`/`02:204`, `04:67`/`04:121`), widening to 7/5 on
  the payment screen (`07:67`/`07:106`). Gutter is `gap-16`.
- **Card grids:** listing is `md:grid-cols-2 lg:grid-cols-3 gap-12` (`03:117`); the
  home bento is `md:grid-cols-12 gap-8` with 8/4/4/4/4 spans (`01:200-291`).
- **Card padding:** `p-10` for major panels (`02:205`, `04:122`, `09:84`), `p-8` for
  secondary (`02:153`, `07:90`), `p-6` for compact (`01:109`, `03:...`).
- **Sticky rails:** `sticky top-32` (`02:205`, `04:122`, `07:107`); the filter bar is
  `sticky top-24 z-40` (`03:90`).

**Z-index ladder:** `z-[200]` custom cursor → `z-[100]` nav → `z-40` filter bar →
`z-20` search overlay → `z-10` content over decoration → `-z-10` blur orbs.

### 2.5 Elevation

| Class | Use | Reference |
|-------|-----|-----------|
| `shadow-sm` | Nav bar, listing cards | `01:62`, `03:121` |
| `shadow-lg` | Badges, small primary buttons | `01:76`, `01:206` |
| `shadow-xl` | Overlay badges, dark inner panels | `01:206`, `09:79` |
| `shadow-2xl` | Hero image, booking widget, CTA | `01:107`, `02:205` |

Shadows are **tinted, not black**: `shadow-brand/20` under primary buttons
(`01:76`, `09:79`), `shadow-brand/30` under the hero CTA (`01:96`),
`shadow-brand/5` under white cards (`02:205`, `07:75`), `shadow-accent/20` under
lime panels (`07:129`), `shadow-black/20` only on dark grounds (`07:138`).

### 2.6 Custom CSS

The full `<style>` block (`01:40-56`; trimmed copies in 02:40-47, 03:40-48,
04:25-29, 07:25-29, 08:25-29):

```css
body            { font-family: 'Inter', sans-serif; }
.font-display   { font-family: 'Space Grotesk', sans-serif; }
.glass          { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px);
                  border: 1px solid rgba(255,255,255,0.3); }
.text-outline   { -webkit-text-stroke: 1px #0a0a0a; color: transparent; }
.no-scrollbar   { -ms-overflow-style: none; scrollbar-width: none; }
.trip-card:hover .trip-image { transform: scale(1.05); }
@keyframes float { 0%,100% { translateY(0) } 50% { translateY(-10px) } }
.animate-float  { animation: float 6s ease-in-out infinite; }
```

`.glass` is `0.7` alpha on content pages (`01:43`) and `0.8` on checkout pages
(`04:28`, `07:28`, `08:28`).
`.text-outline` is used once — the hollow "EXPEDITIONS" headline (`01:190`).
`.animate-float` is used once — the hero image (`01:107`).
`.no-scrollbar` is declared on five pages and used on none.

---

## 3. Components — Theme A

### 3.1 Floating glass navbar
`01:61-79` · duplicated in `02:52-70`, `03:53-71`, simplified in `09:51-61`

Fixed pill bar, inset from the viewport, not full-bleed:

```html
<nav class="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
  <div class="max-w-7xl mx-auto glass rounded-full px-6 py-3 flex items-center
              justify-between border border-border-subtle shadow-sm">
```

- **Logo:** `bg-brand text-accent w-8 h-8 rounded-lg …text-sm italic` mark + wordmark
  in `font-display font-extrabold text-2xl tracking-tighter` (`01:64-66`). The
  checkout variant shrinks the mark to `w-6 h-6 rounded` and the wordmark to
  `text-xl` (`04:36-38`).
- **Links:** `text-[13px] font-semibold uppercase tracking-wider`, hidden below `lg`.
  Active state is a bare `text-brand` (`01:68`, `03:60`) — note `02:59` omits it.
- **Actions:** ghost "Sign In" + primary pill "Book Now" (`01:75-76`).

### 3.2 Buttons

| Variant | Recipe | Reference |
|---------|--------|-----------|
| **Primary** | `bg-brand text-accent … font-black uppercase tracking-tighter hover:scale-105 shadow-xl shadow-brand/20` | `01:96`, `02:229`, `09:79` |
| **Primary on dark** | `bg-accent text-brand …` — inverted for brand/ink grounds | `02:195`, `04:153`, `09:198` |
| **Secondary / ghost** | `border border-border-subtle … hover:bg-surface` | `02:230`, `01:97` |
| **Ghost on dark** | `border border-white/20 text-white hover:bg-white/10` | `01:403` |
| **Neutral pill** | `bg-ink text-white … group-hover:bg-brand group-hover:text-accent` | `03:141` |
| **Icon, circular** | `w-12 h-12 rounded-full border border-border-subtle hover:bg-brand hover:text-white` | `01:195-196` |
| **Icon, square** | `w-12 h-12 rounded-2xl bg-surface border … hover:bg-brand hover:text-accent` | `01:421-423` |
| **Add / empty** | `border-2 border-dashed border-border-subtle … hover:border-brand hover:text-brand hover:bg-surface` | `04:113` |
| **Text link** | `text-[11px] font-black uppercase tracking-[0.2em] text-brand border-b-2 border-brand pb-1` | `02:183` |
| **Outline block** | `border-2 border-ink … hover:bg-ink hover:text-white` | `03:205` |

Primary sizing: `px-10 py-5` hero (`01:96`), `px-12 py-5` CTA (`01:402`),
`px-6 py-2.5` nav (`01:76`), `w-full py-5`/`py-6` in rails (`02:229`, `04:153`).

Hover motion is scale, not color: `hover:scale-105` (`01:76`), `hover:scale-[1.02]`
on wide buttons (`01:150`, `02:229`), and one deliberate `hover:rotate-2` on the
hero CTA (`01:96`).

### 3.3 Badges & pills

All share `px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest`:

- **Brand:** `bg-brand text-accent shadow-xl` — "Weekend Peak", "Expert Led",
  "Confirmed" (`01:233`, `02:107`, `09:70`)
- **Accent:** `bg-accent text-brand shadow-xl` — "Best for Experts" (`01:206`)
- **Frosted:** `bg-white/90 backdrop-blur shadow-xl` — over imagery (`01:252`, `03:125`)
- **Outline:** `bg-surface border border-border-subtle` — "Verified Trail" (`02:108`)
- **Eyebrow with live dot:** `inline-flex … bg-surface border` + a
  `w-1.5 h-1.5 rounded-full bg-accent animate-pulse` (`01:85-88`, `03:76-79`)
- **Urgency:** `bg-accent text-brand px-3 py-1 rounded-lg text-[9px] animate-pulse` —
  "6 Slots Left" (`02:211`)
- **Corner ribbon:** `absolute top-0 right-0 px-8 py-3 bg-brand text-accent
  rounded-bl-[2rem]` (`04:76`, `08:52`)

### 3.4 Cards

**Media card with glass overlay** (`01:202-226`) — the signature card. Image fills a
`rounded-[3rem]` frame; a `glass p-6 rounded-[2.5rem]` panel is inset
`bottom-6 left-6 right-6` carrying title left / price right.

**Media card with gradient scrim** (`01:229-245`) — alternative for white-on-image:
`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent`,
then white text directly on the image.

**Listing card** (`03:120-144`) — `aspect-[4/5]` image, caption *below* the frame,
divided by `border-t border-border-subtle pt-6`, price left / button right.

**Stat / feature row** (`01:344-350`, `02:115-121`) —
`w-12 h-12 rounded-2xl bg-surface border` icon tile + title + `text-muted` line.

**Dark panel** — `bg-ink text-white rounded-[3rem] p-10`, for coordinator
(`02:187`), order ledger (`07:107`), extraction point (`09:123`).

**Brand panel** — `bg-brand text-accent rounded-[3rem] p-10`, for the roster summary
(`04:122`) and support block (`09:195`).

**Sticky booking widget** (`02:205-236`) — white `rounded-[3rem] p-10 shadow-2xl
shadow-brand/5`; price + urgency badge, then `bg-surface rounded-[2rem]` field
blocks, then a stacked primary/secondary button pair, closing on a
`text-[9px] uppercase tracking-widest` trust line.

**Category tile** (`01:301-307`) — `aspect-square rounded-[2.5rem] border p-6
flex flex-col justify-between`, whole tile inverts on hover
(`hover:bg-brand hover:text-accent`) while the icon does
`group-hover:-rotate-12`.

**Accordion row** (`02:153-161`) — `bg-surface border rounded-[2.5rem] p-8`, stage
eyebrow + title, `fa-plus` with `group-hover:rotate-45`; whole row inverts on hover.

### 3.5 Forms

**Field** (`04:85-88`):

```html
<div class="space-y-2">
  <label class="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Full Name</label>
  <input class="w-full bg-white border border-border-subtle rounded-2xl px-6 py-4
                outline-none focus:border-brand transition-colors font-bold text-sm">
</div>
```

Focus is border-color only — `outline-none focus:border-brand`, no ring anywhere.
Text inputs that hold names/codes add `uppercase` (`04:87`, `04:104`).
Selects add `appearance-none cursor-pointer` (`01:143`, `04:104`).

**Inline search field** (`01:132-138`) — icon + stacked label/input inside a
`bg-surface rounded-[2rem] px-6 py-4` block, all three fields sharing one white
`rounded-[2.5rem] p-2` shell.

**Read-only field block** (`02:215-218`) — `p-6 bg-surface rounded-[2rem] border`,
micro-label over a `font-bold text-sm uppercase` value.

### 3.6 Steppers

**Theme A, chip stepper** (`04:39-59`, completed state `07:39-59`) — numbered
`w-6 h-6 rounded-full` badges joined by `w-8 h-px bg-border-subtle`. Current step is
`bg-brand text-accent` + `text-brand` label; upcoming steps are wrapped in
`opacity-30`. Completed steps swap the numeral for `fa-check` and the connector to
`bg-brand`.

Stage labels are themed, not literal: Roster → Extraction → Intel → Secure.

**Journey tracker** (`09:85-109`) — five `w-12 h-12 rounded-2xl` nodes over an
absolutely positioned `h-0.5 bg-border-subtle` rail. Done = `bg-brand text-accent`,
current = `bg-accent text-brand animate-pulse`, future = white + border +
`opacity-30 grayscale`.

### 3.7 Footer
`01:410-454` · condensed variant `02:242-251`, `09:207-215`

Four columns (`md:col-span-2` brand block + two link columns), `mb-16`, then a
`pt-12 border-t border-border-subtle` bar with copyright left and legal links right,
both at `text-[10px] font-bold uppercase tracking-widest text-muted`.
Social icons reuse the square icon-button (`01:421-423`).

### 3.8 Custom cursor
`01:457-464` · repeated in `02:254-261`, `03:258-265`

`hidden lg:block fixed w-8 h-8 rounded-full border border-brand/20 pointer-events-none
z-[200] transition-transform duration-300 ease-out`, positioned by a `mousemove`
listener offsetting by 16px. Present on 01/02/03 only — absent from 04–09.

---

## 4. Motion

| Pattern | Implementation | Reference |
|---------|----------------|-----------|
| Button lift | `hover:scale-105` / `hover:scale-[1.02]` + `transition-all` | `01:76`, `02:229` |
| Button tilt | `hover:rotate-2` | `01:96` |
| Image zoom | `.trip-card:hover .trip-image { scale(1.05) }` + `duration-700` | `01:55`, `01:204` |
| Surface invert | `hover:bg-brand hover:text-accent` on the whole card | `01:301`, `02:153`, `09:149` |
| Icon rotate | `group-hover:-rotate-12`, `group-hover:rotate-45` | `01:302`, `02:159` |
| Hero float | `animate-float`, 6s ease-in-out infinite | `01:53`, `01:107` |
| Live indicator | `animate-pulse` on dots, urgency badges, active step | `01:86`, `02:211`, `09:98` |
| Cursor trail | `transition-transform duration-300 ease-out` | `01:457` |

Default duration is Tailwind's 150ms via `transition-all`; only the image zoom
(700ms) and cursor (300ms) are slowed deliberately.

---

## 5. Iconography

Font Awesome 6 — **loaded twice on every page**: the JS kit at
`01:8` (6.4.0, with `autoReplaceSvg: 'nest'` at `01:3-7`) and the CSS build at
`01:13` (6.0.0). One should go; see §10.

Recurring glyphs: `fa-mountain` / `fa-mountain-sun` / `fa-mountain-city`,
`fa-map-pin`, `fa-tent`, `fa-compass`, `fa-cloud-sun`, `fa-leaf`,
`fa-shield-halved`, `fa-user-group`, `fa-star`, `fa-check`, `fa-plus`,
`fa-file-pdf`, `fa-download`, `fa-lock`, `fa-circle-info`, and the brands
`fa-whatsapp`, `fa-instagram`, `fa-tiktok`, `fa-cc-visa`, `fa-cc-mastercard`.

Icons are almost always sized by their container, not a text class — the
`w-12 h-12 rounded-2xl` tile (`01:345`) and `w-10 h-10 rounded-xl` tile (`09:120`)
are the two standard holders.

---

## 6. Imagery

All photography is remote, from `storage.googleapis.com/uxpilot-auth.appspot.com/`
(`01:108`, `02:77-89`, `03:122`). Avatars come from the same host's `/avatars/` path
(`02:189`, `09:180`).

Aspect ratios: `aspect-[4/5]` for hero and listing cards (`01:107`, `03:121`),
`aspect-[4/3]` for secondary cards (`01:249`), `aspect-square` and `aspect-[3/4]`
alternating in the story collage (`01:367-384`), fixed `h-[500px]` for bento cards
(`01:203`).

Every image is `w-full h-full object-cover` inside a rounded, `overflow-hidden`
frame. The trip-detail gallery is a `md:grid-cols-4 md:grid-rows-2` mosaic where the
lead image spans 2×2 and the four secondaries are `hidden md:block` (`02:75-94`).

Decorative blur orbs sit behind the hero: `w-40 h-40 bg-accent rounded-full blur-3xl
opacity-30 -z-10` and a larger `bg-brand … opacity-10` (`01:123-124`).

---

## 7. Voice & content conventions

The copy is a system in its own right — an expedition/mission register applied to
ordinary commerce nouns. Keep it consistent or drop it entirely; half-applied it
reads as a bug.

| Standard term | Roamly term | Reference |
|---------------|-------------|-----------|
| Trip / tour | Expedition, Run, Trail | `01:189`, `09:76` |
| Travellers | Roster, Team, Units | `04:69`, `07:118` |
| Departure / pickup | Extraction, Extraction Point | `04:47`, `09:121` |
| Traveller details | Primary Intel | `04:81` |
| Order summary | Expedition Log, Order Ledger | `04:123`, `07:108` |
| Support | Basecamp Help, Chat with Command | `09:196`, `09:199` |
| Success | Peak Attained | `08:44` |
| Home | Return to Base | `08:105` |
| Difficulty | Grade: Moderate / Extreme / Hard Core | `03:161`, `01:117` |

Numbers are zero-padded in labels (`02 Units`, `08 Days`, `Stage 01`) —
`07:118`, `03:135`, `02:156`.
Currency is `₹` with comma grouping, set in
`font-display font-black tracking-tighter` at `text-3xl`–`text-5xl` (`01:222`,
`02:209`, `03:139`).
Prices are always preceded by a `Starting from` micro-label (`01:221`, `03:138`).

---

## 8. Foundations — Theme B "Heritage" (Booking steps 2 & 3)

`05-Roamly - BookingStep2.html` and `06-Roamly - BookingStep3.html` implement a
different design language end to end.

### 8.1 Tokens
`05:19-20` (identical at `06:19-20`)

| Token | Hex | Theme A counterpart |
|-------|-----|---------------------|
| `bg-base` | `#faf9f6` warm off-white | `bg-canvas` `#ffffff` |
| `surface-0` | `#f3f0e9` | `surface` `#f8f9fa` |
| `surface-1` | `#ebe7de` | — |
| `line-1` | `#e0d9cc` warm border | `border-subtle` `#e5e7eb` |
| `ink-900` | `#1c1a17` | `ink` `#0a0a0a` |
| `ink-600` | `#5c564c` | `muted` `#666666` |
| `brand` | `#094c32` | `brand` `#1a4332` |
| — | — | `accent` `#d4f27a` **has no equivalent** |

### 8.2 Type
Playfair Display (serif) + Inter — `05:14`, `05:19`. Headings are
`font-serif text-3xl` in **sentence case** (`05:68` "Traveller details",
`06:68` "Choose your pickup point"), the opposite of Theme A's
uppercase Space Grotesk. No `<style>` block, so no `.glass`, no `.font-display`.

### 8.3 Components
- **Header:** solid white, `border-b border-line-1`, `sticky top-0 z-50`, container
  `max-w-5xl` — not floating, not glass (`05:29-37`).
- **Logo:** a `❦` glyph plus serif "Roamly" (`05:34`) instead of the R-mark.
- **Stepper:** full-width bar with `w-8 h-8 rounded-full` nodes and `flex-1 h-[2px]`
  connectors, labels *below* the node (`05:42-62`). Literal names —
  Travellers / Details / Pickup / Payment.
- **Card:** `bg-white border border-line-1 rounded-3xl p-8 shadow-sm` (`05:72`) —
  1.5rem radius vs. Theme A's 3rem.
- **Field:** `bg-surface-0 border border-line-1 rounded-xl px-4 py-3`, label
  `text-xs` (`05:80-81`) — smaller radius, smaller padding, tinted rather than white.
- **Primary button:** `bg-brand text-white py-4 rounded-2xl font-bold text-lg
  hover:bg-opacity-90` (`05:118`) — white text, sentence case, opacity hover instead
  of scale.
- **Selectable radio card** (`06:72-85`) — genuinely good pattern with no Theme A
  equivalent: a `<label>` wrapping a `hidden` radio, selected state carried by
  `border-2 border-brand`, plus a `Recommended` tag pinned `-top-3 left-6`.
- **Info note** (`06:118-123`) — `p-6 bg-surface-0 rounded-2xl border border-line-1`
  with a leading `fa-circle-info text-brand`.
- **Real form semantics** — `<form action=…>`, `required`, `type="submit"`
  (`05:70`, `05:81`, `05:118`). Theme A uses `onclick="window.location.href=…"`
  everywhere instead (`01:96`, `02:229`, `04:153`, `07:138`).

---

## 9. Navigation graph

Intended flow (as written in the markup):

```
Home ──► Trips ──► TripDetail ──┐
  └──────────────────────────────┴──► Step1 Roster
                                        └─► Step2 Details
                                              └─► Step3 Pickup
                                                    └─► Step4 Payment
                                                          └─► Confirmation
                                                                └─► MyTrip
```

Transitions are set at `01:96` / `01:202` (Home → Step1), `03:120`
(Trips → TripDetail), `02:229` (Detail → Step1), `04:153`, `05:70`, `06:125`,
`07:138`, `08:91`.

---

## 10. Known inconsistencies

Ordered by impact. Each is a real divergence between files, not a style preference.

1. **Two design languages inside one checkout.** Steps 1 and 4 are Theme A
   (Space Grotesk, forest/lime, 3rem radius, uppercase); steps 2 and 3 are Theme B
   (Playfair, cream, 1.5rem radius, sentence case). A user crossing `04 → 05 → 07`
   sees the brand change twice. Pick one — Theme A carries the brand, Theme B has
   the better form semantics and the better radio-card pattern (`06:72-85`).

2. **`bg-canvas` is referenced but undefined on 4 pages.** `04:31`, `05:26`,
   `07:31`, `08:31` all set `class="bg-bg-canvas"` on `<body>`, but the token is
   absent from the compact configs at `04:20`, `07:20`, `08:20` (and Theme B never
   had it). The class is a no-op; those pages render on the browser default rather
   than an explicit `#ffffff`.

3. **Nav active state is missing on TripDetail.** `01:68` and `03:60` mark
   "Expeditions" with `text-brand`; `02:59` does not.

4. **Font Awesome loaded twice, at two versions** — JS kit 6.4.0 (`01:8`) and CSS
   6.0.0 (`01:13`) on all nine pages. Two full icon payloads per page.

5. **All internal links are broken.** Markup points at
   `Home__desktop.html`, `Trips__desktop.html`, `TripDetail__desktop.html`,
   `BookingStep1__desktop.html` … (`01:64`, `01:96`, `02:229`, `04:153`, `05:31`,
   `06:125`, `07:138`, `08:91`). The files on disk are named
   `01-Roamly - Home.html` etc. Nothing navigates as-is.

6. **The theme config is copy-pasted nine times** and has already drifted: the
   verbose form (01, 02, 03, 09) includes `bg-canvas` and the `borderRadius`
   extension; the compact form (04, 07, 08) drops both. Any token change requires
   nine edits.

7. **`borderRadius: { '3xl': '1.5rem', '4xl': '2rem' }`** (`01:32-35`) is dead
   config — `3xl` already equals 1.5rem in Tailwind, and no markup uses `rounded-4xl`
   (the CTA at `01:390` uses arbitrary `rounded-[4rem]`).

8. **`.no-scrollbar` is declared and never used** — `01:45-46`, `02:45-46`,
   `03:45-46`, `09:44-45`.

9. **Navigation by `onclick`, not `<a>`.** `01:96`, `01:202`, `02:229`, `03:120`,
   `04:153`, `06:125`, `07:138` push `window.location.href` from `<button>` and
   `<div>` elements — not keyboard-reachable, no middle-click, no visible href.

10. **Accessibility gaps** — `outline-none` with no replacement focus ring on every
    input (`04:87`, `05:81`); `text-[9px]`/`text-[10px]` at `font-black` in
    `#666666` for a large share of the interface copy; `text-white/40` and
    `text-white/30` label text on dark panels (`07:113`, `07:143`); clickable
    `<div class="trip-card">` cards with no `role` or `tabindex` (`01:202`,
    `03:120`); no `alt`-less images, but the generative prompt strings are used as
    alt text verbatim (`01:108`, `02:77`).

11. **Sex field offers only Male/Female** with no other option (`04:105-106`).

12. **Duplicated markup with no shared source** — the navbar exists in 4 variants,
    the footer in 3, the cursor script in 3. There is no partial, include, or
    component layer.

---

## 11. Consolidation checklist

If this moves toward production, in order:

1. Extract the `tailwind.config` block and the `<style>` rules into one
   `theme.js` + `roamly.css`, referenced by all nine pages.
2. Add `bg-canvas` to the compact configs (or delete `bg-bg-canvas` from those
   bodies) — see §10.2.
3. Choose one checkout theme and rebuild `05`/`06` against it, keeping their form
   semantics and radio-card pattern.
4. Fix the internal hrefs to the on-disk filenames.
5. Drop one Font Awesome include.
6. Replace `onclick` navigation with `<a>`; restore a visible focus style.
7. Delete the dead `borderRadius` extension and `.no-scrollbar`.
8. Promote the four repeated blocks (nav, footer, stepper, footer bar) into
   partials once a templating layer exists.

---

*Generated 2026-08-27 from the nine HTML files in `/Users/piyushyadav/Desktop/Travel A`.*
