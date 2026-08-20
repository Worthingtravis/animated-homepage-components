/**
 * __TREE_TITLE__ — fixtures.
 *
 * One fixture per visual state, driveable with zero hooks and zero network.
 * These are the *only* inputs the lab uses, and every leaf must survive all of
 * them. Aim for 8+ here (15-20 for complex multi-step trees): idle, active,
 * empty, edge-case content lengths, reduced-motion, and a few frozen instants
 * along the animation.
 */

import { clampProgress, resolve__TREE_PASCAL__State, type __VM_TYPE__ } from "./__TREE__.vm";

const noop = () => {};

const BASE: __VM_TYPE__ = {
  state: "idle",
  progress: 0,
  reducedMotion: false,
  eyebrow: "__TREE_TITLE__",
  headline: "Ship the motion, not the machinery",
  body: "Every leaf on this tree renders from this exact object.",
  items: [
    { id: "one", label: "First", detail: "01" },
    { id: "two", label: "Second", detail: "02" },
    { id: "three", label: "Third", detail: "03" },
  ],
  cta: { label: "See the leaves", href: "#", onActivate: noop },
};

const fixture = (overrides: Partial<__VM_TYPE__>): __VM_TYPE__ => ({ ...BASE, ...overrides });

/**
 * The continuum: a coherent VM at any point on the transport.
 *
 * Keep this in sync with the container — anything the container *derives* from
 * transport (an active index, a state string, a position label) must be derived
 * here too, through the same helpers in the `.vm.ts`. The lab's clock drives
 * this function, so a desync shows up immediately instead of in production.
 *
 * Delete it only for trees with no transport at all.
 */
export function frameAt(progress: number, overrides: Partial<__VM_TYPE__> = {}): __VM_TYPE__ {
  const clamped = clampProgress(progress);
  return fixture({
    progress: clamped,
    state: resolve__TREE_PASCAL__State(BASE.items.length, clamped),
    ...overrides,
  });
}

export const IDLE = frameAt(0);

export const ACTIVE_EARLY = frameAt(0.15);

export const ACTIVE_MID = frameAt(0.5);

export const ACTIVE_LATE = frameAt(0.92);

export const REDUCED_MOTION = frameAt(0.5, { reducedMotion: true });

export const EMPTY = frameAt(0, { state: "empty", items: [], cta: null, body: null });

export const NO_CHROME = frameAt(0.5, { eyebrow: null, body: null, cta: null });

export const LONG_COPY = frameAt(0.4, {
  headline:
    "A headline long enough to wrap onto three lines on a narrow column and still hold its rhythm",
  body: "Body copy that runs long on purpose, because the shortest string is never the one that breaks the layout in production.",
});

export const MANY_ITEMS = frameAt(0.6, {
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
} satisfies Record<string, __VM_TYPE__>;

export type __VM_TYPE__FixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: __VM_TYPE__FixtureName = "Active — mid";
