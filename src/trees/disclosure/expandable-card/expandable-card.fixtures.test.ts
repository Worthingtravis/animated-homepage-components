/**
 * `frameAt` is what the lab's clock drives, so it is the only place a *sequence*
 * of this tree exists. These assertions pin that the sequence is an interaction
 * and not a scrub: it opens, it dwells, it closes, and it ends where it began.
 *
 * The failure being prevented is specific and quiet — a sampler that maps the
 * lab's 0..1 straight onto the morph leaves the panel entering forever, which
 * looks fine in a screenshot and is a state the running component never reaches.
 */

import { describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE, frameAt } from "./expandable-card.fixtures";

const SWEEP = Array.from({ length: 51 }, (_, i) => i / 50);

describe("frameAt", () => {
  it("starts and ends on the browsing state, so the loop does not jump", () => {
    expect(frameAt(0).state).toBe("browsing");
    expect(frameAt(1).state).toBe("browsing");
    expect(frameAt(0).panel).toBeNull();
  });

  it("passes through entering, open and leaving exactly once each", () => {
    const phases = SWEEP.map((p) => frameAt(p).panel?.phase ?? "closed");
    expect(new Set(phases)).toEqual(new Set(["closed", "entering", "open", "leaving"]));
    // The order is the interaction, not just the set of frames.
    const order = phases.filter((phase, index) => phase !== phases[index - 1]);
    expect(order).toEqual(["closed", "entering", "open", "leaving", "closed"]);
  });

  it("stays coherent at every instant", () => {
    for (const p of SWEEP) {
      const vm = frameAt(p);
      expect(vm.progress).toBeGreaterThanOrEqual(0);
      expect(vm.progress).toBeLessThanOrEqual(1);
      if (vm.panel) {
        expect(vm.state).toBe("open");
        // The panel is the card, and the card knows it is the source.
        expect(vm.panel.card.state).toBe("source");
        expect(vm.cards.filter((card) => card.state === "source")).toHaveLength(1);
        expect(vm.cards.every((card) => card.state !== "resting")).toBe(true);
        expect(JSON.stringify(vm.panel.motion)).not.toContain("NaN");
      } else {
        expect(vm.state).toBe("browsing");
        expect(vm.cards.every((card) => card.state === "resting")).toBe(true);
      }
    }
  });

  it("clamps rather than extrapolating outside 0..1", () => {
    expect(frameAt(-3).state).toBe("browsing");
    expect(frameAt(42).state).toBe("browsing");
  });
});

describe("ALL_FIXTURES", () => {
  it("covers the states a leaf must handle", () => {
    const states = new Set(Object.values(ALL_FIXTURES).map((vm) => vm.state));
    expect(states).toEqual(new Set(["browsing", "open", "empty"]));
  });

  it("includes at least one measured morph, or nothing ever exercises the FLIP", () => {
    const measured = Object.values(ALL_FIXTURES).filter((vm) =>
      String(vm.panel?.motion.surface.transform ?? "").includes("translate3d"),
    );
    expect(measured.length).toBeGreaterThan(0);
  });

  it("defaults to the state that has to be good", () => {
    expect(ALL_FIXTURES[DEFAULT_FIXTURE].state).toBe("browsing");
  });
});
