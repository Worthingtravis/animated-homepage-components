/**
 * Step Reveal — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type. Changing this file changes every leaf; adding a leaf changes nothing.
 *
 * This is a *narrative* tree: its transport is a position in a sequence, not a
 * loop on a clock. The container resolves `progress` into a step index, a
 * within-step fraction, and a per-step state — so no leaf ever compares an index
 * to decide how to render an item.
 */

export type StepRevealState = "idle" | "revealing" | "complete" | "empty";

/** Where a single step sits in the sequence *right now*. Pre-computed. */
export type StepPosition = "past" | "active" | "upcoming";

export type StepRevealStep = {
  id: string;
  /** Pre-formatted ordinal — "01", "02". Never a number a leaf has to pad. */
  ordinal: string;
  title: string;
  description: string;
  /** Pre-formatted aside — "2 min", "Included", "Mar 4". */
  meta: string | null;
  /** Resolved by the container. A leaf switches on this, never on an index. */
  position: StepPosition;
};

export type StepRevealVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: StepRevealState;

  /**
   * Overall transport, 0..1 across the whole sequence. The container drives it
   * from autoplay / scroll / a click; fixtures pin it to a reproducible instant.
   */
  progress: number;

  steps: StepRevealStep[];

  /** Index into `steps`. `-1` when nothing is active yet. */
  activeIndex: number;

  /** Transport *within* the active step, 0..1. Drives per-step reveals. */
  stepProgress: number;

  /** Pre-formatted sequence position — "Step 2 of 4". */
  positionLabel: string | null;

  reducedMotion: boolean;

  eyebrow: string | null;
  headline: string;
  body: string | null;

  /**
   * Present when the sequence is steerable. `null` makes the tree passive —
   * leaves must render read-only rather than inventing a handler.
   */
  onSelectStep: ((index: number) => void) | null;

  cta: { label: string; href: string; onActivate?: () => void } | null;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER or in fixtures, never in a leaf.
 * ------------------------------------------------------------------ */

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function formatOrdinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function formatPositionLabel(activeIndex: number, total: number): string | null {
  if (total === 0 || activeIndex < 0) return null;
  return `Step ${activeIndex + 1} of ${total}`;
}

/** Split overall transport into "which step" and "how far into it". */
export function resolveStepCursor(
  progress: number,
  total: number,
): { activeIndex: number; stepProgress: number } {
  if (total === 0) return { activeIndex: -1, stepProgress: 0 };
  const scaled = clampProgress(progress) * total;
  const activeIndex = Math.min(total - 1, Math.floor(scaled));
  return { activeIndex, stepProgress: scaled - activeIndex };
}

export function resolveStepRevealState(total: number, progress: number): StepRevealState {
  if (total === 0) return "empty";
  if (progress <= 0) return "idle";
  if (progress >= 1) return "complete";
  return "revealing";
}

export function resolvePosition(index: number, activeIndex: number): StepPosition {
  if (index < activeIndex) return "past";
  if (index === activeIndex) return "active";
  return "upcoming";
}

/**
 * The one place a raw step becomes a VM step. Fixtures and the container both
 * go through it, so they can never drift apart.
 */
export function buildSteps(
  raw: Array<{ id: string; title: string; description: string; meta?: string | null }>,
  activeIndex: number,
): StepRevealStep[] {
  return raw.map((step, index) => ({
    id: step.id,
    ordinal: formatOrdinal(index),
    title: step.title,
    description: step.description,
    meta: step.meta ?? null,
    position: resolvePosition(index, activeIndex),
  }));
}

export const STEP_REVEAL_EMPTY: StepRevealVM = {
  state: "empty",
  progress: 0,
  steps: [],
  activeIndex: -1,
  stepProgress: 0,
  positionLabel: null,
  reducedMotion: false,
  eyebrow: null,
  headline: "",
  body: null,
  onSelectStep: null,
  cta: null,
};
