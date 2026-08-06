"use client";

/**
 * Aurora Headline — connected container.
 *
 * This is the ONLY file in the tree allowed to have hooks, effects, clocks or
 * fetches. It assembles the VM and hands it to whichever leaf the caller picked.
 * Swapping leaves must never require touching this file.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  clampProgress,
  resolveAuroraHeadlineVMState,
  type AuroraHeadlineVM,
  type AuroraHeadlineVMItem,
} from "./aurora-headline.vm";

export type AuroraHeadlineVMConnectedProps = {
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

export function AuroraHeadlineConnected({
  variant,
  items = [],
  headline = "Ship the motion, not the machinery",
  durationMs = 6000,
}: AuroraHeadlineVMConnectedProps) {
  const Leaf = useForestLeaf<AuroraHeadlineVM>("motion", "aurora-headline", variant);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useProgress(durationMs, !reducedMotion);

  const formattedItems = useMemo<AuroraHeadlineVMItem[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        label: item.label,
        // Pre-format here. A leaf may never call padStart, toFixed or toLocaleString.
        detail: String(item.index + 1).padStart(2, "0"),
      })),
    [items],
  );

  const vm: AuroraHeadlineVM = {
    state: resolveAuroraHeadlineVMState(formattedItems.length, progress),
    progress,
    reducedMotion,
    eyebrow: "Aurora Headline",
    headline,
    body: null,
    items: formattedItems,
    cta: null,
  };

  return <Leaf {...vm} />;
}
