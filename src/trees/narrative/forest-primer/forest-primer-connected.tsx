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

/** Where the eye is: a fixed height down the viewport, a little below centre. */
const READING_LINE = 0.55;

/**
 * Where the primer sits in the scroll, as 0..1.
 *
 * The primer's transport is not "how far past this element have we scrolled" —
 * it is "how far INTO it are we reading". Those are a whole viewport apart, and
 * the difference is the entire bug this replaces: measured against the element
 * entering and leaving the viewport, progress only reached 1/6 once the reader
 * had scrolled a sixth of the primer's height PAST its start line, by which
 * point chapter 2 was already on screen. Every chapter therefore lit up about a
 * screen after the reader had passed it, which reads as an animation firing
 * late rather than as a chapter arriving.
 *
 * So the measurement is a reading line — a fixed height down the viewport,
 * a little below centre, where the eye actually is. Progress is that line's
 * position expressed as a fraction of the primer's own height, which makes the
 * cursor a statement about WHICH PART OF THE PRIMER IS BEING READ. A chapter
 * occupying the middle sixth of the primer is the active one exactly while the
 * reading line is inside it.
 *
 * It follows that 0 means the primer's top has not yet reached the line and 1
 * means its bottom has passed it — so the last chapter finishes while it is
 * still on screen, and a primer sitting near the top of the document (which is
 * where this one sits on `/`) opens partway into chapter 1 rather than dimmed
 * and waiting for a scroll that already happened.
 *
 * `chapters` is where the line actually is, chapter by chapter. Without it the
 * fraction is taken against the primer's total height, which assumes every
 * chapter is the same size — and chapter 5 is nearly three times the average,
 * so the cursor would finish it and move on while the reader was still halfway
 * down it. With it, chapter `i` is active for exactly as long as the line is
 * inside chapter `i`, whatever that is worth in pixels. A leaf that does not
 * lay its chapters out as a column simply does not supply it, and the fraction
 * is the fallback.
 */
export function measureProgress(
  rect: { top: number; height: number },
  viewportHeight: number,
  chapters?: ReadonlyArray<{ top: number; bottom: number }> | null,
): number {
  const line = viewportHeight * READING_LINE;

  if (chapters && chapters.length > 0) {
    const count = chapters.length;
    if (line <= chapters[0].top) return 0;
    if (line >= chapters[count - 1].bottom) return 1;
    const index = chapters.findIndex((chapter) => line < chapter.bottom);
    if (index < 0) return 1;
    const chapter = chapters[index];
    const within = clampProgress((line - chapter.top) / Math.max(1, chapter.bottom - chapter.top));
    return clampProgress((index + within) / count);
  }

  return clampProgress((line - rect.top) / Math.max(1, rect.height));
}

/**
 * The chapters as the leaf laid them out, or null if it did not lay them out as
 * a top-to-bottom column. `data-chapter` is the only thing this container reads
 * out of the leaf's DOM, and it reads it as GEOMETRY, never as content — the
 * count has to match the chapters it handed over and they have to descend, or
 * the measurement means nothing and the fraction takes over instead.
 */
function readChapterExtents(
  host: HTMLElement,
  expected: number,
): Array<{ top: number; bottom: number }> | null {
  const nodes = host.querySelectorAll<HTMLElement>("[data-chapter]");
  if (nodes.length !== expected) return null;
  const extents: Array<{ top: number; bottom: number }> = [];
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    const previous = extents[extents.length - 1];
    if (previous && rect.top < previous.top) return null;
    extents.push({ top: rect.top, bottom: rect.bottom });
  }
  return extents;
}

/** Scroll transport. Lives here so leaves stay pure. */
function useScrollProgress(enabled: boolean) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const sample = useCallback(() => {
    const element = hostRef.current;
    if (!element) return;
    setProgress(
      measureProgress(
        element.getBoundingClientRect(),
        window.innerHeight || 1,
        readChapterExtents(element, PRIMER_CHAPTER_COUNT),
      ),
    );
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
