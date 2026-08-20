"use client";

/**
 * Forest Primer — connected container.
 *
 * This is the ONLY file in the tree allowed to have hooks, effects, clocks,
 * measurements or media queries. It does four things:
 *
 *  1. reads the real `FOREST` and turns it into finished strings — every
 *     species name, count, path and ratio in the primer comes from here, so the
 *     page that explains derived structure is itself derived;
 *  2. owns the scroll transport (an IntersectionObserver to know when to
 *     listen, a scroll/resize listener to know how far);
 *  3. owns `prefers-reduced-motion`, which resolves to a primer that has
 *     already arrived rather than a slower one;
 *  4. hands the result to whichever leaf the caller picked.
 *
 * Swapping leaves must never require touching this file.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EDITOR_MODE_PRESETS } from "@/lib/editor-mode-presets";
import { useForestLeaf } from "@/lib/use-forest-leaf";
import { FOREST } from "@/trees/generated";

import {
  buildChapters,
  clampProgress,
  formatPositionLabel,
  resolveChapterCursor,
  resolveForestPrimerState,
  settleChapters,
  summarizeForest,
  PRIMER_BODY,
  PRIMER_CHAPTER_COUNT,
  PRIMER_CLOSING,
  PRIMER_EYEBROW,
  PRIMER_HEADLINE,
  type ForestPrimerVM,
} from "./forest-primer.vm";

/** Stable, so the one memo in this file is not invalidated every render. */
const DEFAULT_EXAMPLE = { species: "narrative", tree: "forest-primer" } as const;

export type ForestPrimerConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;
  /** The tree whose path chapter 1 draws. Defaults to the primer itself. */
  example?: { species: string; tree: string };
  headline?: string;
  body?: string | null;
};

/**
 * Where the primer sits in the scroll, as 0..1.
 *
 * The mapping is deliberately not "top of element hits top of viewport": a
 * chapter should be finished by the time it is a third of the way up the
 * screen, or the last chapter only completes once it has left. Start when the
 * top crosses 85% of the viewport, finish when the bottom crosses 15%.
 */
function measureProgress(element: HTMLElement, viewportHeight: number): number {
  const rect = element.getBoundingClientRect();
  const start = viewportHeight * 0.85;
  const end = viewportHeight * 0.15;
  const span = Math.max(1, rect.height - (start - end));
  return clampProgress((start - rect.top) / span);
}

/** Scroll transport. Lives here so leaves stay pure. */
function useScrollProgress(enabled: boolean) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const sample = useCallback(() => {
    const element = hostRef.current;
    if (!element) return;
    setProgress(measureProgress(element, window.innerHeight || 1));
  }, []);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;
    if (!enabled) {
      setProgress(1);
      return;
    }

    let listening = false;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        sample();
      });
    };

    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    /*
     * The observer is not the transport — it decides whether the transport is
     * worth listening for. A scroll handler that runs while the primer is three
     * screens away is work nobody can see.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) listen(entry.isIntersecting);
        sample();
      },
      { rootMargin: "0px" },
    );
    observer.observe(element);
    sample();

    return () => {
      observer.disconnect();
      listen(false);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, sample]);

  return { hostRef, progress };
}

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

export function ForestPrimerConnected({
  variant,
  example = DEFAULT_EXAMPLE,
  headline = PRIMER_HEADLINE,
  body = PRIMER_BODY,
}: ForestPrimerConnectedProps) {
  const Leaf = useForestLeaf<ForestPrimerVM>("narrative", "forest-primer", variant);
  const reducedMotion = usePrefersReducedMotion();
  const { hostRef, progress } = useScrollProgress(!reducedMotion);

  /*
   * The one read of the repository. Everything countable in the primer comes
   * out of this call, which is why the primer cannot claim a number the rest of
   * the site would contradict.
   */
  const summary = useMemo(
    () =>
      summarizeForest(FOREST, {
        preferred: example,
        presetCount: Object.keys(EDITOR_MODE_PRESETS).length,
      }),
    [example],
  );

  const cursor = resolveChapterCursor(progress, PRIMER_CHAPTER_COUNT);
  const built = buildChapters(summary, cursor);
  const chapters = reducedMotion ? settleChapters(built) : built;
  const activeIndex = reducedMotion ? chapters.length - 1 : cursor.activeIndex;

  const vm: ForestPrimerVM = {
    state: resolveForestPrimerState(chapters.length, reducedMotion ? 1 : progress),
    progress: reducedMotion ? 1 : progress,
    reducedMotion,
    eyebrow: PRIMER_EYEBROW,
    headline,
    body,
    chapters,
    activeIndex,
    positionLabel: formatPositionLabel(activeIndex, chapters.length),
    closingLine: PRIMER_CLOSING,
  };

  return (
    <div ref={hostRef}>
      <Leaf {...vm} />
    </div>
  );
}

export default ForestPrimerConnected;
