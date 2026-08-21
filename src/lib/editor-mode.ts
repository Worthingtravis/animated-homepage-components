/**
 * Editor mode — the one surface that decides how every leaf in this forest
 * looks.
 *
 * ── Why this is not a VM field ─────────────────────────────────────────────
 * On laughingwhales.com a creator's look reaches their page as **ambient CSS
 * variables on a single wrapper div**, not as props:
 *
 *   <div className="creator-page …" style={cssVars}>   ← creator-page-client.tsx
 *
 * Because it is inherited CSS, a component needs no prop at all to participate.
 * It only has to be *styled in the tokens the wrapper overrides* rather than
 * only in neutrals. That is the whole mechanism, and copying it here is what
 * makes a harvest a copy rather than a port: a leaf that themes correctly in
 * this lab themes correctly on a creator page, with no adapter in between.
 *
 * So editor mode is deliberately absent from every `*.vm.ts` in this forest.
 * Adding a `theme` field to a VM would make theming a data-flow problem that
 * every container has to thread — which is exactly the shape that made the old
 * `PageNavTheme` the only leaf that could not be dropped in and left alone.
 *
 * ── The contract ───────────────────────────────────────────────────────────
 * These are the seven fields laughingwhales' `resolveTheme` resolves
 * (`src/lib/creator/theme-resolver.ts` over there), field for field. Nothing is
 * added and nothing is renamed, so a resolved theme from that repo is already a
 * valid `EditorMode` here.
 *
 * Note what is NOT in it: there is no secondary colour, no radius, no spacing,
 * no type scale, no card/border/muted override. A creator picks two colours, a
 * background and a font. Everything else on a creator page stays at the
 * platform's own tokens — so a leaf styled only in `card`/`border`/`muted`
 * is invisible to the creator's brand, and `reaches for the creator's accent` in the
 * conformance suite is the test that keeps that from happening quietly.
 */

/** Ambient effect toggles. Carried for fidelity; only `stylePersonality` is visual. */
export type StylePersonality = "default" | "playful" | "minimal" | "bold";

export type EditorFeatureFlags = {
  cursorTrail: boolean;
  scrollConfetti: boolean;
  quoteEmotes: boolean;
  loadingEmote: boolean;
  fallingIcons: boolean;
  stylePersonality: StylePersonality;
};

/**
 * A resolved editor mode. Structurally identical to laughingwhales'
 * `ResolvedTheme` — the output of `resolveTheme(page, appliedTheme)`.
 */
export type EditorMode = {
  /** The creator's brand colour. Becomes `--primary` and `--ring`. */
  themeAccent: string;
  /** Hover / glow variant. Becomes `--accent`. */
  themeAccentDark: string;
  /** Page background. `null` leaves `--background` at the forest token. */
  themeBackground: string | null;
  /** Google Font family name — "Inter", not a stack. `null` keeps the default. */
  fontFamily: string | null;
  /** Background image. Content, not palette — on a real page this field wins over a theme's. */
  backgroundImageUrl: string | null;
  /** CSS object-position for the background image. */
  backgroundPosition: string | null;
  featureFlags: EditorFeatureFlags | null;
};

/**
 * Prisma column defaults from `CreatorPage`. A creator who has never touched
 * the editor renders with exactly these.
 */
export const EDITOR_MODE_DEFAULT: EditorMode = {
  themeAccent: "#FF69B4",
  themeAccentDark: "#E91E8C",
  themeBackground: null,
  fontFamily: null,
  backgroundImageUrl: null,
  backgroundPosition: null,
  featureFlags: null,
};

export const FEATURE_FLAGS_DEFAULT: EditorFeatureFlags = {
  cursorTrail: false,
  scrollConfetti: false,
  quoteEmotes: false,
  loadingEmote: false,
  fallingIcons: true,
  stylePersonality: "default",
};

/* ------------------------------------------------------------------ *
 * Colour. Ported verbatim so the lab and production agree to the byte.
 * ------------------------------------------------------------------ */

/**
 * Pick black or white text for a background of `hex`.
 *
 * Verbatim port of laughingwhales' `readableTextOn`
 * (`src/lib/readable-text.ts`). It exists because `--primary` is a
 * CREATOR-CHOSEN colour and a hardcoded white foreground is only right for dark
 * ones — a lime accent (#9CCB1A) put white text on the primary CTA at 1.91:1,
 * effectively invisible. Keep the constant at 0.6 and the weights where they
 * are; drifting from the original would mean a leaf that reads here and fails
 * there.
 */
