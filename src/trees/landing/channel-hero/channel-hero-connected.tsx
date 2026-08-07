"use client";

/**
 * Channel Hero — connected container.
 *
 * The ONLY file in this tree allowed hooks, clocks, media queries or fetches.
 * It owns the entrance clock and the raw → pre-formatted conversion, then hands
 * a finished VM to whichever leaf the caller picked. Swapping leaves never
 * touches this file.
 *
 * Note the shape of the props: they are RAW. Viewer counts arrive as numbers
 * and uptime as minutes, and they become "3.2K watching" / "live for 2h 14m"
 * here — because a leaf that formats is a leaf that cannot be swapped.
 */

import { useEffect, useMemo, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  buildAction,
  buildLink,
  clampProgress,
  formatAudience,
  formatElapsed,
  resolveChannelHeroState,
  type ChannelHeroAction,
  type ChannelHeroActionKind,
  type ChannelHeroImage,
  type ChannelHeroLink,
  type ChannelHeroVM,
} from "./channel-hero.vm";

export type ChannelHeroConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;

  channelName: string;
  channelHandle: string;
  channelAvatar?: ChannelHeroImage | null;

  headlineLead: string;
  headlineBadge?: { label: string; image?: ChannelHeroImage | null } | null;
  headlineHighlight: string;
  subheadline?: string | null;

  /** Raw stream state. `null` renders a static marketing hero. */
  stream?: {
    isLive: boolean;
    title?: string | null;
    category?: string | null;
    /** Raw viewer count. Formatted here, never in a leaf. */
    viewers?: number | null;
    /** Raw uptime in minutes. Formatted here, never in a leaf. */
    uptimeMinutes?: number | null;
    /** Pre-written line for the offline case — "last live 14 hours ago". */
    offlineNote?: string | null;
  } | null;

  /** True while the channel is still being resolved. */
  loading?: boolean;

  actions?: Array<{
    id: string;
    kind: ChannelHeroActionKind;
    label: string;
    href: string;
    tooltip?: string;
    eyebrow?: string | null;
    detail?: string | null;
    onActivate?: () => void;
  }>;

  linksEyebrow?: string | null;
  links?: Array<{
    id: string;
    label: string;
    detail: string;
    href: string;
    iconId?: string;
    recommended?: boolean;
    onActivate?: () => void;
  }>;

  /** Milliseconds the entrance takes. `0` renders arrived immediately. */
  entranceMs?: number;
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
 * The entrance. Monotonic 0 → 1, once. A hero that loops is a hero that keeps
 * pulling the eye back to itself after the visitor has moved on.
 */
function useEntrance(durationMs: number, enabled: boolean): number {
  const [progress, setProgress] = useState(enabled ? 0 : 1);

  useEffect(() => {
    if (!enabled || durationMs <= 0) {
      setProgress(1);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const next = clampProgress((now - start) / durationMs);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, enabled]);

  return progress;
}

export function ChannelHeroConnected({
  variant,
  channelName,
  channelHandle,
  channelAvatar = null,
  headlineLead,
  headlineBadge = null,
  headlineHighlight,
  subheadline = null,
  stream = null,
  loading = false,
  actions = [],
  linksEyebrow = null,
  links = [],
  entranceMs = 900,
}: ChannelHeroConnectedProps) {
  const Leaf = useForestLeaf<ChannelHeroVM>("landing", "channel-hero", variant);
  const reducedMotion = usePrefersReducedMotion();
  // Reduced motion means arrived, not frozen mid-entrance.
  const progress = useEntrance(entranceMs, !reducedMotion && !loading);

  const vm = useMemo<ChannelHeroVM>(() => {
    const state = resolveChannelHeroState({
      isLive: stream?.isLive ?? false,
      hasChannel: channelName.length > 0,
      isLoading: loading,
    });

    const builtActions: ChannelHeroAction[] = actions.map(buildAction);
    const builtLinks: ChannelHeroLink[] = links.map(buildLink);

    return {
      state,
      progress: reducedMotion ? 1 : progress,
      reducedMotion,

      channelName,
      channelHandle,
      channelAvatar,

      headlineLead,
      headlineBadge: headlineBadge
        ? { label: headlineBadge.label, image: headlineBadge.image ?? null }
        : null,
      headlineHighlight,
      subheadline,

      status: stream
        ? {
            label: stream.isLive ? "LIVE" : "Offline",
            title: stream.title ?? null,
            category: stream.category ?? null,
            audience: stream.isLive ? formatAudience(stream.viewers ?? null) : null,
            elapsed: stream.isLive
              ? formatElapsed(stream.uptimeMinutes ?? null)
              : (stream.offlineNote ?? null),
          }
        : null,

      actions: builtActions,
      linksEyebrow,
      links: builtLinks,
    };
  }, [
    actions,
    channelAvatar,
    channelHandle,
    channelName,
    headlineBadge,
    headlineHighlight,
    headlineLead,
    links,
    linksEyebrow,
    loading,
    progress,
    reducedMotion,
    stream,
    subheadline,
  ]);

  return <Leaf {...vm} />;
}
