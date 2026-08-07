"use client";

/**
 * Section Tabs — connected container.
 *
 * The ONLY file in this tree allowed hooks, clocks, measurements or media
 * queries. It owns:
 *
 *   · which tab is active (uncontrolled, or controlled by the caller)
 *   · the transition clock that drives `progress` 0..1 across one change
 *   · which panel is leaving, and for how long it stays mounted
 *   · the reduced-motion query
 *   · the narrow/wide measurement
 *   · the overflow measurement and its scroll callbacks
 *   · the disclosure's open state
 *
 * Everything above is the machinery a tab component normally hides inside
 * itself — which is exactly why a normal tab component cannot be restyled
 * without a rewrite. Here it resolves into one VM, and swapping `variant` from
 * a top track to a side rail to a popover touches nothing in this file.
 *
 * Note what is NOT here: the sections. They arrive as opaque nodes and leave as
 * opaque nodes. This container never renders one directly, never measures one,
 * and never asks one whether it is visible.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";

import { resolveMotion } from "./section-tabs.transitions";
import {
  buildPanel,
  buildTab,
  formatSectionCount,
  resolveDirection,
  resolvePhase,
  resolveSectionTabsState,
  type SectionTabsLayout,
  type SectionTabsVM,
} from "./section-tabs.vm";

export type SectionTabsSource = {
  id: string;
  label: string;
  /** Pre-formatted badge, or a count the container formats. */
  badge?: string | null;
  hint?: string | null;
  disabled?: boolean;
  /** One-line summary for hover / popover previews. */
  summary?: string | null;
  /** How many sections this tab holds. Formatted here, never in a leaf. */
  sectionCount?: number;
  /** The section(s) behind this tab. Opaque — see the file header. */
  content: ReactNode;
  /** Shown when `content` is empty. */
  emptyLabel?: string | null;
};

