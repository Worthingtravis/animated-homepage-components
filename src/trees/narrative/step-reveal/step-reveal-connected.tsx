"use client";

/**
 * Step Reveal — connected container.
 *
 * The ONLY file in this tree allowed hooks, clocks or media queries. It owns
 * autoplay, manual steering, and the raw → pre-formatted conversion, then hands
 * a finished VM to whichever leaf the caller picked. Swapping leaves never
 * touches this file.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  buildSteps,
  clampProgress,
  formatPositionLabel,
  resolveStepCursor,
  resolveStepRevealState,
  type StepRevealVM,
} from "./step-reveal.vm";

export type StepRevealConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;
  /** Raw, unformatted steps. Ordinals and positions are derived here. */
  steps: Array<{ id: string; title: string; description: string; meta?: string | null }>;
  eyebrow?: string | null;
  headline: string;
  body?: string | null;
  cta?: { label: string; href: string } | null;
  /** Milliseconds each step holds before advancing. `0` disables autoplay. */
  dwellMs?: number;
  /** When false the sequence is passive — leaves render read-only. */
  steerable?: boolean;
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

export function StepRevealConnected({
  variant,
  steps,
  eyebrow = null,
  headline,
  body = null,
  cta = null,
  dwellMs = 4000,
  steerable = true,
}: StepRevealConnectedProps) {
  const Leaf = useForestLeaf<StepRevealVM>("narrative", "step-reveal", variant);
  const reducedMotion = usePrefersReducedMotion();

  const [progress, setProgress] = useState(0);
  /** Set when the viewer steers; suspends autoplay so we never fight them. */
  const steeredAt = useRef<number | null>(null);

  const total = steps.length;
  const autoplay = dwellMs > 0 && total > 0 && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    let frame = 0;
    let start: number | null = null;
    const cycleMs = dwellMs * total;

    const tick = (now: number) => {
      if (steeredAt.current === null) {
        start ??= now;
        setProgress(((now - start) % cycleMs) / cycleMs);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoplay, dwellMs, total]);

  const onSelectStep = useCallback(
    (index: number) => {
      if (total === 0) return;
      steeredAt.current = index;
      // Land mid-step so the active step reads as settled, not mid-transition.
      setProgress(clampProgress((index + 0.5) / total));
    },
    [total],
  );

  const vm = useMemo<StepRevealVM>(() => {
    // Reduced motion shows the finished sequence rather than a frozen frame.
    const effective = reducedMotion && steeredAt.current === null ? 1 : progress;
    const { activeIndex, stepProgress } = resolveStepCursor(effective, total);
    return {
      state: resolveStepRevealState(total, effective),
      progress: effective,
      steps: buildSteps(steps, activeIndex),
      activeIndex,
      stepProgress,
      positionLabel: formatPositionLabel(activeIndex, total),
      reducedMotion,
      eyebrow,
      headline,
      body,
      onSelectStep: steerable ? onSelectStep : null,
      cta,
    };
  }, [body, cta, eyebrow, headline, onSelectStep, progress, reducedMotion, steerable, steps, total]);

  return <Leaf {...vm} />;
}
