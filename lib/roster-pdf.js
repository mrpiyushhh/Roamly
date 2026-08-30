/* ============================================================
   Roamly — roster PDF generator

   Lifted verbatim out of server.js so both the local dev server and
   the Vercel serverless function share one implementation. Zero
   dependencies: a minimal PDF 1.4 writer using the standard
   Helvetica faces, A4 landscape, paginated.
   ============================================================ */
'use strict';

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
    c += txt(L, BOTTOM, 'Piyush Yadav  ·  carry a photo ID  ·  reporting times are fixed', 8, false);
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
module.exports = { buildRosterPDF, pdfText, fit };
