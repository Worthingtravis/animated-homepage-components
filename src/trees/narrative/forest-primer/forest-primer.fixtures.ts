/**
 * Forest Primer — fixtures.
 *
 * Frozen instants (the buttons in the lab) plus `frameAt`, a pure function that
 * produces a *coherent* VM at any point on the transport. `frameAt` is what the
 * lab's clock drives — overriding `progress` alone would desync it from
 * `activeIndex` and from every chapter's own `position`, which is exactly the
 * bug this contract exists to prevent.
 *
 * ── Why these fixtures do not read the real FOREST ─────────────────────────
 * They cannot: `src/trees/generated.ts` imports this file, so importing it back
 * is a cycle whose symptom is an undefined registry at module-init time. The
 * numbers in the primer are derived from the real forest in the CONTAINER,
 * which is where they belong anyway. What lives here is a *miniature* forest —
 * the same shape, deliberately smaller — put through the same `summarizeForest`
 * and `buildChapters` the container uses, so a fixture can never describe a
 * primer the running page could not produce.
 */

import {
  buildChapters,
  clampProgress,
  formatPositionLabel,
  resolveChapterCursor,
  resolveForestPrimerState,
  settleChapters,
  PRIMER_CHAPTER_COUNT,
  summarizeForest,
  type ForestPrimerVM,
  type ForestSummary,
  type PrimerForestLike,
  PRIMER_BODY,
  PRIMER_CLOSING,
  PRIMER_EYEBROW,
  PRIMER_HEADLINE,
} from "./forest-primer.vm";

/** Build a species for the miniature forest. Shape only — no components. */
function species(
  key: string,
  label: string,
  trees: Array<{
    key: string;
    label: string;
    fixtures: number;
    branches: Array<{ key: string; leaves: string[] }>;
  }>,
) {
  return {
    key,
    meta: { label },
    trees: trees.map((tree) => ({
      key: tree.key,
      species: key,
      meta: { label: tree.label },
      fixtures: Object.fromEntries(
        Array.from({ length: tree.fixtures }, (_, i) => [`fixture-${i}`, {}]),
      ),
      branches: tree.branches.map((branch) => ({
        key: branch.key,
        leaves: branch.leaves.map((leaf) => ({ key: leaf })),
      })),
    })),
  };
}

/**
 * A miniature of this repository. The tree refs are real, because chapter 3
 * resolves its transports against whatever forest it is handed and silently
 * drops the ones that are not there — a behaviour worth exercising rather than
 * assuming.
 */
const SAMPLE_FOREST: PrimerForestLike = [
  species("commerce", "Commerce", [
    {
      key: "product-card",
      label: "Product Card",
      fixtures: 11,
      branches: [
        { key: "canon", leaves: ["spec-shelf", "detail-row"] },
        { key: "experimental", leaves: ["price-tag"] },
      ],
    },
  ]),
  species("disclosure", "Disclosure", [
    {
      key: "expandable-card",
      label: "Expandable Card",
      fixtures: 10,
      branches: [
        { key: "canon", leaves: ["media-grid", "row-list", "inline-detail"] },
        { key: "experimental", leaves: ["full-bleed"] },
      ],
    },
  ]),
  species("landing", "Landing", [
    {
      key: "channel-hero",
      label: "Channel Hero",
      fixtures: 9,
      branches: [
        { key: "canon", leaves: ["split-dock", "stacked-billboard"] },
        { key: "broadcast", leaves: ["live-marquee"] },
      ],
    },
  ]),
  species("narrative", "Narrative", [
    {
      key: "forest-primer",
      label: "Forest Primer",
      fixtures: 13,
      branches: [{ key: "canon", leaves: ["chaptered"] }],
    },
    {
      key: "step-reveal",
      label: "Step Reveal",
      fixtures: 13,
      branches: [
        { key: "canon", leaves: ["numbered-rail", "wide-cards"] },
        { key: "experimental", leaves: ["stage-swap"] },
      ],
    },
  ]),
  species("temporal", "Temporal", [
    {
      key: "countdown",
      label: "Countdown",
      fixtures: 12,
      branches: [
        { key: "canon", leaves: ["unit-blocks", "inline-strip", "ring-dial"] },
        { key: "experimental", leaves: ["flip-stack"] },
      ],
    },
  ]),
  species("chrome", "Chrome", [
    {
      key: "section-tabs",
      label: "Section Tabs",
      fixtures: 10,
      branches: [
        { key: "canon", leaves: ["top-track", "side-rail", "popover-menu"] },
        { key: "experimental", leaves: ["hover-dock"] },
      ],
    },
  ]),
];

const SAMPLE_SUMMARY = summarizeForest(SAMPLE_FOREST, {
  preferred: { species: "narrative", tree: "forest-primer" },
  presetCount: 5,
});