export function readableTextOn(hex: string): "#000000" | "#ffffff" {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return "#ffffff";
  const n = parseInt(match[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

/* ------------------------------------------------------------------ *
 * The layering. Mirrors `resolveTheme`'s two-layer merge exactly.
 * ------------------------------------------------------------------ */

function isMissing(value: string | null | undefined): boolean {
  return value === null || value === undefined || value === "";
}

/** Theme-side win: theme value used unless empty, then the page's. */
function themeWins<T extends string | null>(themeValue: T, pageValue: T): T {
  return isMissing(themeValue) ? pageValue : themeValue;
}

/** Page-side win: page value used unless empty, then the theme's. */
function pageWins<T extends string | null>(pageValue: T, themeValue: T): T {
  return isMissing(pageValue) ? themeValue : pageValue;
}

/**
 * Layer an applied theme over a page's own fields.
 *
 * The rules are not symmetric and the asymmetry is the point:
 *  - palette and typography belong to the **theme** — a theme owns the look,
 *    and the page's flat fields are pre-theme baseline rather than deltas;
 *  - the background **image** belongs to the **page** — it is content, and a
 *    theme may only suggest a fallback when the page has none;
 *  - `featureFlags` shallow-merge with the page winning per key.
 *
 * With `applied === null` every page field is returned verbatim. That is the
 * parity guarantee upstream relies on, and it is why an unthemed creator
 * renders byte-identically before and after themes existed.
 */
export function resolveEditorMode(
  page: EditorMode,
  applied: EditorMode | null,
): EditorMode {
  if (!applied) return { ...page };

  const featureFlags =
    page.featureFlags || applied.featureFlags
      ? { ...FEATURE_FLAGS_DEFAULT, ...(applied.featureFlags ?? {}), ...(page.featureFlags ?? {}) }
      : null;

  return {
    themeAccent: themeWins(applied.themeAccent, page.themeAccent),
    themeAccentDark: themeWins(applied.themeAccentDark, page.themeAccentDark),
    themeBackground: themeWins(applied.themeBackground, page.themeBackground),
    fontFamily: themeWins(applied.fontFamily, page.fontFamily),
    backgroundImageUrl: pageWins(page.backgroundImageUrl, applied.backgroundImageUrl),
    backgroundPosition: pageWins(page.backgroundPosition, applied.backgroundPosition),
    featureFlags,
  };
}

/* ------------------------------------------------------------------ *
 * The injection. THE list of variables a creator can move.
 * ------------------------------------------------------------------ */

/**
 * The CSS custom properties a resolved editor mode sets, and the complete list
 * of them.
 *
 * This is a transcription of the `cssVars` object in laughingwhales'
 * `creator-page-client.tsx`. Five variables and a font family — that is the
 * entire reach of a creator's theme. `--card`, `--border`, `--muted`,
 * `--muted-foreground`, `--foreground` and `--radius` are conspicuously absent
 * because upstream never sets them either.
 *
 * `--primary-foreground` is DERIVED here rather than stored, exactly as it is
 * upstream. Do not add it to `EditorMode`.
 */
export function editorModeVars(mode: EditorMode | null): Record<string, string> {
  if (!mode) return {};
  const vars: Record<string, string> = {
    "--primary": mode.themeAccent,
    "--primary-foreground": readableTextOn(mode.themeAccent),
    "--accent": mode.themeAccentDark,
    "--ring": mode.themeAccent,
  };
  if (mode.themeBackground) vars["--background"] = mode.themeBackground;
  if (mode.fontFamily) vars.fontFamily = `"${mode.fontFamily}", sans-serif`;
  return vars;
}

/**
 * The wrapper's class list, mirroring upstream's
 * `creator-page creator-style-${stylePersonality}`. A harvested leaf therefore
 * sees the same class ancestry in this lab that it will see on a creator page.
 */
export function editorModeClassName(mode: EditorMode | null): string {
  const personality = mode?.featureFlags?.stylePersonality ?? "default";
  return `creator-page creator-style-${personality}`;
}

/**
 * Background-image styling. Kept separate from `editorModeVars` because these
 * are content fields, not palette — a surface may want the palette without
 * adopting someone's background photograph.
 */
export function editorModeBackground(mode: EditorMode | null): Record<string, string> {
  if (!mode?.backgroundImageUrl) return {};
  return {
    backgroundImage: `url("${mode.backgroundImageUrl}")`,
    backgroundPosition: mode.backgroundPosition ?? "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  };
}
