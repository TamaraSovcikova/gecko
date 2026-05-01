/**
 * G.E.C.K.O — Centralised design tokens.
 *
 * Import COLORS / SHADOWS / GRADIENTS in components instead of hardcoding hex values.
 * The same values are exposed as CSS custom properties in src/index.css for use
 * inside template-literal <style> blocks.
 *
 * Palette source: the gecko-transparent.png logo
 *   soft lavender  #b8a4e8
 *   main purple    #8b6fd4
 *   dark purple    #5c3fa3
 *   gold           #f0b429
 */

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------
export const COLORS = {
  // Purple scale
  purple50:  "#faf9fd",   // near-white page background
  purple100: "#f4f1fb",   // card / section fill
  purple200: "#ede8f8",   // light tint, ghost button bg
  purple300: "#c9bde8",   // borders & dividers
  purple400: "#b8a4e8",   // soft lavender accent
  purple500: "#8b6fd4",   // primary interactive purple
  purple600: "#5c3fa3",   // dark heading / active state
  purple700: "#4e358f",   // deepest purple (focus rings)

  // Gold accent
  gold:     "#f0b429",
  goldDeep: "#d4940e",

  // Text
  textPrimary:   "#1a1040",   // very dark purple-black for headings
  textSecondary: "#4a3f6b",   // body copy
  textMuted:     "#7a6e99",   // placeholder / helper text
  textInverse:   "#ffffff",

  // Semantic
  error:   "#e05c5c",
  success: "#5bb8c4",

  // Chart (consistent across pie / bar charts)
  chart: ["#8b6fd4", "#f0b429", "#5bb8c4", "#e05c5c"] as const,
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------
export const SHADOWS = {
  sm:      "0 2px 8px rgba(92, 63, 163, 0.10)",
  md:      "0 4px 20px rgba(92, 63, 163, 0.14)",
  lg:      "0 8px 32px rgba(92, 63, 163, 0.18)",
  xl:      "0 16px 48px rgba(92, 63, 163, 0.22)",
  button:  "0 4px 14px rgba(92, 63, 163, 0.32)",
  nav:     "0 2px 16px rgba(92, 63, 163, 0.08)",
} as const;

// ---------------------------------------------------------------------------
// Gradients
// ---------------------------------------------------------------------------
export const GRADIENTS = {
  page:         "radial-gradient(circle at 14% 10%, #e8e0fa 0%, rgba(232,224,250,0) 36%), radial-gradient(circle at 90% 88%, #f5f0fe 0%, rgba(245,240,254,0) 40%), #f4f1fb",
  card:         "linear-gradient(145deg, #faf9fd 0%, #f4f1fb 62%, #ede8f8 100%)",
  cardSubtle:   "linear-gradient(145deg, #ffffff 0%, #faf9fd 100%)",
  buttonPrimary:"linear-gradient(135deg, #8b6fd4 0%, #5c3fa3 100%)",
  hero:         "linear-gradient(145deg, #ffffff 0%, #f8f5ff 55%, #ede8f8 100%)",
  about:        "linear-gradient(145deg, #f8f5ff 0%, #ede8f8 64%, #e4ddf5 100%)",
  contact:      "linear-gradient(145deg, #f8f5ff 0%, #f0ebfe 100%)",
  titleShimmer: "linear-gradient(110deg, #8b6fd4 10%, #f0b429 48%, #8b6fd4 86%)",
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const FONT = {
  family: "'Inter', 'Segoe UI', Arial, sans-serif",
} as const;
