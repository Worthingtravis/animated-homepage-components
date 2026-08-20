/**
 * This site's own sections — the parts of the forest site that are not leaves.
 *
 * The stats row, the forest index and the lab index used to be markup living
 * inside `page.tsx` and `lab/page.tsx`. They are here because a curator has to
 * be able to move them: once a page can be rearranged, anything that is only
 * reachable by *not* rearranging it is a trapdoor. Pulling them out means each
 * one has exactly one definition, rendered identically whether the page is
 * uncurated (the page renders it directly, as its default) or curated (the tab
 * panel renders it, because someone dropped it there).
 *
 * No hooks and no state — same discipline as a leaf, for the same reason: these
 * get rendered scaled-down and inert inside a drag card, and at full size inside
 * a tab panel, and neither may behave differently from the other.
 */

import Link from "next/link";
import type { ComponentType } from "react";

import { allLeaves, allTrees, forestStats } from "@/lib/forest";
import { BUILTIN_IDS } from "@/lib/section-catalog";
import { FOREST } from "@/trees/generated";

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

export function ForestIndexSection() {
  if (FOREST.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        The forest is empty. Plant a tree: <code>pnpm plant motion/aurora-headline</code>
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {FOREST.map((species) => (
        <section key={species.key} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{species.meta.label}</h2>
            <p className="text-sm text-muted-foreground">{species.meta.description}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {species.trees.map((tree) => (
              <li
                key={tree.ref}
                className="relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-ring focus-within:border-ring"
              >
                <h3 className="font-medium text-foreground">🌳 {tree.meta.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tree.meta.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {tree.branches.length} branches · {allLeaves(tree).length} leaves ·{" "}
                  {Object.keys(tree.fixtures).length} fixtures
                </p>
                {/*
                  One link per card, styled as the button it always was in
                  intent. `after:inset-0` stretches its hit area over the whole
                  card, so the card stays fully clickable without a second,
                  redundant link for anyone reading with a screen reader — and
                  its accessible name carries the tree, otherwise a link list is
                  just "Open lab" repeated once per tree.
                */}
                <div className="mt-auto pt-4">
                  <Link
                    href={`/lab/${tree.species}/${tree.key}`}
                    aria-label={`Open lab: ${tree.meta.label}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-ring transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 after:absolute after:inset-0 after:rounded-xl"
                  >
                    Open lab
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function LabIndexSection() {
  const trees = allTrees(FOREST);
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {trees.map((tree) => (
        <li
          key={tree.ref}
          className="relative flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring focus-within:border-ring"
        >
          <div>
            <span className="font-medium text-foreground">{tree.meta.label}</span>
            <span className="ml-2 text-xs text-muted-foreground">{tree.ref}</span>
            <p className="mt-1 text-sm text-muted-foreground">
              {allLeaves(tree).length} leaves · {Object.keys(tree.fixtures).length} fixtures
            </p>
          </div>
          <div className="mt-auto pt-4">
            {/* Named by tree — a list of identical "Open lab" links is unusable. */}
            <Link
              href={`/lab/${tree.species}/${tree.key}`}
              aria-label={`Open lab: ${tree.meta.label}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-ring transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 after:absolute after:inset-0 after:rounded-lg"
            >
              Open lab
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The id → component map the organizer and every curated surface resolve through. */
export const BUILTIN_SECTIONS: Record<string, ComponentType> = {
  [BUILTIN_IDS.forestStats]: ForestStatsSection,
  [BUILTIN_IDS.treeIndex]: ForestIndexSection,
  [BUILTIN_IDS.labIndex]: LabIndexSection,
};
