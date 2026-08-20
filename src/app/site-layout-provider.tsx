"use client";

/**
 * Where the curated shape of this site lives while the tab is open.
 *
 * One provider at the root, because the organizer and the pages it curates are
 * different routes: `/organize` writes, `/` and `/lab` read, and neither may own
 * the value or they would disagree the moment you navigated. Every mutation is
 * still one of `section-layout.ts`'s pure moves, lifted onto one surface by
 * `mapSurface` — this file adds persistence and a React context and nothing
 * else. There are no rules in here.
 *
 * ── Why `hydrated` is part of the value ────────────────────────────────────
 * The server cannot know what is in localStorage, so the first render must be
 * the seeded site — the uncurated one — on both sides, and the stored layout
 * can only arrive afterwards. Consumers read `hydrated` rather than guessing,
 * which is what keeps a curated page from being a hydration mismatch and what
 * lets a static export prerender the shipped design instead of a blank shell.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildCatalog, type CatalogSection } from "@/lib/section-catalog";
import type { SectionLayout } from "@/lib/section-layout";
import {
  isCurated,
  mapSurface,
  reconcileSite,
  resetSurface,
  seedSite,
  surfaceLayout,
  type SiteLayout,
  type SurfaceId,
} from "@/lib/site-layout";
import { FOREST } from "@/trees/generated";

const STORAGE_KEY = "forest.site-layout";
/** What the organizer wrote before it could curate more than one page. */
const LEGACY_KEY = "forest.section-layout";

type SiteLayoutValue = {
  site: SiteLayout;
  catalog: CatalogSection[];
  byId: Map<string, CatalogSection>;
  /** False until the stored layout has been read. See the header. */
  hydrated: boolean;
  layoutFor: (id: SurfaceId) => SectionLayout;
  curated: (id: SurfaceId) => boolean;
  /** Apply a pure move from `section-layout.ts` to one surface. */
  update: (id: SurfaceId, move: (layout: SectionLayout) => SectionLayout) => void;
  reset: (id: SurfaceId) => void;
};

const SiteLayoutContext = createContext<SiteLayoutValue | null>(null);

export function SiteLayoutProvider({ children }: { children: ReactNode }) {
  const catalog = useMemo(() => buildCatalog(FOREST), []);
  const catalogIds = useMemo(() => catalog.map((section) => section.id), [catalog]);
  const byId = useMemo(() => new Map(catalog.map((s) => [s.id, s])), [catalog]);

  const [site, setSite] = useState<SiteLayout>(() => seedSite(catalogIds));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSite(reconcileSite(JSON.parse(raw), catalogIds));
      } else {
        // One-time upgrade: the single-surface layout becomes the home surface.
        const legacy = window.localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const home = JSON.parse(legacy) as SectionLayout;
          setSite((current) => reconcileSite({ ...current, surfaces: { ...current.surfaces, home } }, catalogIds));
        }
      }
    } catch {
      // A corrupt entry is not worth failing every page on the site over.
    }
    setHydrated(true);
  }, [catalogIds]);

  useEffect(() => {
    if (!hydrated) return; // Never write the seed over a real stored layout.
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(site));
    } catch {
      // Private mode / quota. It works, it just will not remember.
    }
  }, [site, hydrated]);

  const update = useCallback(
    (id: SurfaceId, move: (layout: SectionLayout) => SectionLayout) => {
      setSite((current) => mapSurface(current, id, move));
    },
    [],
  );

  const reset = useCallback(
    (id: SurfaceId) => {
      setSite((current) => resetSurface(current, id, catalogIds));
    },
    [catalogIds],
  );

  const value = useMemo<SiteLayoutValue>(
    () => ({
      site,
      catalog,
      byId,
      hydrated,
      layoutFor: (id) => surfaceLayout(site, id),
      curated: (id) => hydrated && isCurated(site, id),
      update,
      reset,
    }),
    [site, catalog, byId, hydrated, update, reset],
  );

  return <SiteLayoutContext.Provider value={value}>{children}</SiteLayoutContext.Provider>;
}

export function useSiteLayout(): SiteLayoutValue {
  const value = useContext(SiteLayoutContext);
  if (!value) throw new Error("useSiteLayout must be used inside <SiteLayoutProvider>");
  return value;
}
