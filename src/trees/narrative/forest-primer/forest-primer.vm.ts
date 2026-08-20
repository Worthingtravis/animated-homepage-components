/**
 * Forest Primer — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type. Changing this file changes every leaf; adding a leaf changes nothing.
 *
 * ── What this tree is for ──────────────────────────────────────────────────
 * It is the page that explains this repository's one rule — *everything
 * stateful is physically outside the leaf* — which means it is the one
 * component in the forest that is read as a CLAIM about the forest. So it obeys
 * the rule harder than anything else here:
 *
 *  - Every species name, count, path and ratio in the primer is DERIVED from
 *    `FOREST` in the container and arrives as a finished string. A primer about
 *    derived structure that hardcodes "10 trees" is the exact failure it warns
 *    about, and it fails silently, because a stale number renders perfectly.
 *  - Each chapter arrives with its own `position` and its own `progress`
 *    already decided. A leaf never compares an index, and never compares a
 *    number to a threshold to discover that a chapter is active. Same rule as
 *    `narrative/step-reveal`, for the same reason.
 *  - Each chapter's diagram is PRESENTATION, so the drawing belongs to the
 *    leaf. What the VM carries is a discriminated `figure` — strings, and
 *    counts already turned into strings — never JSX and never a component
 *    reference. `figure.kind` is the switch; the geometry is the leaf's.
 *
 * ── Transport ──────────────────────────────────────────────────────────────
 * `progress` runs 0..1 across the whole primer as it is scrolled through. It is
 * not a loop. The container owns the scroll listener; fixtures freeze it.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string.
 *  - Every user action is a callback.
 *  - Transport (`progress`) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

/**
 * Explicit visual state. Leaves switch on this — never on `chapters.length`.
 *
 *  - `idle`     nothing has been scrolled into existence yet.
 *  - `reading`  the primer is being moved through.
 *  - `settled`  every chapter has arrived. Also what reduced motion resolves to.
 *  - `empty`    there are no chapters. A leaf renders nothing structural.
 */
export type ForestPrimerState = "idle" | "reading" | "settled" | "empty";

/** Where a chapter sits *right now*. Decided by the container, never derived. */
export type ChapterPosition = "past" | "active" | "upcoming";

/* ------------------------------------------------------------------ *
 * Figures — the diagrams, as data.
 *
 * A figure carries strings and counts-already-strings. The leaf owns every
 * rectangle, rule, tick and knob it draws from them.
 * ------------------------------------------------------------------ */

/** One box in chapter 1's nesting drawing, outermost first. */
export type PrimerNestingLevel = {
  id: string;
  /** The vocabulary word — "species", "tree", "branch", "leaf". */
  term: string;
  /** A real name from this repository — "narrative", "forest-primer", "canon". */
  name: string;
  /** The annotation line — what that level owns. */
  note: string;
  /** How many of these exist, pre-formatted: "8 species". Null when unknown. */
  countLabel: string | null;
};

/** One column of chapter 2's split. */
export type PrimerSplitColumn = {
  id: string;
  /** "container" / "contract" / "leaf". */
  title: string;
  /** The filename that identifies it — `"*-connected.tsx"`. */
  file: string;
  /**
   * How the entries read. `allowed` and `carried` are lists of what lives
   * there; `forbidden` is a list of what may not. A leaf styles the three
   * differently — it does not infer the tone from the column's position.
   */
  tone: "allowed" | "carried" | "forbidden";
  entries: string[];
};

/** One transport in chapter 3 — a real tree, and what its `progress` means. */
export type PrimerTransportRow = {
  id: string;
  /** `"temporal/countdown"` — verified present in the forest by the container. */
  ref: string;
  /** The tree's own label, from its `tree.meta.ts`. */
  label: string;
  /** "a depletion toward a deadline". */
  transport: string;
};

/** One struck-through computation and the finished string that replaces it. */
export type PrimerFormattingRow = {
  id: string;
  /** What a leaf must not write — rendered struck through. */
  computed: string;
  /** What arrives instead, verbatim, from the VM. */
  arrives: string;
  /** The one call in the container that makes it. */
  source: string;
};

