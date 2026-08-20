/**
 * The two shells a page can wear.
 *
 * The width used to live on `<main>`, which meant every page was the same
 * narrowed column and nothing could sit beside it. The lab now wants a rail in
 * the gutter, so the width moved down here: `<main>` is full-bleed, and a page
 * says which shape it is.
 *
 * Both are pure layout — no state, no storage, nothing derived that
 * `site-nav.ts` does not already derive.
 */

import { ForestRail, SpeciesRail } from "./forest-nav";

/** Prose and indexes: one readable column, stepping up on wide screens. */
export function PageWidth({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl xl:max-w-[88rem] 2xl:max-w-[104rem]">{children}</div>
  );
}

/**
 * A lab page: the forest in the left gutter, the page itself beside it.
 *
 * The rail sits OUTSIDE the column the page would otherwise occupy, so listing
 * every tree costs the page no width and no height — which is the whole reason
 * it can list them. Below `lg` there is no gutter, so the species chips come
 * back instead of a rail crushing the content.
 */
export function LabShell({
  species,
  tree,
  children,
}: {
  species?: string;
  tree?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[120rem] gap-8">
      <aside className="hidden w-60 shrink-0 lg:block">
        <ForestRail species={species} tree={tree} />
      </aside>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="lg:hidden">
          <SpeciesRail current={species} />
        </div>
        {children}
      </div>
    </div>
  );
}
