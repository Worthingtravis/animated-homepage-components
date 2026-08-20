/**
 * Layered Poster — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * ── Where this shape came from ─────────────────────────────────────────────
 * This is the extract-vm form of Aceternity UI's `gta-vi-poster` block
 * (`npx shadcn add @aceternity/gta-vi-poster`). That component is a stack of
 * transparent art plates, each starting overscanned at its own depth and fading
 * in on its own delay, under one camera that settles the whole sheet into
 * frame; the logo is three of those plates, the last of which wipes up out of
 * blur. The composition is *in the artwork* — there is no grid.
 *
 * What the original owned that this contract takes away from it:
 *
 *   `useState`/`useLayoutEffect`/`ResizeObserver`  → a CSS square. Nothing
 *      measures anything: `aspect-square` plus `fit` as a percentage does what
 *      the observer was doing, and it works in a sidebar the observer never saw.
 *   `motion/react` timelines and per-layer delays  → `progress`, plus the pure
 *      samplers below. One transport the caller owns, which is what lets the
 *      lab clock scrub the entrance frame by frame.
 *   `duration` / `timeScale`                       → gone. Seconds are the
 *      container's business; a leaf is handed a position, never a rate.
 *   the replay `useState`                          → `replay`, a callback.
 *   `initialScale` per layer (1.23 … 3.31)         → `depth` 0..1, normalized,
 *      so art authored at any overscan drops into the same contract.
 *   hardcoded `#2a1133` / `bg-white/10` / CDN URLs → `backdrop` as a token
 *      string and `layers[].image`, supplied by the caller.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string.
 *  - Every user action is a callback or an href. Never an id a leaf resolves.
 *  - Transport (`progress`) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

/**
 * What the poster is doing. A sheet mid-entrance and a sheet at rest are
 * different compositions, not one composition with a flag.
 */
export type LayeredPosterState = "arriving" | "settled" | "loading" | "empty";

/** Pre-resolved dimensions so a leaf never measures. */
export type LayeredPosterImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** How a plate resolves once its turn arrives. */
export type LayeredPosterReveal = "fade" | "wipe-up";

/**
 * One plate in the stack. Transparent art, full-bleed, composed to sit at a
 * particular distance behind the sheet.
 */
export type LayeredPosterLayer = {
  id: string;
  image: LayeredPosterImage;
  /**
   * 0..1 — how far back this plate sits. 0 is flat on the sheet, 1 is the
   * deepest plate in the stack. Normalized by the container, because art comes
   * authored at whatever overscan its illustrator chose.
   */
  depth: number;
  /** 0..1 — where on the transport this plate starts arriving. */
  revealAt: number;
  reveal: LayeredPosterReveal;
  /**
   * The plate that is the logo. It resolves out of blur rather than simply
   * appearing, and a leaf may treat it as the thing the camera focuses on.
   * The container guarantees at most one.
   */
  focusPull: boolean;
};

export type LayeredPosterVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: LayeredPosterState;

  /**
   * Entrance transport, normalized 0..1, monotonic. The container drives it
   * from a clock; fixtures pin it to a reproducible instant.
   */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /**
   * The accessible name of the whole composition. The plates are decorative
   * individually — this is the one thing a screen reader should hear, so a
   * leaf marks every plate `aria-hidden` and announces this instead.
   */
  title: string;
  /** Pre-formatted line printed under the sheet. `null` prints nothing. */
  caption: string | null;

  /** Back to front. Order IS z-order. Empty renders no sheet, not a blank one. */
  layers: LayeredPosterLayer[];

  /**
   * How much the camera is overscanned at `progress` 0, as a scale factor.
   * Pre-resolved so no leaf invents its own camera move.
   */
  cameraScale: number;
  /**
   * 0..1 — the fraction of its box's short side the sheet fills. This is the
   * `fit` slider from the original, and it is what replaced the ResizeObserver.
   */
  fit: number;

  /** Replay the entrance. `null` hides the control entirely. */
  replay: { label: string; onActivate?: () => void } | null;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER, in FIXTURES, and inline in a
 * leaf's presentation — never as business logic.
 * ------------------------------------------------------------------ */

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * How long one plate takes to arrive, as a fraction of the whole transport.
 * The original spent 0.7s of a 3.6s timeline on each fade; this is that ratio,
 * expressed the only way a leaf can use it.
 */
export const LAYER_FADE = 0.2;

/**
 * The deepest a plate can start, as a scale factor. The original authored
 * per-layer overscans from 1.23 to 3.31; `depth` 0..1 maps onto that range so
 * the numbers live in one place instead of thirteen.
 */
export const MAX_PLATE_SCALE = 2.4;

/** 0..1 — how far along its own arrival a plate is at this transport. */
export function revealOf(progress: number, layer: LayeredPosterLayer): number {
  return clampProgress((clampProgress(progress) - layer.revealAt) / LAYER_FADE);
}

/**
 * The camera. Eased once, here, so the sheet and every plate on it agree about
 * what "settled" means — the original's two different easing curves were the
 * reason its logo could land before the art it was signing.
 */
export function cameraAt(progress: number): number {
  const t = clampProgress(progress);
  return 1 - Math.pow(1 - t, 3);
}

/** The scale a plate is drawn at: deep plates start further out and come in. */
export function plateScaleAt(progress: number, depth: number): number {
  const remaining = 1 - cameraAt(progress);
  return 1 + (MAX_PLATE_SCALE - 1) * clampProgress(depth) * remaining;
}

/** Collapse raw inputs to the discrete state so leaves never branch on numbers. */
export function resolveLayeredPosterState(
  input: { layerCount: number; isLoading: boolean; progress: number },
): LayeredPosterState {
  if (input.isLoading) return "loading";
  if (input.layerCount === 0) return "empty";
  return clampProgress(input.progress) >= 1 ? "settled" : "arriving";
}

/**
 * Normalize art-authored overscans onto `depth` 0..1. Runs in the container:
 * an illustrator hands over "this plate sits at 1.8", and the contract only
 * ever sees where that falls between the flattest and deepest plate given.
 */
export function normalizeDepths<T extends { initialScale: number }>(
  plates: T[],
): Array<T & { depth: number }> {
  const scales = plates.map((plate) => plate.initialScale);
  const min = Math.min(...scales, 1);
  const max = Math.max(...scales, 1);
  const span = max - min;
  return plates.map((plate) => ({
    ...plate,
    depth: span === 0 ? 0 : clampProgress((plate.initialScale - min) / span),
  }));
}