/** One of chapter 5's two grids. The suite runs two products, not one cube. */
export type PrimerMatrixGrid = {
  id: string;
  /** "every leaf × every fixture". */
  title: string;
  rowLabel: string;
  columnLabel: string;
  /** "412 renders". */
  totalLabel: string;
  /** What that product actually asserts. */
  note: string;
  /**
   * A drawable sample of the grid — one array of cell ids per row, already
   * capped by the container. A leaf may not decide how many cells to draw,
   * because deciding that from a count is arithmetic on a number it was handed.
   */
  cells: string[][];
};

/** One hop in chapter 6's route chain. */
export type PrimerChainLink = {
  id: string;
  /** The route itself — "/lab/narrative/forest-primer". */
  href: string;
  /** What that page IS. */
  caption: string;
};

export type PrimerFigure =
  | { kind: "nesting"; levels: PrimerNestingLevel[]; path: string }
  | { kind: "split"; columns: PrimerSplitColumn[]; obligation: string }
  | {
      kind: "transport";
      valueLabel: string;
      startLabel: string;
      endLabel: string;
      /** The chapter's own progress, printed — "0.42". The knob rides it. */
      knobLabel: string;
      rows: PrimerTransportRow[];
    }
  | { kind: "formatting"; rows: PrimerFormattingRow[] }
  | { kind: "matrix"; grids: PrimerMatrixGrid[] }
  | { kind: "chain"; links: PrimerChainLink[]; source: string; note: string };

export type PrimerFigureKind = PrimerFigure["kind"];

export type ForestPrimerChapter = {
  id: string;
  /** Pre-formatted ordinal — "01". Never a number a leaf has to pad. */
  ordinal: string;
  title: string;
  /** The line under the figure. */
  caption: string;
  /** The sentence set large. Null when the chapter has none. */
  pullQuote: string | null;
  /** Resolved by the container. A leaf switches on this, never on an index. */
  position: ChapterPosition;
  /** This chapter's own transport, 0..1 — 0 upcoming, 1 past, partial active. */
  progress: number;
  figure: PrimerFigure;
};

export type ForestPrimerVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: ForestPrimerState;

  /** Overall transport across the whole primer, 0..1. The container drives it. */
  progress: number;

  /** True when the viewer asked for reduced motion. Every chapter is settled. */
  reducedMotion: boolean;

  eyebrow: string | null;
  headline: string;
  body: string | null;

  chapters: ForestPrimerChapter[];

  /** Index into `chapters`. `-1` when nothing has been reached yet. */
  activeIndex: number;

  /** Pre-formatted — "Chapter 3 of 6". Null when nothing is active. */
  positionLabel: string | null;

  /** The last line. "Nothing to keep in sync." */
  closingLine: string | null;
};

/* ------------------------------------------------------------------ *
 * The forest, summarised.
 *
 * `PrimerForestLike` is a STRUCTURAL type, the same play as `adaptHomeHero`:
 * `SpeciesNode[]` satisfies it, and so does a literal in a fixture, so this
 * file never imports the generated registry — which would be a cycle, since
 * the registry imports this tree's fixtures.
 * ------------------------------------------------------------------ */

export type PrimerTreeLike = {
  key: string;
  species: string;
  meta: { label: string };
  fixtures: Record<string, unknown>;
  branches: Array<{ key: string; leaves: Array<{ key: string }> }>;
};

export type PrimerSpeciesLike = {
  key: string;
  meta: { label: string };
  trees: PrimerTreeLike[];
};

export type PrimerForestLike = readonly PrimerSpeciesLike[];

/** Everything the primer needs to know about the repository it describes. */
export type ForestSummary = {
  speciesCount: number;
  treeCount: number;
  branchCount: number;
  leafCount: number;
  /** Every fixture on every tree, added up. */
  fixtureCount: number;
  /** The widest tree's fixture count — the width chapter 5's first grid draws. */
  maxFixtureCount: number;
  /** Σ over trees of (leaves × that tree's fixtures) — the real render count. */
  bareRenderCount: number;
  /** Editor-mode presets. Not derivable from the forest; the container says. */
  presetCount: number;
  /** A real, existing path to a leaf — the one chapter 1 shows. */
  example: {
    species: string;
    speciesLabel: string;
    tree: string;
    branch: string;
    leaf: string;
    treesInSpecies: number;
  } | null;
  /** `ref -> label`, for the transports chapter 3 lists. */
  treeLabels: Record<string, string>;
};

