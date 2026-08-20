/**
 * The site's navigation, rendered from `src/lib/site-nav.ts`.
 *
 * Every component here takes a path or a key and asks the forest what belongs
 * on the page. None of them holds state, none of them reads storage, and none
 * of them can be arranged — the shape of this site is a fact about the folder
 * layout, so it is derived on every render rather than remembered.
 *
 * They are server components on purpose. A nav that needs JavaScript to know
 * where it is, is a nav that flashes the wrong thing first.
 */

import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  crumbsFor,
  speciesEntries,
  speciesNeighbours,
  treeNeighbours,
  type SpeciesEntry,
  type TreeEntry,
} from "@/lib/site-nav";
import { FOREST } from "@/trees/generated";

/* -------------------------------------------------------------- the trail */

export function Crumbs({ species, tree }: { species?: string; tree?: string }) {
  const trail = crumbsFor(FOREST, { species, tree });

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {trail.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden>·</span> : null}
            {crumb.current ? (
              <span aria-current="page" className="text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-primary">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* --------------------------------------------------------------- the rail */

/**
 * Every species, on every lab page.
 *
 * This is where the forest's own top level becomes navigation. It is not in the
 * header because the header is on every page and this list grows every time
 * somebody plants a species — one level in, there is room for it to keep
 * arriving.
 */
export function SpeciesRail({ current }: { current?: string }) {
  const species = speciesEntries(FOREST);
  if (species.length === 0) return null;

  return (
    <nav aria-label="Species" className="flex flex-wrap gap-2">
      {species.map((entry) => (
        <Link
          key={entry.key}
          href={entry.href}
          aria-current={entry.key === current ? "page" : undefined}
          title={entry.description}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            entry.key === current
              ? "border-ring bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
          )}
        >
          {entry.label}
          <span className="ml-2 text-xs opacity-70">{entry.treeCount}</span>
        </Link>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------- prev and next */

function StepLink({
  entry,
  direction,
}: {
  entry: { label: string; href: string };
  direction: "previous" | "next";
}) {
  return (
    <Link
      href={entry.href}
      rel={direction === "next" ? "next" : "prev"}
      className={cn(
        "group flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary",
        direction === "next" ? "text-right" : null,
      )}
    >
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {direction === "previous" ? "← previous" : "next →"}
      </span>
      <span className="font-medium text-foreground group-hover:text-primary">{entry.label}</span>
    </Link>
  );
}

/**
 * The way out of a page that is not "back".
 *
 * Following `next` from the first tree to the last walks the whole repository
 * once, crossing species boundaries on the way — which is the only reading
 * order the forest actually has. Neither end wraps: see `site-nav.ts`.
 */
export function TreeSteps({ species, tree }: { species: string; tree: string }) {
  const { previous, next } = treeNeighbours(FOREST, species, tree);
  if (!previous && !next) return null;

  return (
    <nav aria-label="Trees" className="grid gap-3 sm:grid-cols-2">
      {previous ? <StepLink entry={previous} direction="previous" /> : <span />}
      {next ? <StepLink entry={next} direction="next" /> : null}
    </nav>
  );
}

export function SpeciesSteps({ species }: { species: string }) {
  const { previous, next } = speciesNeighbours(FOREST, species);
  if (!previous && !next) return null;

  return (
    <nav aria-label="Species" className="grid gap-3 sm:grid-cols-2">
      {previous ? <StepLink entry={previous} direction="previous" /> : <span />}
      {next ? <StepLink entry={next} direction="next" /> : null}
    </nav>
  );
}

/* ---------------------------------------------------------------- cards */

/** One tree. The same card everywhere a tree is listed — home, lab, species. */
export function TreeCard({ tree }: { tree: TreeEntry }) {
  return (
    <li className="relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary focus-within:border-ring">
      <h3 className="font-medium text-foreground">🌳 {tree.label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tree.description}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        {tree.branchCount} branches · {tree.leafCount} leaves · {tree.fixtureCount} fixtures
      </p>
      <div className="mt-auto pt-4">
        {/*
          One link per card, its hit area stretched over the whole card by
          `after:inset-0`. Its accessible name carries the tree — a list of
          identical "Open lab" links is unusable with a screen reader.
        */}
        <Link
          href={tree.href}
          aria-label={`Open lab: ${tree.label}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-ring transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 after:absolute after:inset-0 after:rounded-xl"
        >
          Open lab
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </li>
  );
}

export function TreeGrid({ trees }: { trees: TreeEntry[] }) {
  if (trees.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No trees here yet. Plant one: <code>pnpm plant &lt;species&gt;/&lt;tree&gt;</code>
      </p>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {trees.map((tree) => (
        <TreeCard key={tree.ref} tree={tree} />
      ))}
    </ul>
  );
}

/** One species, headed by what it is FOR — the sentence in `species.meta.ts`. */
export function SpeciesSection({ species }: { species: SpeciesEntry }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          <Link href={species.href} className="hover:text-primary">
            {species.label}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{species.description}</p>
      </div>
      <TreeGrid trees={species.trees} />
    </section>
  );
}
