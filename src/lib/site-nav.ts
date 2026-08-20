/**
 * Navigation, derived from the forest.
 *
 * This file replaced a curation system. The site used to let you arrange its
 * pages — drag a section onto a tab, and `/` or `/lab` came back in that shape,
 * remembered in localStorage. It worked, and it answered a question nobody was
 * asking: the shape of this site is not a matter of taste, it is a fact about
 * the repository. There are species, each holds trees, each tree holds branches,
 * each branch holds leaves. Four levels, already written down in the folder
 * layout and already generated into `src/trees/generated.ts`.
 *
 * So navigation is not configured here. It is *read*:
 *
 *   /                        the forest        → every species
 *   /lab                     the lab           → every tree, grouped by species
 *   /lab/<species>           one species       → its trees, and what it is for
 *   /lab/<species>/<tree>    one tree          → its branches, leaves and fixtures
 *
 * Every level of the construct is addressable, and no level exists in this file
 * that does not exist on disk. Plant a tree and it appears in the nav; delete
 * one and it leaves. There is nothing to keep in sync, because there is nothing
 * to configure.
 *
 * Pure — no React, no storage, no DOM, no router. Every function takes the
 * forest and returns data, which is what makes the whole nav testable without
 * rendering a page.
 */

import { allLeaves, type SpeciesNode, type TreeNode } from "./forest";

/** One step in a trail. `current` marks the page you are already on. */
export type Crumb = {
  label: string;
  href: string;
  current: boolean;
};

/** A tree, flattened for a link. Counts arrive finished — no caller re-derives them. */
export type TreeEntry = {
  key: string;
  speciesKey: string;
  /** `"<species>/<tree>"`. */
  ref: string;
  label: string;
  description: string;
  href: string;
  /** Where the source lives, for the mono line under a heading. */
  path: string;
  branchCount: number;
  leafCount: number;
  fixtureCount: number;
};

export type SpeciesEntry = {
  key: string;
  label: string;
  description: string;
  href: string;
  trees: TreeEntry[];
  treeCount: number;
  leafCount: number;
};

/** The two fixed rooms. Everything else on this site is a species or a tree. */
export const HOME_HREF = "/";
export const LAB_HREF = "/lab";

export function speciesHref(speciesKey: string): string {
  return `${LAB_HREF}/${speciesKey}`;
}

export function treeHref(speciesKey: string, treeKey: string): string {
  return `${LAB_HREF}/${speciesKey}/${treeKey}`;
}

/* ---------------------------------------------------------------- reads */

function toTreeEntry(tree: TreeNode): TreeEntry {
  return {
    key: tree.key,
    speciesKey: tree.species,
    ref: tree.ref,
    label: tree.meta.label,
    description: tree.meta.description,
    href: treeHref(tree.species, tree.key),
    path: `src/trees/${tree.species}/${tree.key}/`,
    branchCount: tree.branches.length,
    leafCount: allLeaves(tree).length,
    fixtureCount: Object.keys(tree.fixtures).length,
  };
}

function toSpeciesEntry(species: SpeciesNode): SpeciesEntry {
  const trees = species.trees.map(toTreeEntry);
  return {
    key: species.key,
    label: species.meta.label,
    description: species.meta.description,
    href: speciesHref(species.key),
    trees,
    treeCount: trees.length,
    leafCount: trees.reduce((total, tree) => total + tree.leafCount, 0),
  };
}

/** Every species, in the forest's own order — which is the folder order. */
export function speciesEntries(forest: SpeciesNode[]): SpeciesEntry[] {
  return forest.map(toSpeciesEntry);
}

export function findSpeciesEntry(forest: SpeciesNode[], key: string): SpeciesEntry | null {
  const species = forest.find((entry) => entry.key === key);
  return species ? toSpeciesEntry(species) : null;
}

/**
 * Every tree in the forest, flattened, in reading order.
 *
 * Reading order is what makes "next tree" mean something: the last tree of one
 * species leads into the first of the next, so following it end to end walks
 * the whole repository once. A per-species cycle would instead trap you inside
 * whichever species you happened to land in.
 */
