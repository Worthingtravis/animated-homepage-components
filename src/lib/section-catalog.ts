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

export type CatalogSection = {
  /** `"<species>/<tree>/<branch>/<leaf>"`. Stable — it is what gets persisted. */
  id: string;
  species: string;
  tree: string;
  /** `"<branch>/<leaf>"`. */
  leafRef: string;
  /** Pre-formatted for display — "Channel Hero · Split Dock". */
  label: string;
  /** Pre-formatted one-line summary. */
  summary: string;
  /** The tree's label alone, for grouping the palette. */
  treeLabel: string;
};

/** Trees the organizer must not offer as draggable content. */
const EXCLUDED_TREES = new Set(["chrome/section-tabs"]);

export function buildCatalog(forest: SpeciesNode[]): CatalogSection[] {
  return forest.flatMap((species) =>
    species.trees
      .filter((tree) => !EXCLUDED_TREES.has(tree.ref))
      .flatMap((tree) =>
        allLeaves(tree).map((leaf) => ({
          id: `${tree.ref}/${leaf.ref}`,
          species: species.key,
          tree: tree.key,
          leafRef: leaf.ref,
          label: `${tree.meta.label} · ${leaf.meta.label}`,
          summary: leaf.meta.description,
          treeLabel: tree.meta.label,
        })),
      ),
  );
}

export function indexCatalog(sections: CatalogSection[]): Map<string, CatalogSection> {
  return new Map(sections.map((section) => [section.id, section]));
}
