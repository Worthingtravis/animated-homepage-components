/**
 * Countdown — fixtures.
 *
 * `sampleAt` is the coherence engine: hand it a remaining duration and the
 * window it sits in, and every field agrees with every other. Every frozen
 * fixture below is one of its samples, so a fixture can never describe a state
 * the running component cannot reach.
 *
 * `frameAt` is the *lab's* view of that engine, and it deserves its own
 * paragraph, because a countdown is the one tree whose sampler cannot be
 * written the obvious way.
 *
 * The lab sweeps `progress` 0 → 1 over `LAB_CYCLE_MS` and then loops. Map that
 * sweep onto a three-day window — the obvious reading of "progress is depletion
 * across the window" — and three days elapse every six seconds. The digits
 * become a blur, and every leaf gets judged on motion it will never actually
 * perform. So the sampler models the shortest honest thing a loop can hold:
 * **one complete countdown per cycle, at 1×.** A second of wall clock is a
 * second of countdown, the seconds tile ticks once per tick, and the run
 * crosses `counting → urgent → expired` on the way past.
 *
 * Long windows stay frozen fixtures, because nobody can watch a day elapse and
 * a component that pretends you can is lying about what it does.
 *
 * Every string here is frozen on purpose. A fixture that called `Date.now()`
 * would render a different clock on every run and the conformance suite would
 * be asserting against weather.
 */

import { LAB_CYCLE_MS } from "@/lib/lab-clock";

import {
  buildCountdownUnits,
  clampProgress,
  COUNTDOWN_UNIT_MS,
  formatRemainingLabel,
  resolveCountdownState,
  type CountdownVM,
} from "./countdown.vm";

const noop = () => {};

const { SECOND, MINUTE, HOUR, DAY } = COUNTDOWN_UNIT_MS;

/** The window every frozen instant below sits in: a three-day drop. */
export const WINDOW_MS = 3 * DAY;

const CHROME = {
  eyebrow: "Drop closes in",
  headline: "Season 3 finale cut",
  body: "Vertical shorts render free until the window closes.",
  deadlineLabel: "Ends Mar 4, 2026 · 6:00 PM PST",
  expiredLabel: "Window closed",
};

/**
 * The coherence engine. `remainingMs` is the truth; `windowMs` is only what the
 * fill is measured against.
 *
 * The urgency threshold scales with the window rather than sitting at a flat
 * hour, so a six-second run reaches `urgent` in its last second and a three-day
 * drop reaches it in its last hour. Without that, every frame of a short window
 * would be urgent and the state would stop meaning anything.
 */
export function sampleAt(
  remainingMs: number,
  windowMs: number = WINDOW_MS,
  overrides: Partial<CountdownVM> = {},
): CountdownVM {
  const remaining = Math.max(0, Math.round(remainingMs));
  const state = resolveCountdownState(remaining, {
    urgentBelowMs: Math.min(HOUR, windowMs / 4),
  });
  const expired = state === "expired";

  return {
    state,
    progress: windowMs > 0 ? clampProgress(1 - remaining / windowMs) : 1,
    reducedMotion: false,
    eyebrow: CHROME.eyebrow,
    headline: CHROME.headline,
    body: CHROME.body,
    units: expired ? [] : buildCountdownUnits(remaining),
    remainingLabel: expired ? null : formatRemainingLabel(remaining),
    deadlineLabel: CHROME.deadlineLabel,
    expiredLabel: CHROME.expiredLabel,
    cta: { label: "Start a render", href: "#", onActivate: noop },
    ...overrides,
  };
}

/**
 * What the lab's clock drives: one whole countdown per cycle, in real time.
 * See the note at the top of this file for why it is not the three-day window.
 */
export function frameAt(progress: number, overrides: Partial<CountdownVM> = {}): CountdownVM {
  const clamped = clampProgress(progress);
  return sampleAt(LAB_CYCLE_MS * (1 - clamped), LAB_CYCLE_MS, overrides);
}

/** A frozen instant in the three-day drop, given as a fraction of it. */
function frameAtWindow(progress: number, overrides: Partial<CountdownVM> = {}): CountdownVM {
  return sampleAt(WINDOW_MS * (1 - clampProgress(progress)), WINDOW_MS, overrides);
}

/** …or given as a remaining duration, which is easier to read. */
function frameWithRemaining(remainingMs: number, overrides: Partial<CountdownVM> = {}): CountdownVM {
  return sampleAt(remainingMs, WINDOW_MS, overrides);
}

export const FRESH = frameAtWindow(0);

export const EARLY = frameAtWindow(0.18);