export const EMPTY_FOREST_SUMMARY: ForestSummary = {
  speciesCount: 0,
  treeCount: 0,
  branchCount: 0,
  leafCount: 0,
  fixtureCount: 0,
  maxFixtureCount: 0,
  bareRenderCount: 0,
  presetCount: 0,
  example: null,
  treeLabels: {},
};

/**
 * Read the forest. Pure, and the only place a number about this repository is
 * produced — so the primer, the stats strip and the nav cannot disagree.
 *
 * `preferred` names the tree the example path should show if it exists. It is a
 * preference and not a requirement: on an empty forest there is no path, and
 * the primer says so rather than inventing one. `presetCount` is the one number
 * the forest cannot answer — it belongs to editor mode — so the caller supplies
 * it rather than this file guessing.
 */
export function summarizeForest(
  forest: PrimerForestLike,
  options: { preferred?: { species: string; tree: string }; presetCount?: number } = {},
): ForestSummary {
  const { preferred, presetCount = 0 } = options;
  const trees = forest.flatMap((species) => species.trees);
  const branches = trees.flatMap((tree) => tree.branches);
  const leafCount = branches.reduce((total, branch) => total + branch.leaves.length, 0);

  const fixtureCounts = trees.map((tree) => Object.keys(tree.fixtures).length);
  const bareRenderCount = trees.reduce((total, tree, index) => {
    const leaves = tree.branches.reduce((sum, branch) => sum + branch.leaves.length, 0);
    return total + leaves * fixtureCounts[index];
  }, 0);

  const treeLabels: Record<string, string> = {};
  for (const tree of trees) treeLabels[`${tree.species}/${tree.key}`] = tree.meta.label;

  const exampleSpecies =
    forest.find(
      (species) =>
        species.key === preferred?.species &&
        species.trees.some((tree) => tree.key === preferred.tree),
    ) ?? forest.find((species) => species.trees.some((tree) => tree.branches.length > 0));

  const exampleTree =
    exampleSpecies?.trees.find((tree) => tree.key === preferred?.tree) ??
    exampleSpecies?.trees.find((tree) => tree.branches.some((b) => b.leaves.length > 0)) ??
    exampleSpecies?.trees[0];

  const exampleBranch =
    exampleTree?.branches.find((branch) => branch.leaves.length > 0) ?? exampleTree?.branches[0];

  return {
    speciesCount: forest.length,
    treeCount: trees.length,
    branchCount: branches.length,
    leafCount,
    fixtureCount: fixtureCounts.reduce((total, count) => total + count, 0),
    maxFixtureCount: fixtureCounts.reduce((most, count) => Math.max(most, count), 0),
    bareRenderCount,
    presetCount,
    example:
      exampleSpecies && exampleTree && exampleBranch && exampleBranch.leaves[0]
        ? {
            species: exampleSpecies.key,
            speciesLabel: exampleSpecies.meta.label,
            tree: exampleTree.key,
            branch: exampleBranch.key,
            leaf: exampleBranch.leaves[0].key,
            treesInSpecies: exampleSpecies.trees.length,
          }
        : null,
    treeLabels,
  };
}

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER or in fixtures, never in a leaf.
 * ------------------------------------------------------------------ */

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function formatOrdinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** `"0.42"`. The printed transport value, so a leaf never formats a number. */
export function formatFraction(value: number): string {
  return clampProgress(value).toFixed(2);
}

