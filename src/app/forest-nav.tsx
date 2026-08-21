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

import { ConiferMark } from "./conifer-mark";

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
 * The forest itself, as a rail — every species, and under it every tree.
 *
 * It replaced a row of species chips. The chips cost a full band of vertical
 * space at the top of every lab page to say only what the breadcrumb already
 * said, and they stopped at the species: reaching a tree meant a page in
 * between. A rail in the left gutter costs no vertical space at all and reaches
 * any tree in one press, which is why it can afford to list them.
 *
 * Shaped after `chrome/pane-dock`'s `canon/one-rail` leaf, deliberately: this
 * site's own chrome should look like the chrome it curates.
 *
 * Below `lg` there is no gutter to sit in, so the layout renders `SpeciesRail`
 * instead — the chips, still earning their place on a narrow screen.
 */
export function ForestRail({ species, tree }: { species?: string; tree?: string }) {
  const entries = speciesEntries(FOREST);
  if (entries.length === 0) return null;

  return (
    <nav
      aria-label="Forest"
      className="sticky top-6 flex max-h-[calc(100dvh-5rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-3"
    >
      {entries.map((entry) => {
        const currentSpecies = entry.key === species;
        return (
          <div key={entry.key} className="flex flex-col gap-1">
            <Link
              href={entry.href}
              aria-current={currentSpecies && !tree ? "page" : undefined}
              className={cn(
                "rounded px-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                currentSpecies ? "text-primary" : "text-muted-foreground hover:text-primary",
              )}
            >
              {entry.label}
            </Link>
            {entry.trees.map((treeEntry) => {
              const current = currentSpecies && treeEntry.key === tree;
              return (
                <Link
                  key={treeEntry.ref}
                  href={treeEntry.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border px-2 py-1.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    current
                      ? "border-primary/40 bg-primary/10"
                      : "border-transparent hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <span className="flex w-full items-center gap-2">
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium",
                        current ? "text-primary" : "text-foreground",
                      )}
                    >
                      {treeEntry.label}
                    </span>
                    <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium leading-none text-accent-foreground">
                      {treeEntry.leafCount}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {treeEntry.description}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Every species, as chips.
 *
 * What the lab used to wear on every page. It survives as the narrow-screen
 * answer, where there is no gutter for `ForestRail` to sit in.
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
    <li className="canopy-card group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary focus-within:border-ring">
      <h3 className="font-medium text-foreground">
        <ConiferMark className="mr-1.5 inline-block size-4 align-[-0.15em]" />
        {tree.label}
      </h3>
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
          {/*
            The only motion here a reader can cause. It is 2px and 150ms because
            it is an acknowledgement, not an event — and it travels the way the
            card is about to.
          */}
          <span
            aria-hidden="true"
            className="transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-focus-within:translate-x-0.5"
          >
            →
          </span>
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
      <div className="canopy-heading">
        <h2 className="text-xl font-semibold text-foreground">
          {/* `py-1` on an inline link buys the target floor without moving the line. */}
          <Link
            href={species.href}
            className="rounded py-1 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {species.label}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{species.description}</p>
      </div>
      <TreeGrid trees={species.trees} />
    </section>
  );
}
