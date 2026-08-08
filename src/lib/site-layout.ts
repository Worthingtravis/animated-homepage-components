/**
 * The site layout — one `SectionLayout` per curatable surface.
 *
 * The organizer already knew how to answer *which sections live behind which
 * tab*. What it did not know is *for which page*. This file is that one extra
 * word: a site layout is a map from a surface id to the layout that surface
 * renders, and every write is still one of `section-layout.ts`'s pure moves
 * applied to exactly one of them.
 *
 * ── Why a surface is a value and not a route ───────────────────────────────
 * `/` and `/lab` are pages; `home` and `lab` are the shapes those pages agreed
 * to take. Keeping the shape in a serialisable value is what lets the organizer
 * edit a page it is not currently on, and what lets a page render its curated
 * form without knowing the organizer exists. A surface never reaches for the
 * router, and a route never reaches into this map by string literal — it asks
 * for its own id.
 *
 * ── Why every surface starts empty ─────────────────────────────────────────
 * `seedSite` gives each surface named tabs and puts every section on the shelf.
 * An empty tab set means "nobody has curated this page yet", and a page in that
 * state renders the design it shipped with. That is deliberate: the site must
 * not become a blank tab bar on a fresh visit, and "uncurated" has to be a
 * state you can return to rather than a state you can only leave.
 *
 * Pure, like its neighbour — no React, no storage, no DOM.
 */

import {
  addTab,
  emptyLayout,
  filledTabs,
  reconcile,
  type SectionLayout,
} from "./section-layout";

/** Every page whose shape a curator may move. */
export type SurfaceId = "home" | "lab";

export type Surface = {
  id: SurfaceId;
  /** What the organizer's switcher calls it. */
  label: string;
  /** Where it renders, so the organizer can offer to go look at it. */
  path: string;
  /** One line, shown next to the switcher. */
  description: string;
  /** Tab names a fresh site starts with. Empty tabs — see the header. */
  seedTabs: ReadonlyArray<{ id: string; label: string }>;
};

export const SURFACES: readonly Surface[] = [
  {
    id: "home",
    label: "Home",
    path: "/",
    description: "The front page. Curate it and the forest index moves behind your tabs.",
    seedTabs: [
      { id: "home-overview", label: "Overview" },
      { id: "home-work", label: "Work" },
    ],
  },
  {
    id: "lab",
    label: "Lab",
    path: "/lab",
    description: "The tree index. Curate it and the list of trees becomes one section among others.",
    seedTabs: [
      { id: "lab-trees", label: "Trees" },
      { id: "lab-notes", label: "Notes" },
    ],
  },
];

export const SURFACE_IDS: readonly SurfaceId[] = SURFACES.map((surface) => surface.id);

export function isSurfaceId(value: unknown): value is SurfaceId {
  return typeof value === "string" && SURFACE_IDS.includes(value as SurfaceId);
}

export function findSurface(id: SurfaceId): Surface {
  const surface = SURFACES.find((entry) => entry.id === id);
  // SurfaceId is closed over SURFACES, so this cannot miss — the fallback keeps
  // a hand-written id out of a crash and into a visibly wrong label instead.
  return surface ?? SURFACES[0];
}

export type SiteLayout = {
  /** Bumped when the stored shape changes in a way `reconcileSite` cannot fix. */
  version: 1;
  surfaces: Record<SurfaceId, SectionLayout>;
};

export const SITE_LAYOUT_VERSION = 1;

/* --------------------------------------------------------------- writes */

function seedSurface(surface: Surface, sectionIds: readonly string[]): SectionLayout {
  const withTabs = surface.seedTabs.reduce(
    (layout, tab) => addTab(layout, tab.label, tab.id),
    emptyLayout(),
  );
  return reconcile({ ...withTabs, activeTabId: surface.seedTabs[0]?.id ?? null }, sectionIds);
}

/** A fresh site: named but empty tabs everywhere, every section on the shelf. */
export function seedSite(sectionIds: readonly string[]): SiteLayout {
  return {
    version: SITE_LAYOUT_VERSION,
    surfaces: Object.fromEntries(
      SURFACES.map((surface) => [surface.id, seedSurface(surface, sectionIds)]),
    ) as Record<SurfaceId, SectionLayout>,
  };
}

/** Reset one surface without disturbing the others. */
export function resetSurface(
  site: SiteLayout,
  id: SurfaceId,
  sectionIds: readonly string[],
): SiteLayout {
  return setSurface(site, id, seedSurface(findSurface(id), sectionIds));
}

export function surfaceLayout(site: SiteLayout, id: SurfaceId): SectionLayout {
  return site.surfaces[id];
}

export function setSurface(site: SiteLayout, id: SurfaceId, layout: SectionLayout): SiteLayout {
  return { ...site, surfaces: { ...site.surfaces, [id]: layout } };
}

/** Apply one of `section-layout.ts`'s pure moves to a single surface. */
export function mapSurface(
  site: SiteLayout,
  id: SurfaceId,
  move: (layout: SectionLayout) => SectionLayout,
): SiteLayout {
  return setSurface(site, id, move(surfaceLayout(site, id)));
}

/**
 * Reconcile a stored site against the sections that exist now.
 *
 * Tolerant on purpose: a stored value can be from an older build, can be
 * missing a surface added since, or can be outright rubbish someone typed into
 * devtools. Any of those has to end at a usable site rather than a stack trace,
 * because the alternative is a blank front page that only clearing storage
 * fixes.
 */
export function reconcileSite(value: unknown, sectionIds: readonly string[]): SiteLayout {
  const seeded = seedSite(sectionIds);
  if (!value || typeof value !== "object") return seeded;

  const stored = (value as Partial<SiteLayout>).surfaces;
  if (!stored || typeof stored !== "object") return seeded;

  return {
    version: SITE_LAYOUT_VERSION,
    surfaces: Object.fromEntries(
      SURFACES.map((surface) => {
        const candidate = (stored as Record<string, unknown>)[surface.id];
        if (!candidate || typeof candidate !== "object" || !Array.isArray((candidate as SectionLayout).tabs)) {
          return [surface.id, seeded.surfaces[surface.id]];
        }
        return [surface.id, reconcile(candidate as SectionLayout, sectionIds)];
      }),
    ) as Record<SurfaceId, SectionLayout>,
  };
}

/* ---------------------------------------------------------------- reads */

/**
 * Has anyone actually arranged this surface?
 *
 * A surface with tabs but nothing in them is not curated — it is a page someone
 * opened the organizer on and walked away from. Only a tab holding a section
 * counts, which is what keeps a fresh visit on the shipped design.
 */
export function isCurated(site: SiteLayout, id: SurfaceId): boolean {
  return filledTabs(surfaceLayout(site, id)).length > 0;
}
