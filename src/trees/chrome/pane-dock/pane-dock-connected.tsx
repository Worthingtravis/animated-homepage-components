"use client";

/**
 * Pane Dock — connected container.
 *
 * The ONLY file in this tree allowed hooks, effects, clocks or measurement. It
 * assembles the VM and hands it to whichever leaf the caller picked. Swapping
 * leaves must never require touching this file.
 *
 * ── What it owns ───────────────────────────────────────────────────────────
 *  - which panes are open right now (the POSTURE plus the person's diffs)
 *  - the open/close clock
 *  - `density`, which is a measurement
 *  - reduced motion
 *  - every string a leaf displays
 *
 * ── The posture rule, enforced here and nowhere else ───────────────────────
 * `posture` is a preset: it says what you LAND on. A person's own open/dock is
 * a DIFF against it, held separately, so a posture can change its mind about a
 * pane without inheriting a stale preference from another one — and so nothing
 * here can quietly re-close something the person opened. That is the whole
 * reason `overrides` is its own map instead of a mutated copy of the preset.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";
import {
  clampProgress,
  formatDockedLabel,
  initialFor,
  resolveMotion,
  resolvePaneDockState,
  type PaneDockDoor,
  type PaneDockPane,
  type PaneDockSlot,
  type PaneDockVM,
} from "./pane-dock.vm";

/** Raw, unformatted input. One entry per pane the surface knows about. */
export type PaneDockInput = {
  id: string;
  /** A verb wherever the pane is an action — "Find", "Send". */
  label: string;
  slot: PaneDockSlot;
  hint?: string | null;
  /** Raw count. Formatted here; a leaf never sees a number. */
  count?: number | null;
  /** Pre-decided status word — "Live". Wins over `count` when both are set. */
  status?: string | null;
  content: React.ReactNode;
  /** `false` for the rare pane with nowhere to go. Defaults to dockable. */
  dockable?: boolean;
};

export type PaneDockConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;
  /** What this screen is FOR. Required, in the viewer's words — see the VM. */
  purpose: PaneDockVM["purpose"];
  panes: PaneDockInput[];
  /**
   * THE PRESET: the ids this surface opens on arrival. Everything else starts
   * docked. Not a permission set — every pane stays reachable through its door.
   */
  posture: string[];
  /** Milliseconds for one open/close. */
  durationMs?: number;
  /** Below this width the dock is structurally different, not just smaller. */
  narrowAt?: number;
  emptyLabel?: string;
};

/**
 * A one-shot 0..1 ramp, restarted whenever `key` changes. Not a loop: one pane
 * change is one run, and it settles at 1 so a resting VM is a real frame rather
 * than a special case a leaf has to know about.
 */
function useOneShot(key: string | null, durationMs: number, enabled: boolean) {
  const [progress, setProgress] = useState(1);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (key === null || !enabled) {
      setProgress(1);
      return;
    }
    startedAt.current = null;
    let frame = 0;
    const tick = (now: number) => {
      startedAt.current ??= now;
      const elapsed = now - startedAt.current;
      const next = clampProgress(elapsed / durationMs);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, durationMs, enabled]);

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

/** `density` is a MEASUREMENT, so it lives here. See the VM's note. */
function useDensity(narrowAt: number): PaneDockVM["density"] {
  const [density, setDensity] = useState<PaneDockVM["density"]>("wide");
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${narrowAt}px)`);
    const apply = (matches: boolean) => setDensity(matches ? "narrow" : "wide");
    apply(query.matches);
    const onChange = (event: MediaQueryListEvent) => apply(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [narrowAt]);
  return density;
}

export function PaneDockConnected({
  variant,
  purpose,
  panes,
  posture,
  durationMs = 260,
  narrowAt = 900,
  emptyLabel = "No panes to show.",
}: PaneDockConnectedProps) {
  const Leaf = useForestLeaf<PaneDockVM>("chrome", "pane-dock", variant);
  const reducedMotion = usePrefersReducedMotion();
  const density = useDensity(narrowAt);
  const scopeId = useId().replace(/:/g, "");

  // The person's diffs, ON TOP of the posture — never merged into it.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [moving, setMoving] = useState<{
    id: string;
    kind: "opening" | "closing";
  } | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // A posture change is a new preset, so the diffs against the OLD one go. This
  // is the "never inherit a stale preference from another posture" rule, and it
  // is one line because the two were never mixed together in the first place.
  const postureKey = posture.join(",");
  useEffect(() => setOverrides({}), [postureKey]);

  const progress = useOneShot(
    moving && `${moving.id}:${moving.kind}`,
    durationMs,
    !reducedMotion,
  );

  useEffect(() => {
    if (progress >= 1) setMoving(null);
  }, [progress]);

  const isOpen = useCallback(
    (id: string) => overrides[id] ?? posture.includes(id),
    [overrides, posture],
  );

  const open = useCallback((id: string) => {
    setOverrides((cur) => ({ ...cur, [id]: true }));
    setMoving({ id, kind: "opening" });
    setOverlayOpen(false);
  }, []);

  const dock = useCallback((id: string) => {
    setOverrides((cur) => ({ ...cur, [id]: false }));
    setMoving({ id, kind: "closing" });
  }, []);

  const vm = useMemo<PaneDockVM>(() => {
    const openPanes: PaneDockPane[] = [];
    const doors: PaneDockDoor[] = [];

    for (const pane of panes) {
      const badge = pane.status ?? formatCount(pane.count);
      if (isOpen(pane.id)) {
        const dockable = pane.dockable ?? true;
        openPanes.push({
          id: pane.id,
          label: pane.label,
          hint: pane.hint ?? null,
          badge,
          initial: initialFor(pane.label),
          slot: pane.slot,
          regionId: `${scopeId}-${pane.id}-region`,
          headerId: `${scopeId}-${pane.id}-header`,
          content: pane.content,
          motion: resolveMotion(
            moving?.id === pane.id ? moving.kind : "resting",
            progress,
            reducedMotion,
          ),
          onDock: dockable ? () => dock(pane.id) : null,
          dockAriaLabel: dockable ? `Put ${pane.label} away` : null,
        });
      } else {
        doors.push({
          id: pane.id,
          label: pane.label,
          hint: pane.hint ?? null,
          badge,
          initial: initialFor(pane.label),
          slot: pane.slot,
          ariaLabel: `Open ${pane.label}`,
          onOpen: () => open(pane.id),
        });
      }
    }

    return {
      state: resolvePaneDockState(
        openPanes.length,
        doors.length,
        moving !== null && progress < 1,
      ),
      progress,
      reducedMotion,
      density,
      scopeId,
      purpose,
      open: openPanes,
      docked: doors,
      dockedLabel: formatDockedLabel(doors.length),
      overlay:
        doors.length === 0
          ? null
          : {
              state: overlayOpen ? "open" : "closed",
              triggerLabel: `${doors.length} more`,
              triggerAriaLabel:
                doors.length === 1
                  ? "Show 1 docked pane"
                  : `Show ${doors.length} docked panes`,
              onOpenChange: setOverlayOpen,
            },
      emptyLabel,
    };
  }, [
    panes,
    isOpen,
    scopeId,
    moving,
    progress,
    reducedMotion,
    density,
    purpose,
    overlayOpen,
    emptyLabel,
    open,
    dock,
  ]);

  return <Leaf {...vm} />;
}

/** Local so the VM's `formatBadge` stays the one a caller reaches for. */
function formatCount(count: number | null | undefined): string | null {
  if (count == null || count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}
