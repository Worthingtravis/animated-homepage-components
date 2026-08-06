/**
 * Aurora Headline — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch of this tree renders
 * from exactly this type and nothing else. Changing this file changes every
 * leaf; adding a leaf changes nothing.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string. No number, Date, or bigint
 *    that a leaf would have to format.
 *  - Every user action is a callback. Passive/animated trees may have none.
 *  - Animation transport (progress, elapsed, scroll) is a VM prop. The container
 *    owns the clock; fixtures freeze it at an interesting instant.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

export type AuroraHeadlineVMState = "idle" | "active" | "empty";

export type AuroraHeadlineVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: AuroraHeadlineVMState;

  /**
   * Animation transport, normalized 0..1. The connected container drives it from
   * a clock / scroll / IntersectionObserver; fixtures pin it to a constant so a
   * frame is reproducible.
   */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** Pre-formatted copy. */
  eyebrow: string | null;
  headline: string;
  body: string | null;

  /** TODO: replace with this tree's real payload — all strings, all pre-formatted. */
  items: AuroraHeadlineVMItem[];

  /** Optional call-to-action. `null` when the tree renders without one. */
  cta: { label: string; href: string; onActivate?: () => void } | null;
};

export type AuroraHeadlineVMItem = {
  id: string;
  label: string;
  /** Pre-formatted — e.g. "18.25 USDC", "3 min read", "Mar 4, 2026". */
  detail: string | null;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER (or in fixtures), never in a leaf.
 * ------------------------------------------------------------------ */

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Collapse transport to a discrete state so leaves never branch on numbers.
 * Extend this as the tree grows real states.
 */
export function resolveAuroraHeadlineVMState(itemCount: number, progress: number): AuroraHeadlineVMState {
  if (itemCount === 0) return "empty";
  return progress > 0 ? "active" : "idle";
}

export const AURORA_HEADLINE_EMPTY: AuroraHeadlineVM = {
  state: "empty",
  progress: 0,
  reducedMotion: false,
  eyebrow: null,
  headline: "",
  body: null,
  items: [],
  cta: null,
};
