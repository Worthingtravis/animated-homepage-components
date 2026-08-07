"use client";

/**
 * Page Nav — connected container.
 *
 * The ONLY file in this tree allowed hooks, scroll listeners, measurements or
 * media queries. It owns the condensation transport, the overflow measurement
 * and the mobile disclosure, then hands a finished VM to whichever leaf the
 * caller picked. Swapping leaves never touches this file.
 *
 * Note what lives here that used to live inside laughingwhales' `PageTabBar`:
 * the scroll listener, the ResizeObserver, the can-scroll-left/right booleans
 * and the scrollBy calls. That is precisely why that component could not be
 * restyled without a rewrite — and why every leaf on this tree can.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  buildAction,
  buildBrand,
  buildItem,
  resolveCondensation,
  resolvePageNavState,
  type PageNavEmphasis,
  type PageNavImage,
  type PageNavVM,
} from "./page-nav.vm";

export type PageNavConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;

  ariaLabel?: string;

  brand?: { label: string; href: string; image?: PageNavImage | null } | null;

  /** Raw items. Active state is resolved here from `activeId`. */
  items: Array<{
    id: string;
    label: string;
    badge?: string | null;
    href?: string | null;
    onSelect?: (() => void) | null;
  }>;
  /** The item that owns the current route. `""` marks nothing active. */
  activeId: string;

  actions?: Array<{
    id: string;
    label: string;
    href: string;
    emphasis?: PageNavEmphasis;
    tooltip?: string;
    onActivate?: () => void;
  }>;

  /**
   * Scroll distance over which the bar fully condenses. `0` keeps it at rest —
   * the nav still works, it just never shrinks.
   */
  condenseOverPx?: number;

  /** When true the container measures the track and supplies overflow chevrons. */
  scrollable?: boolean;

  /** When true the container supplies a mobile disclosure. */
  collapsible?: boolean;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Condensation transport. Reads scroll; never reads layout. */
function useCondensation(overPx: number): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (overPx <= 0) {
      setProgress(0);
      return;
    }
    const onScroll = () => setProgress(resolveCondensation(window.scrollY, overPx));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overPx]);
  return progress;
}

export function PageNavConnected({
  variant,
  ariaLabel = "Main",
  brand = null,
  items,
  activeId,
  actions = [],
  condenseOverPx = 96,
  scrollable = false,
  collapsible = false,
}: PageNavConnectedProps) {
  const Leaf = useForestLeaf<PageNavVM>("chrome", "page-nav", variant);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useCondensation(reducedMotion ? 0 : condenseOverPx);

  const [menuOpen, setMenuOpen] = useState(false);
  const onToggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  /**
   * Overflow measurement. The leaf gets booleans and callbacks; it never sees
   * the element, so a leaf that lays its track out differently still gets
   * correct affordances — the ref is attached by whatever the leaf renders
   * through `data-nav-track`.
   */
  const trackRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ back: false, forward: false });

  useEffect(() => {
    if (!scrollable) return;
    const track = document.querySelector<HTMLElement>("[data-nav-track]");
    trackRef.current = track;
    if (!track) return;

    const measure = () => {
      setEdges({
        back: track.scrollLeft > 2,
        forward: track.scrollLeft + track.clientWidth < track.scrollWidth - 2,
      });
    };
    measure();
    track.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [scrollable, items.length]);

  const scrollBy = useCallback((delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const vm = useMemo<PageNavVM>(() => {
    const builtItems = items.map((raw) => buildItem(raw, activeId));
    const effective = reducedMotion ? 0 : progress;
    return {
      state: resolvePageNavState(builtItems.length, effective),
      progress: effective,
      reducedMotion,
      ariaLabel,
      brand: brand ? buildBrand(brand) : null,
      items: builtItems,
      actions: actions.map(buildAction),
      overflow:
        scrollable && (edges.back || edges.forward)
          ? {
              canScrollBack: edges.back,
              canScrollForward: edges.forward,
              onScrollBack: () => scrollBy(-160),
              onScrollForward: () => scrollBy(160),
              backLabel: "Scroll tabs left",
              forwardLabel: "Scroll tabs right",
            }
          : null,
      menu: collapsible
        ? {
            state: menuOpen ? "open" : "closed",
            label: menuOpen ? "Close" : "Menu",
            onToggle: onToggleMenu,
          }
        : null,
    };
  }, [
    actions,
    activeId,
    ariaLabel,
    brand,
    collapsible,
    edges.back,
    edges.forward,
    items,
    menuOpen,
    onToggleMenu,
    progress,
    reducedMotion,
    scrollBy,
    scrollable,
  ]);

  return <Leaf {...vm} />;
}
