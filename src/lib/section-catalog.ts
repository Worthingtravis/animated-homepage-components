/**
 * The section catalog — every leaf in the forest, as something you can drag.
 *
 * This is the bridge between the registry and the organizer. A "section" here
 * is one leaf rendered with its tree's default fixture: a real, live component,
 * not a placeholder card with the component's name written on it. That is the
 * point of the organizer — you drag the actual hero into the actual tab and see
 * the actual result.
 *
 * ── What is excluded, and why ──────────────────────────────────────────────
 * `chrome/section-tabs` itself. Tabs inside tabs is not a feature anyone asked
 * for, it is what happens when a registry is enumerated without thinking, and
 * the failure is a stack overflow rather than an ugly layout.
 */

import { allLeaves, type SpeciesNode } from "./forest";

/** Fields every draggable card needs, whatever it turns out to render. */
type CatalogCommon = {
  /** Stable — it is what gets persisted. */
  id: string;
  /** Pre-formatted for display — "Channel Hero · Split Dock". */
  label: string;
  /** Pre-formatted one-line summary. */
  summary: string;
  /** The group's label alone, for grouping the palette. */
  treeLabel: string;
};

/**
 * A section is one of two things, and the difference is worth a discriminant.
 *
 * A `leaf` is a component out of the forest. A `builtin` is a piece of THIS
 * site — the forest index, the stats row, the list of labs. Builtins exist so
 * that curating a page cannot silently delete its navigation: dragging the tree
 * index behind a tab is a rearrangement, and dragging it to the shelf is a
 * decision you can take back, where a hardcoded page section would simply be
 * gone the moment anything else rendered in its place.
 */
export type CatalogSection =
  | (CatalogCommon & {
      kind: "leaf";
      species: string;
      tree: string;
      /** `"<branch>/<leaf>"`. */
      leafRef: string;
    })
  | (CatalogCommon & { kind: "builtin" });

/** Trees the organizer must not offer as draggable content. */
const EXCLUDED_TREES = new Set(["chrome/section-tabs"]);

/** The id every builtin card is keyed by. Rendered by `src/app/site-sections.tsx`. */
export const BUILTIN_IDS = {
  forestStats: "site/forest-stats",
  treeIndex: "site/tree-index",
  labIndex: "site/lab-index",
} as const;

export type BuiltinId = (typeof BUILTIN_IDS)[keyof typeof BUILTIN_IDS];

const BUILTINS: ReadonlyArray<CatalogSection> = [
  {
    kind: "builtin",
    id: BUILTIN_IDS.forestStats,
    label: "This site · Forest stats",
    summary: "The species / trees / branches / leaves counters, live off the registry.",
    treeLabel: "This site",
  },
  {
    kind: "builtin",
    id: BUILTIN_IDS.treeIndex,
    label: "This site · Forest index",
    summary: "Every tree in the forest, grouped by species, each linking to its lab.",
    treeLabel: "This site",
  },
  {
    kind: "builtin",
    id: BUILTIN_IDS.labIndex,
    label: "This site · Lab index",
    summary: "The flat list of trees with leaf and fixture counts — the lab's front door.",
    treeLabel: "This site",
  },
];

export function buildCatalog(forest: SpeciesNode[]): CatalogSection[] {
  return [
    ...BUILTINS,
    ...forest.flatMap((species) =>
      species.trees
        .filter((tree) => !EXCLUDED_TREES.has(tree.ref))
        .flatMap((tree) =>
          allLeaves(tree).map(
            (leaf): CatalogSection => ({
              kind: "leaf",
              id: `${tree.ref}/${leaf.ref}`,
              species: species.key,
              tree: tree.key,
              leafRef: leaf.ref,
              label: `${tree.meta.label} · ${leaf.meta.label}`,
              summary: leaf.meta.description,
              treeLabel: tree.meta.label,
            }),
          ),
        ),
    ),
  ];
}

export function indexCatalog(sections: CatalogSection[]): Map<string, CatalogSection> {
  return new Map(sections.map((section) => [section.id, section]));
}