export function treeEntries(forest: SpeciesNode[]): TreeEntry[] {
  return forest.flatMap((species) => species.trees.map(toTreeEntry));
}

export function findTreeEntry(
  forest: SpeciesNode[],
  speciesKey: string,
  treeKey: string,
): TreeEntry | null {
  return (
    treeEntries(forest).find(
      (tree) => tree.speciesKey === speciesKey && tree.key === treeKey,
    ) ?? null
  );
}

/* ----------------------------------------------------------- neighbours */

export type Neighbours<T> = { previous: T | null; next: T | null };

/**
 * The entries either side of one, without wrapping.
 *
 * Not wrapping is the decision worth naming: a "next" that silently returns to
 * the beginning tells you nothing about where you are, and someone paging
 * through a forest to see all of it can never tell they have finished. The ends
 * are null, and the ends look like ends.
 */
function neighboursOf<T>(list: T[], index: number): Neighbours<T> {
  if (index < 0) return { previous: null, next: null };
  return {
    previous: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  };
}

export function treeNeighbours(
  forest: SpeciesNode[],
  speciesKey: string,
  treeKey: string,
): Neighbours<TreeEntry> {
  const trees = treeEntries(forest);
  return neighboursOf(
    trees,
    trees.findIndex((tree) => tree.speciesKey === speciesKey && tree.key === treeKey),
  );
}

export function speciesNeighbours(
  forest: SpeciesNode[],
  speciesKey: string,
): Neighbours<SpeciesEntry> {
  const species = speciesEntries(forest);
  return neighboursOf(
    species,
    species.findIndex((entry) => entry.key === speciesKey),
  );
}

/* ------------------------------------------------------------- the trail */

/**
 * The trail to a page, built from what that page IS rather than from what was
 * clicked to get there.
 *
 * A history-based breadcrumb lies the moment somebody arrives from a link, and
 * this site is mostly links. Asking the forest instead means the trail on
 * `/lab/commerce/product-card` is the same trail whether you walked there or
 * pasted the URL — and a species that does not exist cannot produce a trail
 * that claims it does.
 */
export function crumbsFor(
  forest: SpeciesNode[],
  target: { species?: string; tree?: string } = {},
): Crumb[] {
  const trail: Crumb[] = [{ label: "the forest", href: HOME_HREF, current: false }];
  const atLab = target.species === undefined;
  trail.push({ label: "lab", href: LAB_HREF, current: atLab });
  if (atLab) return trail;

  const species = findSpeciesEntry(forest, target.species as string);
  if (!species) return trail;

  const atSpecies = target.tree === undefined;
  trail.push({ label: species.label, href: species.href, current: atSpecies });
  if (atSpecies) return trail;

  const tree = species.trees.find((entry) => entry.key === target.tree);
  if (!tree) return trail;

  trail.push({ label: tree.label, href: tree.href, current: true });
  return trail;
}

/**
 * The header's links.
 *
 * Deliberately NOT one link per species: the header is the one piece of chrome
 * on every page, and a bar that grows by a link every time somebody plants a
 * species is a bar that eventually wraps. Species live one level in, on the lab
 * rail, where there is room for them to keep arriving.
 */
export type NavLink = { label: string; href: string; external?: boolean };

export const HEADER_LINKS: readonly NavLink[] = [
  { label: "lab", href: LAB_HREF },
  {
    label: "source",
    href: "https://github.com/Worthingtravis/animated-homepage-components",
    external: true,
  },
];

/**
 * `"1 tree"`, `"8 trees"`.
 *
 * Trivial, and it lives here rather than in a page because two pages counting
 * the same thing in two places is how a site ends up saying "1 trees" on one of
 * them.
 */
export function plural(count: number, singular: string, many = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : many}`;
}

/**
 * Which header link a path lights up.
 *
 * Prefix matching, because `/lab/commerce/product-card` is still the lab — and
 * the root has to be exact or every page on the site would claim to be home.
 */
export function isActivePath(currentPath: string, href: string): boolean {
  if (href === HOME_HREF) return currentPath === HOME_HREF;
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