/** `"8 species"`, `"1 tree"`. One pluraliser, so two chapters cannot disagree. */
export function countLabel(count: number, singular: string, many = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : many}`;
}

export function formatPositionLabel(activeIndex: number, total: number): string | null {
  if (total === 0 || activeIndex < 0) return null;
  return `Chapter ${activeIndex + 1} of ${total}`;
}

/** Split overall transport into "which chapter" and "how far into it". */
export function resolveChapterCursor(
  progress: number,
  total: number,
): { activeIndex: number; chapterProgress: number } {
  if (total === 0) return { activeIndex: -1, chapterProgress: 0 };
  const scaled = clampProgress(progress) * total;
  const activeIndex = Math.min(total - 1, Math.floor(scaled));
  return { activeIndex, chapterProgress: scaled - activeIndex };
}

export function resolvePosition(index: number, activeIndex: number): ChapterPosition {
  if (index < activeIndex) return "past";
  if (index === activeIndex) return "active";
  return "upcoming";
}

/**
 * A chapter's own transport. Past chapters are finished, upcoming ones have not
 * started, and only the active one is partial — which is why a leaf can animate
 * every chapter with one expression and no comparisons.
 */
export function resolveChapterProgress(
  position: ChapterPosition,
  chapterProgress: number,
): number {
  if (position === "past") return 1;
  if (position === "upcoming") return 0;
  return clampProgress(chapterProgress);
}

export function resolveForestPrimerState(
  chapterCount: number,
  progress: number,
): ForestPrimerState {
  if (chapterCount === 0) return "empty";
  if (progress <= 0) return "idle";
  if (progress >= 1) return "settled";
  return "reading";
}

/* ------------------------------------------------------------------ *
 * The primer's own copy.
 *
 * Settled content — six chapters, no more. The words live here rather than in
 * the container so the fixtures and the running page cannot describe two
 * different primers.
 * ------------------------------------------------------------------ */

export const PRIMER_HEADLINE = "How this forest is put together";

export const PRIMER_EYEBROW = "The primer";

export const PRIMER_BODY =
  "Six chapters, and one rule underneath all of them: a leaf owns nothing, so any leaf can " +
  "replace any other leaf on its tree with no other change.";

export const PRIMER_CLOSING = "Nothing to keep in sync.";

/**
 * Six. Settled content, and exported so the cursor is split by the same number
 * `buildChapters` produces — a container that guessed seven would put the last
 * chapter permanently out of reach, silently.
 */
export const PRIMER_CHAPTER_COUNT = 6;

/**
 * The transports chapter 3 lists — a tree ref and what one unit of its
 * `progress` actually is. Refs are resolved against the real forest, so a tree
 * that is deleted leaves this list instead of lying in it.
 */
export const PRIMER_TRANSPORTS: ReadonlyArray<{ ref: string; transport: string }> = [
  { ref: "landing/channel-hero", transport: "a one-shot entrance" },
  { ref: "temporal/countdown", transport: "a depletion toward a deadline" },
  { ref: "commerce/product-card", transport: "one add-to-bag" },
  { ref: "chrome/section-tabs", transport: "one tab change" },
  { ref: "disclosure/expandable-card", transport: "a single expansion" },
  { ref: "narrative/step-reveal", transport: "a position in a sequence" },
];

/** Chapter 4's rows. Real `commerce/product-card` strings, from its own helpers. */
const FORMATTING_ROWS: PrimerFormattingRow[] = [
  {
    id: "money",
    computed: "price.toFixed(0)",
    arrives: "$199",
    source: 'formatMoney(19_900, "USD")',
  },
  {
    id: "percent",
    computed: "new Intl.NumberFormat(…)",
    arrives: "− 50%",
    source: "percentOffLabel(19_900, 39_900)",
  },
  {
    id: "specs",
    computed: 'dimensions.join(" × ")',
    arrives: "58 × 79 × 60 cm",
    source: 'specLine(specs, "cm")',
  },
];

/** Cap the drawn grid so a leaf is handed cells rather than a number to loop. */
function sampleCells(prefix: string, rows: number, columns: number): string[][] {
  const drawnRows = Math.max(0, Math.min(rows, 7));
  const drawnColumns = Math.max(0, Math.min(columns, 12));
  return Array.from({ length: drawnRows }, (_, row) =>
    Array.from({ length: drawnColumns }, (_, column) => `${prefix}-${row}-${column}`),
  );
}

/**
 * The one place a summary becomes chapters.
 *
 * Fixtures and the container both go through it, so a fixture can never
 * describe a primer the running page could not produce.
 */
export function buildChapters(
  summary: ForestSummary,
  cursor: { activeIndex: number; chapterProgress: number },
): ForestPrimerChapter[] {
  const example = summary.example;
  const examplePath = example
    ? `src/trees/${example.species}/${example.tree}/branches/${example.branch}/${example.leaf}/`
    : "src/trees/<species>/<tree>/branches/<branch>/<leaf>/";

  const transports: PrimerTransportRow[] = PRIMER_TRANSPORTS.flatMap((entry) => {
    const label = summary.treeLabels[entry.ref];
    return label ? [{ id: entry.ref, ref: entry.ref, label, transport: entry.transport }] : [];
  });

  const raw: Array<Omit<ForestPrimerChapter, "ordinal" | "position" | "progress">> = [
    {
      id: "levels",
      title: "The four levels",
      caption:
        "The folder structure IS the architecture. Everything stateful is physically outside " +
        "the leaf, so a leaf cannot own state even by accident.",
      pullQuote: null,
      figure: {
        kind: "nesting",
        path: examplePath,
        levels: [
          {
            id: "species",
            term: "species",
            name: example?.species ?? "<species>",
            note: "a kind of tree — a family of homepage concerns",
            countLabel: countLabel(summary.speciesCount, "species", "species"),
          },
          {
            id: "tree",
            term: "tree",
            name: example?.tree ?? "<tree>",
            note: "the ViewModel contract — the thing every leaf answers",
            countLabel: countLabel(summary.treeCount, "tree"),
          },
          {
            id: "branch",
            term: "branch",
            name: example?.branch ?? "<branch>",
            note: "an aesthetic direction, never a data variation",
            countLabel: countLabel(summary.branchCount, "branch", "branches"),
          },
          {
            id: "leaf",
            term: "leaf",
            name: example?.leaf ?? "<leaf>",
            note: "pure presentation — its props ARE the VM above it",
            countLabel: countLabel(summary.leafCount, "leaf", "leaves"),
          },
        ],
      },
    },
    {
      id: "split",
      title: "The split",
      caption:
        "Three files, three jobs, and the middle one is a type. Swapping the look means " +
        "changing the third column and nothing else.",
      pullQuote: "The first useState in a leaf ends it.",
      figure: {
        kind: "split",
        obligation:
          "And one thing every leaf MUST do: reach for primary, accent or ring somewhere. A " +
          "leaf styled purely in card / border / muted is not neutral — it is deaf to the " +
          "creator, and it fails silently, because nothing crashes.",
        columns: [
          {
            id: "container",
            title: "container",
            file: "*-connected.tsx",
            tone: "allowed",
            entries: [
              "hooks",
              "clocks",
              "fetches",
              "media queries",
              "measurements",
              "state",
            ],
          },
          {
            id: "contract",
            title: "contract",
            file: "*.vm.ts",
            tone: "carried",
            entries: [
              "pre-formatted strings",
              "callbacks",
              "state",
              "progress",
              "reducedMotion",
            ],
          },
          {
            id: "leaf",
            title: "leaf",
            file: "*.tsx",
            tone: "forbidden",
            entries: [
              "no hooks",
              "no fetch",
              "no formatting",
              "no dark:",
              "no raw <img>",
              "no hardcoded colour",
            ],
          },
        ],
      },
    },
    {
      id: "transport",
      title: "Transport",
      caption:
        "The container owns the clock. Fixtures freeze it. That is the whole reason an " +
        "animation in this repository is something a test can hold still and look at.",
      pullQuote: null,
      figure: {
        kind: "transport",
        valueLabel: "progress: number",
        startLabel: "0",
        endLabel: "1",
        knobLabel: formatFraction(0),
        rows: transports,
      },
    },
    {
      id: "formatting",
      title: "Nothing computed downstream",
      caption:
        "Two variants that each do their own arithmetic are two variants that eventually " +
        "disagree — in front of a customer, with nothing thrown and the suite still green.",
      pullQuote: null,
      figure: { kind: "formatting", rows: FORMATTING_ROWS },
    },
    {
      id: "proof",
      title: "Fixtures as the contract's proof",
      caption:
        "The invariant is enforced by a test suite, not by review. Two products run, not one " +
        "cube: bare renders across every fixture, and the default fixture across every " +
        "creator preset.",
      pullQuote: "When a leaf fails a fixture, the fixture is usually right.",
      figure: {
        kind: "matrix",
        grids: [
          {
            id: "fixtures",
            title: "every leaf × every fixture on its tree",
            rowLabel: countLabel(summary.leafCount, "leaf", "leaves"),
            columnLabel: countLabel(summary.fixtureCount, "fixture"),
            totalLabel: countLabel(summary.bareRenderCount, "render"),
            note:
              "Bare render, no theming. A leaf may render nothing for a state; it may never " +
              "leak a broken computed value into the DOM.",
            cells: sampleCells("fx", summary.leafCount, summary.maxFixtureCount),
          },
          {
            id: "presets",
            title: "every leaf × every editor-mode preset",
            rowLabel: countLabel(summary.leafCount, "leaf", "leaves"),
            columnLabel: countLabel(summary.presetCount, "preset"),
            totalLabel: countLabel(summary.leafCount * summary.presetCount, "render"),
            note:
              "The default fixture only, inside the creator surface. The creator's --primary " +
              "has to actually reach the leaf.",
            cells: sampleCells("em", summary.leafCount, summary.presetCount),
          },
        ],
      },
    },
    {
      id: "derived",
      title: "Derived, not configured",
      caption:
        "Plant a tree and it appears; delete one and it leaves. Nothing to keep in sync, " +
        "because nothing is stored.",
      pullQuote: null,
      figure: {
        kind: "chain",
        source: "src/lib/site-nav.ts",
        note:
          "A leaf is chosen inside a tree's lab rather than by URL — there is no leafHref, " +
          "and this chapter does not pretend there is one.",
        links: [
          { id: "root", href: "/", caption: countLabel(summary.speciesCount, "species", "species") },
          {
            id: "species",
            href: example ? `/lab/${example.species}` : "/lab/<species>",
            caption: example
              ? countLabel(example.treesInSpecies, "tree")
              : countLabel(summary.treeCount, "tree"),
          },
          {
            id: "tree",
            href: example ? `/lab/${example.species}/${example.tree}` : "/lab/<species>/<tree>",
            caption: "its leaves, its fixtures, its clock",
          },
        ],
      },
    },
  ];

  return raw.map((chapter, index) => {
    const position = resolvePosition(index, cursor.activeIndex);
    const progress = resolveChapterProgress(position, cursor.chapterProgress);
    return {
      ...chapter,
      ordinal: formatOrdinal(index),
      position,
      progress,
      figure:
        chapter.figure.kind === "transport"
          ? { ...chapter.figure, knobLabel: formatFraction(progress) }
          : chapter.figure,
    };
  });
}

/**
 * Every chapter, arrived.
 *
 * This is what reduced motion resolves to, and it is a *content* decision
 * rather than a speed one: somebody who asked not to be moved should not be
 * shown five chapters waiting to be scrolled into existence. Because each
 * chapter carries its own `position` and `progress`, honouring that request
 * costs the leaf nothing — it renders the same expressions against different
 * numbers.
 */
export function settleChapters(chapters: ForestPrimerChapter[]): ForestPrimerChapter[] {
  return chapters.map((chapter) => ({
    ...chapter,
    position: "active" as const,
    progress: 1,
    figure:
      chapter.figure.kind === "transport"
        ? { ...chapter.figure, knobLabel: formatFraction(1) }
        : chapter.figure,
  }));
}

export const FOREST_PRIMER_EMPTY: ForestPrimerVM = {
  state: "empty",
  progress: 0,
  reducedMotion: false,
  eyebrow: PRIMER_EYEBROW,
  headline: PRIMER_HEADLINE,
  body: null,
  chapters: [],
  activeIndex: -1,
  positionLabel: null,
  closingLine: null,
};
