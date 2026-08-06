/**
 * Aurora Headline — fixtures.
 *
 * One fixture per visual state, driveable with zero hooks and zero network.
 * These are the *only* inputs the lab uses, and every leaf must survive all of
 * them. Aim for 8+ here (15-20 for complex multi-step trees): idle, active,
 * empty, edge-case content lengths, reduced-motion, and a few frozen instants
 * along the animation.
 */

import type { AuroraHeadlineVM } from "./aurora-headline.vm";

const noop = () => {};

const BASE: AuroraHeadlineVM = {
  state: "idle",
  progress: 0,
  reducedMotion: false,
  eyebrow: "Aurora Headline",
  headline: "Ship the motion, not the machinery",
  body: "Every leaf on this tree renders from this exact object.",
  items: [
    { id: "one", label: "First", detail: "01" },
    { id: "two", label: "Second", detail: "02" },
    { id: "three", label: "Third", detail: "03" },
  ],
  cta: { label: "See the leaves", href: "#", onActivate: noop },
};

const fixture = (overrides: Partial<AuroraHeadlineVM>): AuroraHeadlineVM => ({ ...BASE, ...overrides });

export const IDLE = fixture({});

export const ACTIVE_EARLY = fixture({ state: "active", progress: 0.15 });

export const ACTIVE_MID = fixture({ state: "active", progress: 0.5 });

export const ACTIVE_LATE = fixture({ state: "active", progress: 0.92 });

export const REDUCED_MOTION = fixture({ state: "active", progress: 0.5, reducedMotion: true });

export const EMPTY = fixture({ state: "empty", items: [], cta: null, body: null });

export const NO_CHROME = fixture({ eyebrow: null, body: null, cta: null });

export const LONG_COPY = fixture({
  state: "active",
  progress: 0.4,
  headline:
    "A headline long enough to wrap onto three lines on a narrow column and still hold its rhythm",
  body: "Body copy that runs long on purpose, because the shortest string is never the one that breaks the layout in production.",
});

export const MANY_ITEMS = fixture({
  state: "active",
  progress: 0.6,
  items: Array.from({ length: 12 }, (_, i) => ({
    id: `item-${i}`,
    label: `Item ${i + 1}`,
    detail: String(i + 1).padStart(2, "0"),
  })),
});

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Idle": IDLE,
  "Active — early": ACTIVE_EARLY,
  "Active — mid": ACTIVE_MID,
  "Active — late": ACTIVE_LATE,
  "Reduced motion": REDUCED_MOTION,
  "Empty": EMPTY,
  "No chrome": NO_CHROME,
  "Long copy": LONG_COPY,
  "Many items": MANY_ITEMS,
} satisfies Record<string, AuroraHeadlineVM>;

export type AuroraHeadlineVMFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: AuroraHeadlineVMFixtureName = "Active — mid";
