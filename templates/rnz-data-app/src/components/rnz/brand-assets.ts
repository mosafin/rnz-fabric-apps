// RNZ brand assets. Brand-managed: update in the template, then `npm run rnz:sync`.
//
// The RICOH logo is ALWAYS shown as the lock-up (logo with the "imagine. change."
// tagline). RNZ never uses the logo without the tagline, at any size.
// Never rename this file or the image: skills, scripts and the brand check use
// these exact names.

/** Master lock-up artwork, served from public/brand/. Never crop, redraw or recolour it. */
export const RICOH_LOCKUP_SRC = "/brand/RICOH-Logo_sRGB_full-colour.png";

/** Alt text for the lock-up. */
export const RICOH_LOCKUP_ALT = "RICOH imagine. change.";

/**
 * Display height in the app header. At 40px tall the lock-up is about 92px wide,
 * above the 80px minimum width in ricoh-brand-methodology-v12.html (Section 03).
 * Never show it smaller. Where it can't fit (favicons, tiny UI), show no logo.
 */
export const RICOH_LOCKUP_HEIGHT_PX = 40;
