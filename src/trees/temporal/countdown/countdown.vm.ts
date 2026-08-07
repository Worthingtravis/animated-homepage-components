/**
 * Countdown — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * The load-bearing decision, and the reason this tree exists at all:
 *
 *   **The VM carries a deadline that someone else chose, never a clock a leaf
 *   reads.**
 *
 * A countdown is the first thing in a forest of clock-free components that
 * *must* re-render on a tick. That reopens a door the rest of the forest keeps
 * shut — a browser clock a few seconds either side of a boundary deciding a
 * different truth than the one the server rendered. So the split is strict:
 *
 *   - Whoever owns the truth picks `endsAt` (and optionally `startsAt`) from a
 *     single authoritative instant and passes it down.
 *   - The container ticks, and turns the remainder into padded strings and one
 *     explicit `state`.
 *   - A leaf reads strings. It never sees a Date, an epoch, or a remainder, so
 *     it cannot derive which period it is in even by accident.
 *
 * `state: "none"` is the other load-bearing part. A surface with no deadline —
 * an untimed mode, a drop with no close date — renders *nothing*, honestly,
 * rather than a fabricated duration. A timer that invents a window is lying
 * about the whole premise of the thing it sits on.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string.
 *  - Every user action is a callback. A countdown is mostly passive; do not
 *    invent handlers for it.
 *  - Transport (`progress`) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

/**
 * Explicit visual state. Leaves switch on this — never on `units.length` or on
 * comparing a remainder to zero.
 *
 *  - `none`      no deadline exists. Render nothing (or an honest placeholder).
 *  - `scheduled` a deadline exists but its window has not opened yet.
 *  - `counting`  running normally.
 *  - `urgent`    inside the container's urgency threshold. Emphasis, not panic.
 *  - `expired`   the instant has passed. Informational — this tree never settles
 *                anything, and nothing downstream should read `expired` as an
 *                outcome.
 */
export type CountdownState = "none" | "scheduled" | "counting" | "urgent" | "expired";

/** One place on the clock, already split and padded by the container. */
export type CountdownUnit = {
  /** Stable key. Also what a leaf keys a flip/transition on. */
  id: "days" | "hours" | "minutes" | "seconds";
  /** Pre-formatted and zero-padded — `"07"`, `"124"`. Never a number. */
  value: string;
  /** Full label — `"Hours"`. Already pluralised for the value it sits under. */
  label: string;
  /** Compact label for dense layouts — `"h"`. */
  shortLabel: string;
  /**
   * How full this unit is within its own cycle, 0..1 — seconds through a
   * minute, minutes through an hour. Leaves use it for per-unit motion (a flip,
   * a sweep) without ever knowing what time it is.
   */
  fraction: number;
};

