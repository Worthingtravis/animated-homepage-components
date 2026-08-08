/**
 * The morph is arithmetic, so it is tested by calling it — no DOM, no render,
 * no timers. These are the assertions that make the shared element safe to lift
 * out of this repo: take them with the function.
 */

import { describe, expect, it } from "vitest";

import {
  flip,
  resolveMotion,
  TRANSITIONS,
  TRANSITION_NAMES,
  type TransitionInstant,
} from "./expandable-card.transitions";
import type { Rect } from "./expandable-card.vm";

const ORIGIN: Rect = { x: 848, y: 372, width: 288, height: 220 };
const TARGET: Rect = { x: 340, y: 96, width: 600, height: 608 };

/**
 * Pull the numbers out of a transform string. The negative lookbehind matters:
 * without it the `3` in `translate3d` is read as the first argument, and every
 * index below is off by one — which is the sort of test bug that quietly
 * asserts nothing.
 */
function numbers(transform: unknown): number[] {
  return String(transform ?? "")
    .match(/(?<![a-zA-Z0-9])-?\d+(?:\.\d+)?/g)
    ?.map(Number) ?? [];
}

describe("flip", () => {
  it("places the target box exactly over the origin at t=0", () => {
    const { matched, surface } = flip(ORIGIN, TARGET, 0);
    expect(matched).toBe(true);

    // translate3d(dx, dy, 0) scale(sx, sy) — with transform-origin at top left,
    // the composite maps the panel's top-left to the card's top-left and its
    // size to the card's size.
    const [dx, dy, , sx, sy] = numbers(surface.transform);
    expect(dx).toBeCloseTo(ORIGIN.x - TARGET.x);
    expect(dy).toBeCloseTo(ORIGIN.y - TARGET.y);
    // Sub-pixel: the scale factors are rounded to three decimals on the way
    // into the style string, which is a tenth of a pixel on a 600px panel.
    expect(TARGET.width * sx).toBeCloseTo(ORIGIN.width, 0);
    expect(TARGET.height * sy).toBeCloseTo(ORIGIN.height, 0);
    expect(surface.transformOrigin).toBe("top left");
  });

  it("relaxes to identity at t=1", () => {
    const { surface } = flip(ORIGIN, TARGET, 1);
    const [dx, dy, , sx, sy] = numbers(surface.transform);
    expect([dx, dy]).toEqual([0, 0]);
    expect(sx).toBe(1);
    expect(sy).toBe(1);
  });

  it("counter-scales the content by the reciprocal, so type is never distorted", () => {
    const { surface, content } = flip(ORIGIN, TARGET, 0.4);
    const [, , , sx, sy] = numbers(surface.transform);
    const [cx, cy] = numbers(content.transform);
    expect(cx * sx).toBeCloseTo(1, 2);
    expect(cy * sy).toBeCloseTo(1, 2);
  });

  it("reports no match rather than emitting NaN when a rect is missing", () => {
    for (const args of [
      [null, TARGET],
      [ORIGIN, null],
      [null, null],
      [ORIGIN, { ...TARGET, width: 0 }],
      [{ ...ORIGIN, x: Number.NaN }, TARGET],
    ] as const) {
      const result = flip(args[0], args[1], 0.5);
      expect(result.matched).toBe(false);
      expect(result.surface).toEqual({});
    }
  });
});

describe("presets", () => {
  const instants: TransitionInstant[] = [];
  for (const phase of ["entering", "open", "leaving"] as const) {
    for (const progress of [0, 0.001, 0.35, 0.5, 0.999, 1]) {
      for (const [origin, target] of [
        [null, null],
        [ORIGIN, TARGET],
        [ORIGIN, null],
      ] as const) {
        instants.push({ phase, progress, origin, target });
      }
    }
  }

  it.each(TRANSITION_NAMES)("%s never produces NaN, for any instant", (name) => {
    for (const instant of instants) {
      const motion = resolveMotion(name, instant, false);
      const rendered = JSON.stringify([
        motion.surface,
        motion.media,
        motion.content,
        motion.backdrop,
      ]);
      expect(rendered, `${name} @ ${instant.phase} ${instant.progress}`).not.toContain("NaN");
    }
  });

  it("morph falls back to lift when there is nothing to measure", () => {
    const instant: TransitionInstant = {
      phase: "entering",
      progress: 0.4,
      origin: null,
      target: null,
    };
    expect(TRANSITIONS.morph.at(instant)).toEqual(TRANSITIONS.lift.at(instant));
  });

  it("runs a closing panel backwards through the same curve", () => {
    const shared = { progress: 0.3, origin: ORIGIN, target: TARGET } as const;
    const entering = resolveMotion("morph", { ...shared, phase: "entering" }, false);
    const leaving = resolveMotion("morph", { ...shared, phase: "leaving" }, false);
    // Same instant, opposite direction: the exit is further along the morph
    // toward the panel's resting box than the entrance is.
    expect(numbers(leaving.surface.transform)[3]).toBeGreaterThan(
      numbers(entering.surface.transform)[3],
    );
  });

  it("gives reduced motion a cut, whatever the preset and whatever the instant", () => {
    for (const name of TRANSITION_NAMES) {
      const motion = resolveMotion(
        name,
        { phase: "entering", progress: 0.1, origin: ORIGIN, target: TARGET },
        true,
      );
      expect(motion.surface).toEqual({});
      expect(motion.content).toEqual({});
      expect(motion.transition).toBe("none");
      expect(motion.backdrop).toEqual({ opacity: 1 });
    }
  });

  it("falls back to the default preset rather than throwing on an unknown name", () => {
    const motion = resolveMotion(
      "does-not-exist",
      { phase: "entering", progress: 0.5, origin: ORIGIN, target: TARGET },
      false,
    );
    expect(motion.transition).toBe("morph");
  });
});
