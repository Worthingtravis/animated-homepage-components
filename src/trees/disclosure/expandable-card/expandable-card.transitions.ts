/**
 * Expandable Card — the transition registry.
 *
 * HOW THE PANEL ARRIVES is a separate axis from WHAT IT LOOKS LIKE. This file
 * owns the first; the leaves own the second. Neither imports the other.
 *
 * A transition is a **pure function of an instant**:
 *
 *     (phase, progress, origin, target) → { surface, media, content, backdrop }
 *
 * Not a library, not a keyframe, not a class. Four consequences follow, and all
 * four are why the shared-element morph is written here instead of inside a
 * component:
 *
 *  1. It composes with every leaf, because it never names an element.
 *  2. It is samplable — the lab's clock can park an opening at t=0.35 and every
 *     leaf shows the same frozen frame.
 *  3. It is testable without a DOM. A preset is asserted by calling it.
 *  4. The morph survives having no measurements. `origin` and `target` are both
 *     nullable, because on the server, in a test and on the very first frame
 *     there are no rectangles yet. A preset that needs them degrades to one
 *     that does not — it never renders `NaN` into a transform.
 *
 * ── The FLIP, in one paragraph ─────────────────────────────────────────────
 * The panel is laid out where it finally belongs (`target`), then transformed
 * so that at t=0 it exactly covers the card that opened it (`origin`), and the
 * transform relaxes to identity as t → 1. Nothing is animated from a measured
 * position to a measured position; both ends are known up front and every frame
 * in between is arithmetic. `transformOrigin: "top left"` is load-bearing —
 * with it, the composite is `p ↦ offset + scale·p`, which is one subtraction
 * and one division per axis.
 *
 * The scale is non-uniform (a wide card into a tall panel is not a zoom), so
 * the content inside is counter-scaled to keep its type undistorted. That makes
 * the content wider than the surface early in the opening — which is correct,
 * and which is why a leaf using `morph` must clip its surface (`overflow-hidden`).
 *
 * ── On reduced motion ──────────────────────────────────────────────────────
 * Every preset must collapse to a cut when `reducedMotion` is true. That is
 * enforced in `resolveMotion`, before the preset runs, so a preset cannot
 * forget and a viewer who asked for stillness gets the same cut from every leaf.
 */

import type { CSSProperties } from "react";

import {
  clampProgress,
  type ExpandableCardMotion,
  type ExpandableCardPhase,
  type Rect,
} from "./expandable-card.vm";

export type TransitionInstant = {
  phase: ExpandableCardPhase;
  /** 0..1 through the current opening or closing. 1 is rest. */
  progress: number;
  /** The card's rect when it was pressed. `null` until something measures it. */
  origin: Rect | null;
  /** Where the panel actually landed. `null` until it has mounted once. */
  target: Rect | null;
};

/** The four surfaces a preset may style. All optional; anything omitted is `{}`. */
export type TransitionStyles = {
  surface?: CSSProperties;
  media?: CSSProperties;
  content?: CSSProperties;
  backdrop?: CSSProperties;
};

export type ExpandableCardTransition = {
  name: string;
  label: string;
  description: string;
  /**
   * True when the preset consumes `origin`/`target`. The container only pays
   * for measuring when something is going to read the measurement.
   */
  measured: boolean;
  at: (instant: TransitionInstant) => TransitionStyles;
};

