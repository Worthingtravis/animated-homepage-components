/**
 * Section Tabs — the transition registry.
 *
 * HOW A PANEL CHANGES is a separate axis from HOW THE TABS LOOK. This file owns
 * the first; the leaves own the second. Neither imports the other.
 *
 * A transition is a **pure function of an instant**:
 *
 *     (phase, progress, direction, reducedMotion) → CSSProperties
 *
 * Not a CSS class, not a keyframe, not a library. Three consequences follow,
 * and all three are the reason it is shaped this way:
 *
 *  1. It composes with every leaf, because it never names an element.
 *  2. It is samplable — the lab's clock can park a change at t=0.35 and every
 *     leaf shows the same frozen frame, which is how you catch a leaf that
 *     disagrees with its siblings about what instant it is.
 *  3. It is testable without a DOM. A preset is asserted by calling it.
 *
 * Adding one is adding an entry to `TRANSITIONS`. Nothing else changes — no
 * leaf, no VM field, no container branch.
 *
 * ── On reduced motion ──────────────────────────────────────────────────────
 * Every preset must collapse to a cut (or at most an opacity change) when
 * `reducedMotion` is true. That is enforced here rather than left to each
 * preset's conscience: `resolveMotion` short-circuits before the preset runs.
 * A preset therefore cannot forget.
 */

import type { CSSProperties } from "react";

import { clampProgress, type SectionTabsMotion, type SectionTabsPanelPhase } from "./section-tabs.vm";

export type TransitionInstant = {
  phase: SectionTabsPanelPhase;
  /** 0..1 through the current change. 1 is rest. */
  progress: number;
  /** `1` forward, `-1` back, `0` at rest. */
  direction: -1 | 0 | 1;
};

export type SectionTabsTransition = {
  name: string;
  label: string;
  description: string;
  /**
   * True when a leaving panel must stay mounted for the effect to read. A
   * crossfade needs both panels; a hard cut needs neither.
   */
  overlaps: boolean;
  at: (instant: TransitionInstant) => CSSProperties;
};

/** Ease-out cubic. Shared so every preset decelerates the same way. */
function ease(t: number): number {
  const clamped = clampProgress(t);
  return 1 - Math.pow(1 - clamped, 3);
}

/** A leaving panel runs the same curve backwards. */
function phaseT(instant: TransitionInstant): number {
  const t = ease(instant.progress);
  return instant.phase === "leaving" ? 1 - t : t;
}

function hidden(): CSSProperties {
  return { opacity: 0, visibility: "hidden", pointerEvents: "none" };
}

const none: SectionTabsTransition = {
  name: "none",
  label: "Cut",
  description: "No motion at all. The new panel is simply there.",
  overlaps: false,
  at: ({ phase }) => (phase === "active" || phase === "entering" ? {} : hidden()),
};

const fade: SectionTabsTransition = {
  name: "fade",
  label: "Fade",
  description: "Opacity only. The safest default and the one reduced motion falls back to.",
  overlaps: true,
  at: (instant) => {
    if (instant.phase === "hidden") return hidden();
    return { opacity: phaseT(instant) };
  },
};

const slideX: SectionTabsTransition = {
  name: "slide-x",
  label: "Slide across",
  description:
    "Horizontal travel that follows the direction you moved. Reads as a filmstrip of tabs.",
  overlaps: true,
  at: (instant) => {
    if (instant.phase === "hidden") return hidden();
    const t = phaseT(instant);
    // A leaving panel exits the way the incoming one arrives from, so the pair
    // travels together instead of passing through each other.
    const sign = instant.direction === 0 ? 1 : instant.direction;
    const away = instant.phase === "leaving" ? -sign : sign;
    return {
      opacity: t,
      transform: `translate3d(${(1 - t) * away * 24}px, 0, 0)`,
    };
  },
};

const slideY: SectionTabsTransition = {
  name: "slide-y",
  label: "Slide up",
  description: "Vertical travel. Pairs well with a side rail, where horizontal reads as wrong.",
  overlaps: true,
  at: (instant) => {
    if (instant.phase === "hidden") return hidden();
    const t = phaseT(instant);
    const away = instant.phase === "leaving" ? -1 : 1;
    return {
      opacity: t,
      transform: `translate3d(0, ${(1 - t) * away * 16}px, 0)`,
    };
  },
};

const scale: SectionTabsTransition = {
  name: "scale",
  label: "Scale in",
  description: "A short push from 96%. Draws the eye to the panel rather than to the tab.",
  overlaps: false,
  at: (instant) => {
    if (instant.phase === "hidden") return hidden();
    const t = phaseT(instant);
    return {
      opacity: t,
      transform: `scale(${(0.96 + t * 0.04).toFixed(4)})`,
    };
  },
};

const lift: SectionTabsTransition = {
  name: "lift",
  label: "Lift",
  description: "Rise and settle with a brief blur. The most editorial of the presets.",
  overlaps: false,
  at: (instant) => {
    if (instant.phase === "hidden") return hidden();
    const t = phaseT(instant);
    const blur = ((1 - t) * 6).toFixed(2);
    return {
      opacity: t,
      transform: `translate3d(0, ${((1 - t) * 20).toFixed(2)}px, 0)`,
      filter: `blur(${blur}px)`,
    };
  },
};

export const TRANSITIONS: Record<string, SectionTabsTransition> = {
  none: none,
  fade,
  "slide-x": slideX,
  "slide-y": slideY,
  scale,
  lift,
};

export const TRANSITION_NAMES = Object.keys(TRANSITIONS);

export const DEFAULT_TRANSITION = "fade";

export function findTransition(name: string | undefined): SectionTabsTransition {
  return TRANSITIONS[name ?? DEFAULT_TRANSITION] ?? TRANSITIONS[DEFAULT_TRANSITION];
}

/**
 * Turn an instant into the finished `SectionTabsMotion` a panel carries.
 *
 * This is the ONLY function the container calls. Reduced motion is handled
 * here — before the preset runs — so no preset can forget it, and so a viewer
 * who asked for stillness gets the same hard cut from every leaf.
 */
export function resolveMotion(
  name: string | undefined,
  instant: TransitionInstant,
  reducedMotion: boolean,
): SectionTabsMotion {
  const preset = findTransition(name);
  if (reducedMotion) {
    return {
      phase: instant.phase,
      style: none.at({ ...instant, progress: 1 }),
      transition: "none",
    };
  }
  return {
    phase: instant.phase,
    style: preset.at(instant),
    transition: preset.name,
  };
}
