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
          {/*
            The Label role, not body copy. Every other "this is chrome, not
            content" caption in the system is 11px uppercase at 0.14em, and
            these four are the most chrome-like type on the page — a legend
            under a count. They read as body text only because they were never
            given the role.
          */}
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </dt>
          {/*
            The figure is in the DOM and the CSS counts up to it — see
            `.stat-tally` in globals.css. Nothing here knows that: no state, no
            clock, no client boundary. The number this renders is the number a
            reader ends on.
          */}
          <dd
            className="stat-tally text-2xl font-semibold tabular-nums text-foreground"
            style={{ "--tally-to": String(value) } as React.CSSProperties}
          >
            <span className="stat-figure">{value}</span>
          </dd>
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
