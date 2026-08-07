import { describe, expect, it } from "vitest";

import { LAB_CYCLE_MS } from "@/lib/lab-clock";

import { ALL_FIXTURES, frameAt, sampleAt, WINDOW_MS } from "./countdown.fixtures";
import { COUNTDOWN_UNIT_MS } from "./countdown.vm";

const { SECOND } = COUNTDOWN_UNIT_MS;

/** Rebuild the remaining duration a frame is showing, from its own fields. */
function remainingMsOf(progress: number, windowMs: number): number {
  return Math.round(windowMs * (1 - progress));
}

/*
 * The regression this file exists for: `frameAt` once mapped the lab's
 * six-second sweep onto the three-day window, so the lab ran the countdown at
 * roughly forty thousand times real speed and every leaf was judged on motion
 * it will never perform. The rate is now part of the contract.
 */
describe("frameAt plays at 1×", () => {
  it("spends one second of countdown per second of lab clock", () => {
    const oneSecondOfCycle = SECOND / LAB_CYCLE_MS;

    const before = frameAt(0.25);
    const after = frameAt(0.25 + oneSecondOfCycle);

    const elapsed =
      remainingMsOf(before.progress, LAB_CYCLE_MS) -
      remainingMsOf(after.progress, LAB_CYCLE_MS);

    expect(elapsed).toBeCloseTo(SECOND, -1);
  });

  it("burns exactly one cycle's worth of countdown across a full sweep", () => {
    const start = remainingMsOf(frameAt(0).progress, LAB_CYCLE_MS);
    const end = remainingMsOf(frameAt(1).progress, LAB_CYCLE_MS);
    expect(start - end).toBe(LAB_CYCLE_MS);
  });

  it("changes the seconds digit at most once per second of wall clock", () => {
    const seen = new Set<string>();
    // Sample every 100ms of the cycle — a rAF-driven lab samples far denser
    // than this, and a blurring clock would show far more than 7 values.
    for (let ms = 0; ms <= LAB_CYCLE_MS; ms += 100) {
      const seconds = frameAt(ms / LAB_CYCLE_MS).units.find((unit) => unit.id === "seconds");
      if (seconds) seen.add(seconds.value);
    }
    expect(seen.size).toBeLessThanOrEqual(LAB_CYCLE_MS / SECOND + 1);
  });
});

describe("frameAt still crosses every state on the way past", () => {
  it("starts counting, reaches urgent, and expires", () => {
    expect(frameAt(0).state).toBe("counting");
    expect(frameAt(0.95).state).toBe("urgent");
    expect(frameAt(1).state).toBe("expired");
  });

  it("drops its digits only once expired", () => {
    expect(frameAt(0.5).units.length).toBeGreaterThan(0);
    expect(frameAt(1).units).toHaveLength(0);
  });
});

describe("the frozen fixtures still describe the long drop", () => {
  it("keeps its own three-day window, unaffected by the lab's rate", () => {
    expect(WINDOW_MS).toBeGreaterThan(LAB_CYCLE_MS);
    expect(ALL_FIXTURES["Fresh"].progress).toBe(0);
    expect(ALL_FIXTURES["Under a day"].units.map((unit) => unit.value)).toEqual([
      "19",
      "42",
      "07",
    ]);
  });

  /*
   * Both samplers run through `sampleAt`, which is what stops the two windows
   * from drifting into two different notions of "coherent".
   */
  it("agrees with the sampler every fixture was built from", () => {
    const vm = ALL_FIXTURES["Final hour — urgent"];
    const rebuilt = sampleAt(remainingMsOf(vm.progress, WINDOW_MS), WINDOW_MS);
    expect(rebuilt.units).toEqual(vm.units);
    expect(rebuilt.state).toBe(vm.state);
    expect(rebuilt.remainingLabel).toBe(vm.remainingLabel);
  });

  it("scales urgency to the window, so a short run is not urgent throughout", () => {
    expect(sampleAt(30 * SECOND, 10 * SECOND).state).toBe("counting");
    expect(sampleAt(2 * SECOND, 10 * SECOND).state).toBe("urgent");
  });
});