export const HALFWAY = frameAtWindow(0.5);

/** Days drop out of the split here — the first magnitude change. */
export const UNDER_A_DAY = frameWithRemaining(19 * HOUR + 42 * MINUTE + 7 * SECOND);

/** Hours drop out, and the container flips the state to `urgent`. */
export const FINAL_HOUR = frameWithRemaining(47 * MINUTE + 12 * SECOND);

export const FINAL_MINUTE = frameWithRemaining(58 * SECOND);

/** The tightest frame a leaf has to survive: two digits, both changing. */
export const LAST_TEN_SECONDS = frameWithRemaining(9 * SECOND);

export const EXPIRED = frameAtWindow(1);

/**
 * The window has not opened yet. The clock is real but nothing is depleting, so
 * a leaf must not draw a fill and must not shout.
 */
export const SCHEDULED = frameAtWindow(0, {
  state: resolveCountdownState(WINDOW_MS, { urgentBelowMs: HOUR, started: false }),
  eyebrow: "Opens in",
  remainingLabel: "Opens Mar 1, 2026",
  body: null,
});

/**
 * The honest zero: a surface with no deadline at all. Every leaf must render
 * nothing rather than a fabricated window — this is the fixture that makes the
 * "no clock" mode a passing test instead of a promise.
 */
export const NO_DEADLINE = frameAtWindow(0, {
  state: "none",
  progress: 0,
  units: [],
  remainingLabel: null,
  deadlineLabel: null,
  expiredLabel: null,
  eyebrow: null,
  headline: null,
  body: null,
  cta: null,
});

export const REDUCED_MOTION = frameWithRemaining(47 * MINUTE + 12 * SECOND, {
  reducedMotion: true,
});

/** Reduced motion at rest, too — the calm state must also stop moving. */
export const REDUCED_MOTION_CALM = frameAtWindow(0.5, { reducedMotion: true });

export const NO_CHROME = frameAtWindow(0.4, {
  eyebrow: null,
  headline: null,
  body: null,
  deadlineLabel: null,
  cta: null,
});

export const LONG_COPY = frameAtWindow(0.4, {
  eyebrow: "Free vertical rendering closes in",
  headline:
    "Every short you start before the window closes renders free, keeps its source project, and stays editable afterwards",
  body: "After the deadline the queue reverts to the standard rate and any render already in flight finishes at the free tier — nothing you started is cancelled.",
  deadlineLabel: "Ends Wednesday, March 4, 2026 at 6:00 PM Pacific Standard Time",
});

/**
 * A long window — three digits in the lead column. The layout has to hold when
 * `days` stops being two characters wide.
 */
export const LONG_WINDOW = (() => {
  const remainingMs = 124 * DAY + 6 * HOUR + 3 * MINUTE + 41 * SECOND;
  return {
    ...frameAtWindow(0.1),
    units: buildCountdownUnits(remainingMs),
    remainingLabel: formatRemainingLabel(remainingMs),
    deadlineLabel: "Ends Jul 9, 2026 · 6:00 PM PST",
  } satisfies CountdownVM;
})();

/**
 * A short window with no start instant — nothing to measure a fill against, so
 * `progress` stays 0 and ring-shaped leaves must fall back to digits rather
 * than draw an empty dial and call it full.
 */
export const UNBOUNDED = (() => {
  const remainingMs = 12 * MINUTE + 30 * SECOND;
  return {
    ...frameWithRemaining(remainingMs),
    progress: 0,
    eyebrow: "Time remaining",
    body: null,
  } satisfies CountdownVM;
})();

/** Passive: no action attached. Leaves must render read-only, not fake a button. */
export const PASSIVE = frameAtWindow(0.6, { cta: null });

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Fresh": FRESH,
  "Early": EARLY,
  "Halfway": HALFWAY,
  "Under a day": UNDER_A_DAY,
  "Final hour — urgent": FINAL_HOUR,
  "Final minute": FINAL_MINUTE,
  "Last ten seconds": LAST_TEN_SECONDS,
  "Expired": EXPIRED,
  "Scheduled — not open yet": SCHEDULED,
  "No deadline": NO_DEADLINE,
  "Reduced motion — urgent": REDUCED_MOTION,
  "Reduced motion — calm": REDUCED_MOTION_CALM,
  "No chrome": NO_CHROME,
  "Long copy": LONG_COPY,
  "Long window — 124 days": LONG_WINDOW,
  "Unbounded — no fill": UNBOUNDED,
  "Passive — no CTA": PASSIVE,
} satisfies Record<string, CountdownVM>;

export type CountdownFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: CountdownFixtureName = "Under a day";
