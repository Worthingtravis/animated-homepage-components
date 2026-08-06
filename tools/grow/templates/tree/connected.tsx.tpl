"use client";

/**
 * __TREE_TITLE__ — connected container.
 *
 * This is the ONLY file in the tree allowed to have hooks, effects, clocks or
 * fetches. It assembles the VM and hands it to whichever leaf the caller picked.
 * Swapping leaves must never require touching this file.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  clampProgress,
  resolve__VM_TYPE__State,
  type __VM_TYPE__,
  type __VM_TYPE__Item,
} from "./__TREE__.vm";

export type __VM_TYPE__ConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;
  /** Raw, unformatted input. Formatting happens here, never in the leaf. */
  items?: Array<{ id: string; label: string; index: number }>;
  headline?: string;
  /** Seconds for one full transport cycle. */
  durationMs?: number;
};

/** rAF clock normalized to 0..1. Lives here so leaves stay pure. */
function useProgress(durationMs: number, enabled: boolean): number {
  const [progress, setProgress] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProgress(0);
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      startedAt.current ??= now;
      const elapsed = (now - startedAt.current) % durationMs;
      setProgress(clampProgress(elapsed / durationMs));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, enabled]);

  return progress;
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

export function __TREE_PASCAL__Connected({
  variant,
  items = [],
  headline = "Ship the motion, not the machinery",
  durationMs = 6000,
}: __VM_TYPE__ConnectedProps) {
  const Leaf = useForestLeaf<__VM_TYPE__>("__SPECIES__", "__TREE__", variant);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useProgress(durationMs, !reducedMotion);

  const formattedItems = useMemo<__VM_TYPE__Item[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        label: item.label,
        // Pre-format here. A leaf may never call padStart, toFixed or toLocaleString.
        detail: String(item.index + 1).padStart(2, "0"),
      })),
    [items],
  );

  const vm: __VM_TYPE__ = {
    state: resolve__VM_TYPE__State(formattedItems.length, progress),
    progress,
    reducedMotion,
    eyebrow: "__TREE_TITLE__",
    headline,
    body: null,
    items: formattedItems,
    cta: null,
  };

  return <Leaf {...vm} />;
}