const CHROME = {
  eyebrow: PRIMER_EYEBROW,
  headline: PRIMER_HEADLINE,
  body: PRIMER_BODY,
  closingLine: PRIMER_CLOSING,
};

/**
 * The continuum, for an arbitrary summary. The container calls the same three
 * helpers in the same order; everything below is a frozen sample of it.
 */
export function frameFor(
  summary: ForestSummary,
  progress: number,
  overrides: Partial<ForestPrimerVM> = {},
): ForestPrimerVM {
  const clamped = clampProgress(progress);
  const cursor = resolveChapterCursor(clamped, PRIMER_CHAPTER_COUNT);
  const chapters = buildChapters(summary, cursor);
  return {
    state: resolveForestPrimerState(chapters.length, clamped),
    progress: clamped,
    reducedMotion: false,
    ...CHROME,
    chapters,
    activeIndex: cursor.activeIndex,
    positionLabel: formatPositionLabel(cursor.activeIndex, chapters.length),
    ...overrides,
  };
}

/** The sampler the lab's clock drives. */
export function frameAt(progress: number, overrides: Partial<ForestPrimerVM> = {}): ForestPrimerVM {
  return frameFor(SAMPLE_SUMMARY, progress, overrides);
}

export const IDLE = frameAt(0);

export const CHAPTER_ONE = frameAt(0.08);

export const CHAPTER_TWO = frameAt(0.26);

export const CHAPTER_THREE = frameAt(0.42);

export const CHAPTER_FOUR = frameAt(0.6);

export const CHAPTER_FIVE = frameAt(0.78);

export const CHAPTER_SIX = frameAt(0.93);

export const SETTLED = frameAt(1);

/**
 * Reduced motion is not a slower primer — it is a primer that already arrived.
 * Every chapter active, every chapter at 1, nothing waiting to be scrolled into
 * existence. Same resolution the container reaches.
 */
export const REDUCED_MOTION = frameAt(1, {
  reducedMotion: true,
  chapters: settleChapters(SETTLED.chapters),
});

/** Missing optionals: no eyebrow, no standfirst, no closing line. */
export const NO_CHROME = frameAt(0.42, { eyebrow: null, body: null, closingLine: null });

export const LONG_COPY = frameAt(0.42, {
  headline:
    "How this forest is put together, and why the folder layout is doing more work than it looks like it is doing",
  body:
    "Six chapters, and one rule underneath all of them: a leaf owns nothing — no state, no " +
    "fetches, no formatting, no opinion about what time it is — which is the only reason any " +
    "leaf on a tree can be swapped for any other leaf on that tree without a single other " +
    "line changing anywhere in the application that renders it.",
  positionLabel: "Chapter 3 of 6 — the one about the clock",
});

/** A forest with many more species and leaves — chapter 5's grids get wide. */
export const WIDE_FOREST = (() => {
  const wide: PrimerForestLike = [
    ...SAMPLE_FOREST,
    ...Array.from({ length: 6 }, (_, i) =>
      species(`species-${i}`, `Species ${i + 1}`, [
        {
          key: `tree-${i}`,
          label: `Tree ${i + 1}`,
          fixtures: 8 + i,
          branches: [
            { key: "canon", leaves: ["one", "two", "three"] },
            { key: "experimental", leaves: ["four"] },
          ],
        },
      ]),
    ),
  ];
  return frameFor(summarizeForest(wide, { presetCount: 5 }), 0.78);
})();

/**
 * The forest with nothing in it. Every derived list empties, the example path
 * falls back to its placeholder form, and the primer still renders six
 * chapters — because the primer explains an architecture, not an inventory.
 */
export const EMPTY_FOREST = frameFor(summarizeForest([], { presetCount: 5 }), 0.42);

/** No chapters at all. The one state where a leaf renders nothing structural. */
export const EMPTY = frameAt(0, {
  state: "empty",
  chapters: [],
  activeIndex: -1,
  positionLabel: null,
  body: null,
  closingLine: null,
});

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Nothing entered": IDLE,
  "Chapter 1 — levels": CHAPTER_ONE,
  "Chapter 2 — the split": CHAPTER_TWO,
  "Chapter 3 — transport": CHAPTER_THREE,
  "Chapter 4 — formatting": CHAPTER_FOUR,
  "Chapter 5 — proof": CHAPTER_FIVE,
  "Chapter 6 — derived": CHAPTER_SIX,
  "Settled": SETTLED,
  "Reduced motion": REDUCED_MOTION,
  "No chrome": NO_CHROME,
  "Long copy": LONG_COPY,
  "Wide forest": WIDE_FOREST,
  "Empty forest": EMPTY_FOREST,
  "Empty": EMPTY,
} satisfies Record<string, ForestPrimerVM>;

export type ForestPrimerFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: ForestPrimerFixtureName = "Chapter 3 — transport";