export type CountdownVM = {
  /** Explicit visual state. Leaves switch on this. */
  state: CountdownState;

  /**
   * Depletion transport, normalized 0..1 across the whole window — 0 when the
   * window opened, 1 at the deadline. The container drives it from a clock;
   * fixtures pin it so a frame is reproducible.
   *
   * When there is no window to measure against (a deadline handed over without
   * a start), the container reports 0 and leaves lean on `units` instead. A
   * leaf that renders a fill should read `progress`; one that renders digits
   * should not.
   */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** Pre-formatted copy. */
  eyebrow: string | null;
  headline: string | null;
  body: string | null;

  /**
   * The clock, split into the units worth showing at this magnitude. Empty when
   * `state` is `"none"` or `"expired"`. The container decides how many units
   * appear — a leaf renders every one it is handed and no more, which is what
   * lets the same leaf hold a 12-day drop and a 90-second window.
   */
  units: CountdownUnit[];

  /**
   * One-line remaining, pre-formatted — `"7h 12m left"`. For dense chrome, and
   * for the accessible name of a block of digits that reads as gibberish to a
   * screen reader.
   */
  remainingLabel: string | null;

  /**
   * The deadline in words — `"Ends Mar 4, 2026 · 6:00 PM PST"`. Already in the
   * timezone the container decided to speak in. Leaves never call
   * `toLocaleString`.
   */
  deadlineLabel: string | null;

  /** What to say once the instant has passed. Rendered only in `"expired"`. */
  expiredLabel: string | null;

  /** Optional call-to-action. `null` when the tree renders without one. */
  cta: { label: string; href: string; onActivate?: () => void } | null;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER (or in fixtures), never in a leaf.
 * ------------------------------------------------------------------ */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Elapsed fraction of the window. Returns 0 for a window with no measurable
 * length — a deadline handed over without a start has no fill to draw, and
 * guessing one would put a half-full ring on a countdown nobody bounded.
 */
export function windowProgress(
  now: number,
  endsAt: number,
  startsAt: number | null,
): number {
  if (startsAt === null) return 0;
  const span = endsAt - startsAt;
  if (!Number.isFinite(span) || span <= 0) return 1;
  return clampProgress((now - startsAt) / span);
}

/**
 * Which units are worth showing at this magnitude. Dropping days from a
 * 90-second window is the difference between a timer and a dashboard, and it is
 * the container's call so that every leaf agrees about it.
 */
export function significantUnits(remainingMs: number): Array<CountdownUnit["id"]> {
  if (remainingMs >= DAY) return ["days", "hours", "minutes", "seconds"];
  if (remainingMs >= HOUR) return ["hours", "minutes", "seconds"];
  return ["minutes", "seconds"];
}

const UNIT_LABELS: Record<CountdownUnit["id"], { one: string; many: string; short: string }> = {
  days: { one: "Day", many: "Days", short: "d" },
  hours: { one: "Hour", many: "Hours", short: "h" },
  minutes: { one: "Minute", many: "Minutes", short: "m" },
  seconds: { one: "Second", many: "Seconds", short: "s" },
};

const UNIT_MS: Record<CountdownUnit["id"], number> = {
  days: DAY,
  hours: HOUR,
  minutes: MINUTE,
  seconds: SECOND,
};

/** Raw split. Exported because fixtures and tests both want to reason about it. */
export function splitDuration(remainingMs: number): Record<CountdownUnit["id"], number> {
  const total = Math.max(0, Math.floor(remainingMs));
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: Math.floor((total % MINUTE) / SECOND),
  };
}

/**
 * Build the padded units a leaf renders. The largest shown unit is *not* capped
 * to its cycle — a 40-hour window with days suppressed reads `40h`, not `16h`,
 * because a countdown that silently loses a day is worse than a wide column.
 */
export function buildCountdownUnits(
  remainingMs: number,
  ids: Array<CountdownUnit["id"]> = significantUnits(remainingMs),
): CountdownUnit[] {
  const total = Math.max(0, Math.floor(remainingMs));
  const split = splitDuration(total);

  return ids.map((id, index) => {
    const raw = index === 0 ? Math.floor(total / UNIT_MS[id]) : split[id];
    const labels = UNIT_LABELS[id];
    return {
      id,
      value: String(raw).padStart(2, "0"),
      label: raw === 1 ? labels.one : labels.many,
      shortLabel: labels.short,
      fraction: clampProgress((total % UNIT_MS[id]) / UNIT_MS[id]),
    };
  });
}

/** `"7h 12m left"` — the two coarsest units that carry information. */
export function formatRemainingLabel(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs));
  if (total < SECOND) return "Time's up";

  const split = splitDuration(total);
  const parts: string[] = [];
  if (split.days > 0) parts.push(`${split.days}d`);
  if (split.hours > 0) parts.push(`${split.hours}h`);
  if (split.minutes > 0) parts.push(`${split.minutes}m`);
  if (split.seconds > 0) parts.push(`${split.seconds}s`);

  return `${parts.slice(0, 2).join(" ")} left`;
}

/**
 * Collapse the remainder to a discrete state so leaves never branch on numbers.
 * `null` in means no deadline — and that is a first-class answer, not an error.
 */
export function resolveCountdownState(
  remainingMs: number | null,
  options: { urgentBelowMs?: number; started?: boolean } = {},
): CountdownState {
  if (remainingMs === null || !Number.isFinite(remainingMs)) return "none";
  if (remainingMs <= 0) return "expired";
  if (options.started === false) return "scheduled";
  const urgentBelowMs = options.urgentBelowMs ?? HOUR;
  return remainingMs <= urgentBelowMs ? "urgent" : "counting";
}

/** The honest empty. A surface with no deadline renders this, not a zeroed clock. */
export const COUNTDOWN_NONE: CountdownVM = {
  state: "none",
  progress: 0,
  reducedMotion: false,
  eyebrow: null,
  headline: null,
  body: null,
  units: [],
  remainingLabel: null,
  deadlineLabel: null,
  expiredLabel: null,
  cta: null,
};

export const COUNTDOWN_UNIT_MS = { SECOND, MINUTE, HOUR, DAY } as const;
