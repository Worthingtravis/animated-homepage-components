/**
 * This site's own blocks — the parts that are not leaves.
 *
 * These used to be draggable "sections" a curator could arrange onto tabs, with
 * a registry mapping ids to components. There is no registry any more: a page
 * renders the blocks it is made of, and what those blocks contain comes from
 * the forest. Same discipline as a leaf — no hooks, no state — because none of
 * it needs any.
 */

import { forestStats } from "@/lib/forest";
import { speciesEntries } from "@/lib/site-nav";
import { FOREST } from "@/trees/generated";

import { SpeciesSection } from "./forest-nav";

export function ForestStatsSection() {
  const stats = forestStats(FOREST);
  return (
    <dl className="flex flex-wrap gap-6 text-sm">
      {(
        [
          ["species", stats.species],
          ["trees", stats.trees],
          ["branches", stats.branches],
          ["leaves", stats.leaves],
        ] as const
      ).map(([label, value]) => (
        <div key={label}>
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-2xl font-semibold text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The forest, by species. The site's shape and the repository's are the same shape. */
export function ForestIndexSection() {
  const species = speciesEntries(FOREST);

  if (species.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        The forest is empty. Plant a tree: <code>pnpm plant motion/aurora-headline</code>
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {species.map((entry) => (
        <SpeciesSection key={entry.key} species={entry} />
      ))}
    </div>
  );
}
