import type { ComponentType } from "react";

/**
 * The forest vocabulary.
 *
 *   species → a *type* of tree      (a family of homepage concerns)
 *   tree    → a VM contract         (one component, one props type)
 *   branch  → an aesthetic direction (leaves that share a look)
 *   leaf    → one pure presentation component
 *
 * A leaf is always substitutable for any other leaf on the same TREE — not just
 * the same branch — because the contract lives at the tree.
 */

export type SizeHint = "sm" | "md" | "lg";

export type SpeciesMeta = {
  label: string;
  description: string;
};

export type TreeMeta = {
  label: string;
  description: string;
  tags?: string[];
};

export type BranchMeta = {
  label: string;
  description: string;
};

export type LeafMeta = {
  label: string;
  description: string;
  sizeHint?: SizeHint;
  tags?: string[];
};

/**
 * Leaves are keyed by the tree's VM, but the registry is heterogeneous, so it
 * stores them behind this alias and each tree's container re-types on the way
 * out (see `useForestLeaf`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ForestComponent = ComponentType<any>;

export type LeafNode = {
  key: string;
  /** `"<branch>/<leaf>"` — the variant ref a container accepts. */
  ref: string;
  meta: LeafMeta;
  Component: ForestComponent;
};

export type BranchNode = {
  key: string;
  meta: BranchMeta;
  leaves: LeafNode[];
};

export type TreeNode = {
  key: string;
  species: string;
  /** `"<species>/<tree>"`. */
  ref: string;
  meta: TreeMeta;
  fixtures: Record<string, unknown>;
  defaultFixture: string;
  /**
   * Optional pure sampler exported by the tree's fixtures. Given transport in
   * 0..1 it returns a *coherent* VM for that instant — every derived field
   * agreeing with every other. The lab's clock uses it when present; overriding
   * `progress` alone would desync it from whatever the container derives.
   */
  frameAt?: (progress: number) => unknown;
  branches: BranchNode[];
};

export type SpeciesNode = {
  key: string;
  meta: SpeciesMeta;
  trees: TreeNode[];
};

/* --------------------------------------------------------------- lookups */

export function allTrees(forest: SpeciesNode[]): TreeNode[] {
  return forest.flatMap((species) => species.trees);
}

export function allLeaves(tree: TreeNode): LeafNode[] {
  return tree.branches.flatMap((branch) => branch.leaves);
}

export function findTree(
  forest: SpeciesNode[],
  species: string,
  tree: string,
): TreeNode | undefined {
  return forest.find((s) => s.key === species)?.trees.find((t) => t.key === tree);
}

/**
 * Resolve `"<branch>/<leaf>"`, a bare `"<leaf>"`, or nothing at all.
 * Falling back to the first leaf keeps a container renderable while a branch is
 * still being designed.
 */
export function findLeaf(tree: TreeNode, ref?: string): LeafNode | undefined {
  const leaves = allLeaves(tree);
  if (!ref) return leaves[0];
  return leaves.find((leaf) => leaf.ref === ref) ?? leaves.find((leaf) => leaf.key === ref);
}

export function forestStats(forest: SpeciesNode[]) {
  const trees = allTrees(forest);
  return {
    species: forest.length,
    trees: trees.length,
    branches: trees.flatMap((tree) => tree.branches).length,
    leaves: trees.flatMap(allLeaves).length,
  };
}
