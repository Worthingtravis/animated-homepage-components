import type { ComponentType } from "react";

import { findLeaf, findTree } from "./forest";
import { FOREST } from "@/trees/generated";

/**
 * Resolve the leaf a container should render.
 *
 * Despite the name this is not a React hook — it does no work between renders.
 * It reads the generated registry, which is a static module. The `use` prefix
 * is kept because containers read as if it were one and it may gain
 * subscription behaviour (live variant switching) later.
 */
export function useForestLeaf<VM>(
  species: string,
  tree: string,
  variant?: string,
): ComponentType<VM> {
  const node = findTree(FOREST, species, tree);
  if (!node) {
    throw new Error(
      `Unknown tree "${species}/${tree}". Run \`pnpm sync\` — or plant it: pnpm plant ${species}/${tree}`,
    );
  }
  const leaf = findLeaf(node, variant);
  if (!leaf) {
    throw new Error(
      `Tree "${species}/${tree}" has no leaves yet. Open one: pnpm leaf ${species}/${tree}/<branch> <leaf>`,
    );
  }
  return leaf.Component as ComponentType<VM>;
}
