"use client";

/**
 * Layered Poster — connected container.
 *
 * This is the ONLY file in the tree allowed to have hooks, effects, clocks or
 * fetches. It assembles the VM and hands it to whichever leaf the caller picked.
 * Swapping leaves must never require touching this file.
 *
 * Everything Aceternity's `gta-vi-poster` kept inside the component lives here
 * instead: the entrance clock (it was a `motion` timeline), the replay counter
 * (it was `useState`), the reduced-motion query, and the normalization of an
 * illustrator's per-plate overscans into the contract's `depth`. The leaf below
 * receives a position and a list, and owns none of it.
 *
 * The entrance runs ONCE and stops at 1 — this is a landing transport, not a
 * loop. Replaying restarts it, which is the only thing the original's replay
 * button ever did.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  clampProgress,
  normalizeDepths,
  resolveLayeredPosterState,
  type LayeredPosterLayer,
  type LayeredPosterReveal,
  type LayeredPosterVM,
} from "./layered-poster.vm";

/** A plate as an illustrator hands it over, before the contract sees it. */
export type LayeredPosterPlateInput = {
  id: string;
  src: string;
  /** Describes the plate for maintainers. Never announced — the sheet has one name. */
  name: string;
  width: number;
  height: number;
  /** The overscan the art was composed at. Normalized to `depth` here. */
  initialScale: number;
  /** Seconds into the entrance at which this plate begins. */
  revealAfterMs: number;
  reveal?: LayeredPosterReveal;
  focusPull?: boolean;
};

export type LayeredPosterConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;
  /** Raw, unnormalized plates. Order is back to front. */
  plates?: LayeredPosterPlateInput[];
  title?: string;
  caption?: string | null;
  cameraScale?: number;
  fit?: number;
  /** Milliseconds for the whole entrance. Seconds never reach a leaf. */
  durationMs?: number;
  replayLabel?: string;
  isLoading?: boolean;
};

/**
 * rAF clock for a ONE-SHOT entrance, normalized to 0..1. `runId` restarts it —
 * that is the replay button, and it is why the leaf needs no key.
 */
function useEntrance(durationMs: number, runId: number, enabled: boolean): number {
  const [progress, setProgress] = useState(enabled ? 0 : 1);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProgress(1);
      return;
    }
    startedAt.current = null;
    setProgress(0);

    let frame = 0;
    const tick = (now: number) => {
      startedAt.current ??= now;
      const elapsed = now - startedAt.current;
      const next = clampProgress(elapsed / durationMs);
      setProgress(next);
      // A landing transport arrives and stays arrived. Stop the loop rather
      // than burning frames redrawing a finished poster.
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, runId, enabled]);

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

export function LayeredPosterConnected({
  variant,
  plates = [],
  title = "Key art",
  caption = null,
  cameraScale = 1.14,
  fit = 0.96,
  durationMs = 3600,
  replayLabel = "Replay",
  isLoading = false,
}: LayeredPosterConnectedProps) {
  const Leaf = useForestLeaf<LayeredPosterVM>("landing", "layered-poster", variant);
  const reducedMotion = usePrefersReducedMotion();
  const [runId, setRunId] = useState(0);
  const progress = useEntrance(durationMs, runId, !reducedMotion && plates.length > 0);

  const layers = useMemo<LayeredPosterLayer[]>(() => {
    // One plate may pull focus. The contract promises it, so enforce it here
    // rather than hoping every caller reads the comment.
    const focusIndex = plates.findIndex((plate) => plate.focusPull);
    return normalizeDepths(plates).map((plate, index) => ({
      id: plate.id,
      image: { src: plate.src, alt: plate.name, width: plate.width, height: plate.height },
      depth: plate.depth,
      // Seconds in, fraction out — a leaf is handed a position, never a rate.
      revealAt: clampProgress(plate.revealAfterMs / durationMs),
      reveal: plate.reveal ?? "fade",
      focusPull: index === focusIndex,
    }));
  }, [plates, durationMs]);

  const onReplay = useCallback(() => setRunId((id) => id + 1), []);

  const vm: LayeredPosterVM = {
    state: resolveLayeredPosterState({ layerCount: layers.length, isLoading, progress }),
    progress,
    reducedMotion,
    title,
    caption,
    layers,
    cameraScale,
    fit,
    // No entrance to replay when the viewer asked for no motion.
    replay: reducedMotion ? null : { label: replayLabel, onActivate: onReplay },
  };

  return <Leaf {...vm} />;
}

export default LayeredPosterConnected;