/** Ease-out cubic. Shared so every preset decelerates the same way. */
export function ease(t: number): number {
  const clamped = clampProgress(t);
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * A closing panel runs the same curve backwards.
 *
 * `ease(1 - progress)` rather than `1 - ease(progress)`: mirroring the curve
 * keeps the exit an ease-*in* — it leaves slowly and accelerates away, which is
 * the conventional pairing for a deceleration on the way in. Inverting the
 * output instead would make the panel bolt for the card the instant you pressed
 * close and then crawl the last few pixels.
 */
function phaseT(instant: TransitionInstant): number {
  return instant.phase === "leaving" ? ease(1 - instant.progress) : ease(instant.progress);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Trim float noise out of the style strings so snapshots and diffs stay readable. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function usable(rect: Rect | null): rect is Rect {
  return (
    rect !== null &&
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

/**
 * The core of the shared element, and the one function worth lifting out of
 * this repo on its own.
 *
 * Returns the transform that places a box laid out at `target` on top of
 * `origin` at t=0, relaxing to identity at t=1 — plus the counter-transform for
 * anything inside it that must not stretch.
 *
 * Both rects nullable on purpose: with nothing to measure it reports
 * `matched: false` and the caller falls back to a preset that needs no
 * geometry. It never returns a transform containing `NaN`, which is the way
 * this kind of code usually fails — silently, and only on the first paint.
 */
export function flip(
  origin: Rect | null,
  target: Rect | null,
  t: number,
): { matched: boolean; surface: CSSProperties; content: CSSProperties } {
  if (!usable(origin) || !usable(target)) {
    return { matched: false, surface: {}, content: {} };
  }

  const scaleX = lerp(origin.width / target.width, 1, t);
  const scaleY = lerp(origin.height / target.height, 1, t);
  const dx = lerp(origin.x - target.x, 0, t);
  const dy = lerp(origin.y - target.y, 0, t);

  return {
    matched: true,
    surface: {
      transformOrigin: "top left",
      transform: `translate3d(${round(dx)}px, ${round(dy)}px, 0) scale(${round(scaleX)}, ${round(scaleY)})`,
    },
    content: {
      transformOrigin: "top left",
      // Undo the surface's distortion so type inside the morph is never
      // squashed. Wider than the surface early on — hence `overflow-hidden`.
      transform: `scale(${round(1 / scaleX)}, ${round(1 / scaleY)})`,
    },
  };
}

/* ------------------------------------------------------------------ presets */

const none: ExpandableCardTransition = {
  name: "none",
  label: "Cut",
  description: "No motion at all. The panel is simply there, and gone.",
  measured: false,
  at: () => ({ backdrop: { opacity: 1 } }),
};

const fade: ExpandableCardTransition = {
  name: "fade",
  label: "Fade",
  description:
    "Opacity only. Nothing moves, so nothing can point at the card it came from — the safe default for a dense grid.",
  measured: false,
  at: (instant) => {
    const t = phaseT(instant);
    return { surface: { opacity: t }, backdrop: { opacity: t } };
  },
};

const lift: ExpandableCardTransition = {
  name: "lift",
  label: "Lift",
  description:
    "A short push from 96% at the centre of the viewport. Says 'a thing opened' without claiming which card it was.",
  measured: false,
  at: (instant) => {
    const t = phaseT(instant);
    return {
      surface: {
        opacity: t,
        transform: `translate3d(0, ${round((1 - t) * 16)}px, 0) scale(${round(lerp(0.96, 1, t))})`,
      },
      content: { opacity: t },
      backdrop: { opacity: t },
    };
  },
};

const sheet: ExpandableCardTransition = {
  name: "sheet",
  label: "Sheet",
  description:
    "Rises from the bottom edge. The phone idiom — it reads as a layer over the page rather than a growth out of it.",
  measured: false,
  at: (instant) => {
    const t = phaseT(instant);
    return {
      surface: { transform: `translate3d(0, ${round((1 - t) * 100)}%, 0)` },
      content: { opacity: ease(clampProgress(t * 1.4 - 0.4)) },
      backdrop: { opacity: t },
    };
  },
};

/**
 * The shared element. The card does not open a panel — it *becomes* one.
 *
 * Degrades to `lift` whenever the rects are missing, which is every server
 * render, every test and the first frame of the first opening. That fallback is
 * not a nicety: it is what lets this preset be the default.
 */
const morph: ExpandableCardTransition = {
  name: "morph",
  label: "Morph",
  description:
    "The pressed card grows into the panel — one shared element, measured at both ends. Falls back to Lift when there is nothing to measure.",
  measured: true,
  at: (instant) => {
    const t = phaseT(instant);
    const { matched, surface, content } = flip(instant.origin, instant.target, t);
    if (!matched) return lift.at(instant);

    return {
      surface: {
        ...surface,
        // The box is doing the work; opacity only covers the first instant, so
        // the panel does not flash at full strength before it has moved.
        opacity: round(Math.min(1, t * 4)),
      },
      // The media rides the surface — that is the whole point of a shared
      // element — so it takes no transform of its own, only the crossfade
      // between the card's crop and the panel's.
      media: { opacity: 1 },
      // Detail copy has no counterpart on the card, so it arrives late, inside
      // the counter-scale that keeps it undistorted.
      content: { ...content, opacity: ease(clampProgress(t * 1.6 - 0.6)) },
      backdrop: { opacity: t },
    };
  },
};

export const TRANSITIONS: Record<string, ExpandableCardTransition> = {
  morph,
  lift,
  sheet,
  fade,
  none,
};

export const TRANSITION_NAMES = Object.keys(TRANSITIONS);

export const DEFAULT_TRANSITION = "morph";

export function findTransition(name: string | undefined): ExpandableCardTransition {
  return TRANSITIONS[name ?? DEFAULT_TRANSITION] ?? TRANSITIONS[DEFAULT_TRANSITION];
}

/** The finished, resting styles. What reduced motion gets, and what t=1 is. */
function settled(phase: ExpandableCardPhase): ExpandableCardMotion {
  return {
    phase,
    surface: {},
    media: {},
    content: {},
    backdrop: { opacity: 1 },
    transition: "none",
  };
}

/**
 * Turn an instant into the finished `ExpandableCardMotion` a panel carries.
 *
 * This is the ONLY function the container calls. Reduced motion is handled here
 * — before the preset runs — so no preset can forget it.
 */
export function resolveMotion(
  name: string | undefined,
  instant: TransitionInstant,
  reducedMotion: boolean,
): ExpandableCardMotion {
  if (reducedMotion) return settled(instant.phase);

  const preset = findTransition(name);
  const styles = preset.at(instant);
  return {
    phase: instant.phase,
    surface: styles.surface ?? {},
    media: styles.media ?? {},
    content: styles.content ?? {},
    backdrop: styles.backdrop ?? {},
    transition: preset.name,
  };
}
