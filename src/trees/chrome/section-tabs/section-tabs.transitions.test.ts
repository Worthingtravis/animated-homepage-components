/**
 * The transition registry is a set of pure functions, so it is tested by
 * calling them. No DOM, no render, no leaf.
 *
 * What matters here is the property every preset shares, not the exact curve of
 * any one of them: a preset that violates these is a preset that will look
 * broken in some leaf, and there is no leaf-level test that would catch it.
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_TRANSITION,
  TRANSITIONS,
  findTransition,
  resolveMotion,
} from "./section-tabs.transitions";

const PRESETS = Object.values(TRANSITIONS);
const NAMES = Object.keys(TRANSITIONS);

describe("every preset", () => {
  it.each(PRESETS.map((preset) => [preset.name, preset] as const))(
    "%s hides a hidden panel",
    (_name, preset) => {
      const style = preset.at({ phase: "hidden", progress: 1, direction: 0 });
      expect(style.opacity).toBe(0);
    },
  );

  it.each(PRESETS.map((preset) => [preset.name, preset] as const))(
    "%s leaves a settled panel fully visible and untransformed",
    (_name, preset) => {
      const style = preset.at({ phase: "active", progress: 1, direction: 1 });
      // At rest the panel must be exactly where it will live. A preset that
      // parks at 0.99 opacity or a sub-pixel offset produces a permanently
      // blurry panel that nobody can point at a cause for.
      expect(style.opacity ?? 1).toBe(1);
      if (style.transform) {
        // Identity, however each preset spells zero.
        expect(style.transform).toMatch(/^translate3d\(0(?:\.0+)?(?:px)?, 0(?:\.0+)?(?:px)?, 0\)$|^scale\(1(?:\.0+)?\)$/);
      }
      if (style.filter) expect(style.filter).toBe("blur(0.00px)");
    },
  );

  it.each(PRESETS.map((preset) => [preset.name, preset] as const))(
    "%s starts an entering panel somewhere other than its resting place",
    (_name, preset) => {
      const start = preset.at({ phase: "entering", progress: 0, direction: 1 });
      const end = preset.at({ phase: "active", progress: 1, direction: 1 });
      if (preset.name === "none") {
        expect(start).toEqual(end);
        return;
      }
      expect(start).not.toEqual(end);
    },
  );

  it.each(PRESETS.map((preset) => [preset.name, preset] as const))(
    "%s runs a leaving panel backwards along the same curve",
    (_name, preset) => {
      if (preset.name === "none") return;
      // The pair is complementary at every instant, which is what makes a
      // crossfade hold a constant total brightness instead of dipping through
      // a visible dark frame at the midpoint.
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        const entering = Number(preset.at({ phase: "entering", progress, direction: 1 }).opacity);
        const leaving = Number(preset.at({ phase: "leaving", progress, direction: 1 }).opacity);
        expect(entering + leaving).toBeCloseTo(1, 6);
      }
      // And it starts where the entering panel ends: fully present.
      expect(Number(preset.at({ phase: "leaving", progress: 0, direction: 1 }).opacity)).toBe(1);
    },
  );
});

describe("direction", () => {
  it("slide-x travels the opposite way when the direction flips", () => {
    const forward = TRANSITIONS["slide-x"]!.at({ phase: "entering", progress: 0, direction: 1 });
    const back = TRANSITIONS["slide-x"]!.at({ phase: "entering", progress: 0, direction: -1 });
    expect(forward.transform).not.toBe(back.transform);
  });

  it("slide-y ignores direction — it is not a directional preset", () => {
    const forward = TRANSITIONS["slide-y"]!.at({ phase: "entering", progress: 0.3, direction: 1 });
    const back = TRANSITIONS["slide-y"]!.at({ phase: "entering", progress: 0.3, direction: -1 });
    expect(forward).toEqual(back);
  });
});

describe("resolveMotion", () => {
  it("collapses every preset to a cut under reduced motion", () => {
    for (const name of NAMES) {
      const motion = resolveMotion(name, { phase: "entering", progress: 0.2, direction: 1 }, true);
      // Not "the preset behaved itself" — the preset never ran. That is the
      // guarantee: a new preset cannot forget reduced motion.
      expect(motion.transition, name).toBe("none");
      expect(motion.style.transform, name).toBeUndefined();
      expect(motion.style.filter, name).toBeUndefined();
    }
  });

  it("still hides hidden panels under reduced motion", () => {
    const motion = resolveMotion("lift", { phase: "hidden", progress: 1, direction: 0 }, true);
    expect(motion.style.opacity).toBe(0);
  });

  it("reports which preset produced the style", () => {
    const motion = resolveMotion("scale", { phase: "entering", progress: 0.5, direction: 1 }, false);
    expect(motion.transition).toBe("scale");
    expect(motion.phase).toBe("entering");
  });

  it("falls back to the default for an unknown name", () => {
    expect(findTransition("nope").name).toBe(DEFAULT_TRANSITION);
    expect(findTransition(undefined).name).toBe(DEFAULT_TRANSITION);
  });
});