export type SectionTabsConnectedProps = {
  /** `"<branch>/<leaf>"` — which chrome to render. Swappable at runtime. */
  variant?: string;
  /** Name of a preset in `section-tabs.transitions.ts`. Swappable at runtime. */
  transition?: string;

  /** Scopes the generated DOM ids. Must be stable across renders and SSR. */
  id?: string;

  tabs: SectionTabsSource[];

  /** Controlled active tab. Omit for uncontrolled. */
  activeId?: string;
  defaultActiveId?: string;
  onActiveChange?: (id: string) => void;

  ariaLabel?: string;
  heading?: string | null;

  /** How long one change takes. `0` makes every change a cut. */
  durationMs?: number;

  /** When true the container measures the track and supplies overflow chevrons. */
  scrollable?: boolean;

  /** Below this width `layout` becomes `"narrow"`. */
  narrowBelowPx?: number;
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

/**
 * The structural size class. A media query rather than a ResizeObserver because
 * the decision is about the viewport, and because it must resolve identically
 * for every leaf — a rail measuring itself and a track measuring itself would
 * disagree at the boundary.
 */
function useLayout(narrowBelowPx: number): SectionTabsLayout {
  const [layout, setLayout] = useState<SectionTabsLayout>("wide");
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${narrowBelowPx - 1}px)`);
    const apply = (matches: boolean) => setLayout(matches ? "narrow" : "wide");
    apply(query.matches);
    const onChange = (event: MediaQueryListEvent) => apply(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [narrowBelowPx]);
  return layout;
}

type Change = { from: string | null; to: string };

/**
 * The transition clock.
 *
 * `progress` runs 0..1 across one change and parks at 1. It is real transport,
 * not a CSS class toggle, because the contract promises a leaf can be sampled
 * at any instant — that is what makes the lab's scrubber honest and what lets a
 * frozen fixture be a genuine sample rather than a guess.
 */
function useChangeClock(activeId: string | null, durationMs: number) {
  const [change, setChange] = useState<Change | null>(null);
  const [progress, setProgress] = useState(1);
  const previous = useRef<string | null>(activeId);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const from = previous.current;
    previous.current = activeId;
    if (activeId === null || from === activeId) return;
    if (from === null || durationMs <= 0) {
      setChange(null);
      setProgress(1);
      return;
    }

    setChange({ from, to: activeId });
    setProgress(0);

    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      setProgress(t);
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        // Drop the leaving panel only once it is fully gone, so nothing
        // invisible is left in the DOM catching clicks.
        setChange(null);
      }
    };
    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [activeId, durationMs]);

  return { leavingId: change?.from ?? null, progress };
}

export function SectionTabsConnected({
  variant,
  transition,
  id = "section-tabs",
  tabs,
  activeId: controlledActiveId,
  defaultActiveId,
  onActiveChange,
  ariaLabel = "Page sections",
  heading = null,
  durationMs = 280,
  scrollable = false,
  narrowBelowPx = 768,
}: SectionTabsConnectedProps) {
  const Leaf = useForestLeaf<SectionTabsVM>("chrome", "section-tabs", variant);

  const reducedMotion = usePrefersReducedMotion();
  const layout = useLayout(narrowBelowPx);

  const [uncontrolled, setUncontrolled] = useState<string | null>(
    defaultActiveId ?? tabs[0]?.id ?? null,
  );
  const activeId = controlledActiveId ?? uncontrolled;

  /*
   * A tab can disappear underneath us — the organizer deletes them live. Fall
   * back to the first tab rather than rendering a VM with no active panel.
   */
  const resolvedActiveId = useMemo(() => {
    if (activeId && tabs.some((tab) => tab.id === activeId)) return activeId;
    return tabs[0]?.id ?? null;
  }, [activeId, tabs]);

  const select = useCallback(
    (nextId: string) => {
      if (controlledActiveId === undefined) setUncontrolled(nextId);
      onActiveChange?.(nextId);
    },
    [controlledActiveId, onActiveChange],
  );

  const { leavingId, progress } = useChangeClock(
    resolvedActiveId,
    reducedMotion ? 0 : durationMs,
  );

  const [overlayOpen, setOverlayOpen] = useState(false);
  const onOverlayOpenChange = useCallback((open: boolean) => setOverlayOpen(open), []);

  /*
   * Overflow measurement. The leaf gets booleans and callbacks and never sees
   * the element, so a leaf that lays its track out differently still gets
   * correct affordances. The ref attaches to whatever the leaf marked
   * `data-tabs-track`.
   */
  const trackRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ back: false, forward: false });

  useEffect(() => {
    if (!scrollable) {
      setEdges({ back: false, forward: false });
      return;
    }
    const track = document.querySelector<HTMLElement>(`[data-tabs-track="${id}"]`);
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
  }, [id, scrollable, tabs.length, layout, variant]);

  const scrollBy = useCallback((delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const vm = useMemo<SectionTabsVM>(() => {
    const ids = tabs.map((tab) => tab.id);
    const direction = resolveDirection(ids, leavingId, resolvedActiveId);
    const activeTab = tabs.find((tab) => tab.id === resolvedActiveId) ?? null;

    return {
      state: resolveSectionTabsState(tabs.length, progress),
      progress,
      direction,
      reducedMotion,
      layout,
      scopeId: id,
      ariaLabel,
      heading,
      tabs: tabs.map((tab) =>
        buildTab(
          {
            id: tab.id,
            label: tab.label,
            badge: tab.badge ?? null,
            hint: tab.hint ?? null,
            disabled: tab.disabled,
            onSelect: () => select(tab.id),
            onPreview: tab.summary ? () => undefined : null,
            preview: tab.summary
              ? {
                  title: tab.label,
                  summary: tab.summary,
                  meta:
                    tab.sectionCount === undefined
                      ? null
                      : formatSectionCount(tab.sectionCount),
                }
              : null,
          },
          resolvedActiveId,
          id,
        ),
      ),
      panels: tabs.map((tab) => {
        const phase = resolvePhase(tab.id, resolvedActiveId, leavingId, progress);
        return buildPanel(
          { tabId: tab.id, content: tab.content, emptyLabel: tab.emptyLabel },
          phase,
          resolveMotion(transition, { phase, progress, direction }, reducedMotion),
          id,
        );
      }),
      overlay: activeTab
        ? {
            state: overlayOpen ? "open" : "closed",
            side: "bottom",
            align: "start",
            triggerLabel: activeTab.label,
            triggerAriaLabel: `Choose a section — ${activeTab.label} selected`,
            onOpenChange: onOverlayOpenChange,
          }
        : null,
      overflow:
        scrollable && (edges.back || edges.forward)
          ? {
              canScrollBack: edges.back,
              canScrollForward: edges.forward,
              onScrollBack: () => scrollBy(-200),
              onScrollForward: () => scrollBy(200),
              backLabel: "Scroll tabs left",
              forwardLabel: "Scroll tabs right",
            }
          : null,
      emptyLabel: "No tabs yet — drag a section in to make one.",
    };
  }, [
    ariaLabel,
    edges.back,
    edges.forward,
    heading,
    id,
    layout,
    leavingId,
    onOverlayOpenChange,
    overlayOpen,
    progress,
    reducedMotion,
    resolvedActiveId,
    scrollBy,
    scrollable,
    select,
    tabs,
    transition,
  ]);

  return <Leaf {...vm} />;
}

export default SectionTabsConnected;
