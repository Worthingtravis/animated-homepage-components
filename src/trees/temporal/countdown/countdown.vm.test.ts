import { describe, expect, it } from "vitest";

import {
  buildCountdownUnits,
  COUNTDOWN_UNIT_MS,
  formatRemainingLabel,
  resolveCountdownState,
  significantUnits,
  splitDuration,
  windowProgress,
} from "./countdown.vm";

const { SECOND, MINUTE, HOUR, DAY } = COUNTDOWN_UNIT_MS;

/**
 * The helpers here are the reason a leaf never sees a number. They run in the
 * container, so this is where the arithmetic gets pinned.
 */
describe("resolveCountdownState", () => {
  it("treats a missing deadline as a first-class answer, not an error", () => {
    expect(resolveCountdownState(null)).toBe("none");
    expect(resolveCountdownState(Number.NaN)).toBe("none");
  });

  it("expires at and past zero", () => {
    expect(resolveCountdownState(0)).toBe("expired");
    expect(resolveCountdownState(-5 * MINUTE)).toBe("expired");
  });

  it("flips to urgent inside the threshold", () => {
    expect(resolveCountdownState(2 * HOUR)).toBe("counting");
    expect(resolveCountdownState(30 * MINUTE)).toBe("urgent");
    expect(resolveCountdownState(30 * MINUTE, { urgentBelowMs: MINUTE })).toBe("counting");
  });

  it("reports scheduled before the window opens, even with time on the clock", () => {
    expect(resolveCountdownState(2 * HOUR, { started: false })).toBe("scheduled");
  });

  it("still expires an unopened window rather than claiming it is scheduled", () => {
    expect(resolveCountdownState(-1, { started: false })).toBe("expired");
  });
});

describe("windowProgress", () => {
  it("is 0 for a window with no start — nothing to measure against", () => {
    expect(windowProgress(1_000, 5_000, null)).toBe(0);
  });

  it("runs 0 → 1 across the window", () => {
    expect(windowProgress(0, 100, 0)).toBe(0);
    expect(windowProgress(50, 100, 0)).toBe(0.5);
    expect(windowProgress(100, 100, 0)).toBe(1);
  });

  it("clamps outside the window instead of overshooting a fill", () => {
    expect(windowProgress(-50, 100, 0)).toBe(0);
    expect(windowProgress(500, 100, 0)).toBe(1);
  });

  it("treats a zero-length window as finished", () => {
    expect(windowProgress(10, 10, 10)).toBe(1);
  });
});

describe("splitDuration / significantUnits", () => {
  it("splits a remainder into whole units", () => {
    const split = splitDuration(2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND);
    expect(split).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("never goes negative", () => {
    expect(splitDuration(-10_000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("drops magnitudes that are not carrying information", () => {
    expect(significantUnits(2 * DAY)).toEqual(["days", "hours", "minutes", "seconds"]);
    expect(significantUnits(5 * HOUR)).toEqual(["hours", "minutes", "seconds"]);
    expect(significantUnits(90 * SECOND)).toEqual(["minutes", "seconds"]);
  });
});

describe("buildCountdownUnits", () => {
  it("pads every value to two characters", () => {
    const units = buildCountdownUnits(5 * HOUR + 3 * MINUTE + 7 * SECOND);
    expect(units.map((unit) => unit.value)).toEqual(["05", "03", "07"]);
  });

  it("pluralises the label against the value it sits under", () => {
    const units = buildCountdownUnits(HOUR + MINUTE + SECOND);
    expect(units.map((unit) => unit.label)).toEqual(["Hour", "Minute", "Second"]);
  });

  /*
   * The rule that keeps a countdown from silently losing a day: the leading
   * unit accumulates everything above it rather than wrapping at its cycle.
   */
  it("does not wrap the leading unit", () => {
    const units = buildCountdownUnits(40 * HOUR, ["hours", "minutes", "seconds"]);
    expect(units[0].value).toBe("40");
  });

  it("carries each unit's own cycle phase, bounded to 0..1", () => {
    const units = buildCountdownUnits(90 * SECOND);
    for (const unit of units) {
      expect(unit.fraction).toBeGreaterThanOrEqual(0);
      expect(unit.fraction).toBeLessThanOrEqual(1);
    }
  });

  it("returns zeroed units rather than NaN for a passed deadline", () => {
    const units = buildCountdownUnits(-1);
    expect(units.every((unit) => unit.value === "00")).toBe(true);
    expect(units.every((unit) => Number.isFinite(unit.fraction))).toBe(true);
  });
});

describe("formatRemainingLabel", () => {
  it("keeps the two coarsest units that carry information", () => {
    expect(formatRemainingLabel(2 * DAY + 3 * HOUR + 4 * MINUTE)).toBe("2d 3h left");
    expect(formatRemainingLabel(7 * HOUR + 12 * MINUTE + 30 * SECOND)).toBe("7h 12m left");
    expect(formatRemainingLabel(45 * SECOND)).toBe("45s left");
  });

  it("skips empty magnitudes instead of printing zeroes", () => {
    expect(formatRemainingLabel(3 * DAY + 4 * MINUTE)).toBe("3d 4m left");
  });

  it("says so at zero", () => {
    expect(formatRemainingLabel(0)).toBe("Time's up");
    expect(formatRemainingLabel(-1)).toBe("Time's up");
  });
});
