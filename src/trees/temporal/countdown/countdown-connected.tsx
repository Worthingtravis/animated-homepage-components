"use client";

/**
 * Countdown — connected container.
 *
 * This is the ONLY file in the tree allowed to have hooks, effects, clocks or
 * fetches. It holds exactly one interval no matter how many leaves exist, turns
 * the remainder into padded strings, and hands the result to whichever leaf the
 * caller picked. Swapping leaves must never require touching this file.
 *
 * Two decisions worth reading before you change anything here:
 *
 * 1. **`endsAt` comes in, it is never derived.** The caller picks the deadline
 *    from whatever instant is authoritative for it — a server response, a
 *    scheduled drop, a period boundary — and this container only counts toward
 *    the number it was handed. It never asks "which period am I in?", because a
 *    browser clock sitting near a boundary would answer differently than the
 *    render that produced the page.
 *
 * 2. **`serverNow` decides what the first paint says.** Given one, the first
 *    frame is deterministic and matches whatever rendered it. Without one there
 *    is no honest clock until the browser mounts, so the tree reports
 *    `state: "none"` for that first frame and the leaf renders nothing — a
 *    blank beat, rather than a number the server and the client disagree about.
 */

import { useEffect, useMemo, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  buildCountdownUnits,
  COUNTDOWN_UNIT_MS,
  formatRemainingLabel,
  resolveCountdownState,
  windowProgress,
  type CountdownVM,
} from "./countdown.vm";

export type CountdownConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;

  /**
   * Epoch ms for the deadline, chosen by whoever owns the truth. `null` means
   * this surface genuinely has no clock — the tree renders nothing rather than
   * inventing a window.
   */
  endsAt: number | null;

  /**
   * Epoch ms the window opened. Optional: supply it and leaves can draw a fill,
   * omit it and `progress` stays 0 so nothing draws a dial it cannot fill
   * honestly.
   */
  startsAt?: number | null;

  /**
   * The instant the caller's render was built from. Supply it for a stable
   * first paint (see the note above).
   */
  serverNow?: number | null;

  /** Below this many ms remaining, the state flips to `"urgent"`. */
  urgentBelowMs?: number;

  /** Pre-formatted copy. */
  eyebrow?: string | null;
  headline?: string | null;
  body?: string | null;
  expiredLabel?: string | null;
  cta?: CountdownVM["cta"];

  /**
   * The deadline in words. Pass a finished string, or let the container format
   * one — in which case pick the timezone explicitly, because "the browser's"
   * is a different answer on the server than in the tab.
   */
  deadlineLabel?: string | null;
  timeZone?: string;
};

/**
 * One interval for the whole tree. `null` until the browser has a clock, so the
 * caller-supplied `serverNow` is what the first frame reads.
 */
function useNow(seed: number | null, active: boolean): number | null {
  const [now, setNow] = useState<number | null>(seed);

  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), COUNTDOWN_UNIT_MS.SECOND);
    return () => clearInterval(id);
  }, [active]);

  return now;
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

export function CountdownConnected({
  variant,
  endsAt,
  startsAt = null,
  serverNow = null,
  urgentBelowMs = COUNTDOWN_UNIT_MS.HOUR,
  eyebrow = null,
  headline = null,
  body = null,
  expiredLabel = "Window closed",
  cta = null,
  deadlineLabel,
  timeZone = "UTC",
}: CountdownConnectedProps) {
  const Leaf = useForestLeaf<CountdownVM>("temporal", "countdown", variant);
  const reducedMotion = usePrefersReducedMotion();
  const now = useNow(serverNow, endsAt !== null);

  const formattedDeadline = useMemo(() => {
    if (deadlineLabel !== undefined) return deadlineLabel;
    if (endsAt === null) return null;
    // Formatting happens HERE. A leaf may never call toLocaleString.
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(new Date(endsAt));
  }, [deadlineLabel, endsAt, timeZone]);

  const vm = useMemo<CountdownVM>(() => {
    const remainingMs = endsAt === null || now === null ? null : endsAt - now;
    const started = startsAt === null || now === null ? true : now >= startsAt;
    const state = resolveCountdownState(remainingMs, { urgentBelowMs, started });
    const live = state === "counting" || state === "urgent";

    return {
      state,
      progress:
        remainingMs === null || now === null || endsAt === null
          ? 0
          : windowProgress(now, endsAt, startsAt),
      reducedMotion,
      eyebrow: state === "none" ? null : eyebrow,
      headline: state === "none" ? null : headline,
      body: state === "none" ? null : body,
      units: live && remainingMs !== null ? buildCountdownUnits(remainingMs) : [],
      remainingLabel:
        live && remainingMs !== null ? formatRemainingLabel(remainingMs) : null,
      deadlineLabel: state === "none" ? null : formattedDeadline,
      expiredLabel: state === "none" ? null : expiredLabel,
      cta: state === "none" ? null : cta,
    };
  }, [
    body,
    cta,
    endsAt,
    expiredLabel,
    eyebrow,
    formattedDeadline,
    headline,
    now,
    reducedMotion,
    startsAt,
    urgentBelowMs,
  ]);

  return <Leaf {...vm} />;
}

export default CountdownConnected;
