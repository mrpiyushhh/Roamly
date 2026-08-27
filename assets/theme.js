/* ============================================================
   Roamly — Tailwind theme
   Single source of truth for design tokens. Loaded after the
   Tailwind CDN on every page, replacing the nine copy-pasted
   config blocks the prototypes used to carry.
   ============================================================ */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif']
      },
      colors: {
        'canvas':        '#ffffff',  /* page ground                        */
        'surface':       '#f8f9fa',  /* raised panels, inputs, chips       */
        'brand':         '#1a4332',  /* deep forest green — primary        */
        'accent':        '#d4f27a',  /* neon lime — only on brand or ink   */
        'ink':           '#0a0a0a',  /* body text, dark panels             */
        'muted':         '#666666',  /* secondary text                     */
        'border-subtle': '#e5e7eb'   /* hairlines, card edges              */
      },
      borderRadius: {
        'card':  '2.5rem',           /* media cards, tiles                 */
        'panel': '3rem',             /* major surfaces                     */
        'block': '4rem'              /* full-bleed CTA blocks              */
      },
      boxShadow: {
        'brand':    '0 20px 25px -5px rgba(26,67,50,.20)',
        'brand-lg': '0 25px 50px -12px rgba(26,67,50,.30)',
        'soft':     '0 25px 50px -12px rgba(26,67,50,.08)'
      }
    }
  }
};
