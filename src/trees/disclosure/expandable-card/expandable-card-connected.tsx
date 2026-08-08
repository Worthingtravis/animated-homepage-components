"use client";

/**
 * Expandable Card — connected container.
 *
 * This is the ONLY file in the tree allowed hooks, effects, measurements or
 * document listeners. It owns six things that would otherwise be re-implemented
 * inside every card grid that wants this effect:
 *
 *  1. which card is open, and the exit that has to outlive the press;
 *  2. the clock that drives one opening (a rAF, not a CSS transition, because
 *     the panel's geometry changes every frame);
 *  3. the two measurements the shared element needs;
 *  4. escape;
 *  5. pointer-down outside the panel;
 *  6. the scroll lock.
 *
 * All six are invisible to a leaf. Swapping leaves never touches this file, and
 * a new leaf inherits every one of them by spreading `card.anchor` and
 * `panel.motion.*`.
 *
 * ── Measuring the panel is the subtle part ─────────────────────────────────
 * The morph transforms the panel, so measuring the panel while it is
 * transformed measures the transform, not the destination. The fix is the
 * classic one and it is why this is a *layout* effect: neutralise the transform,
 * read the rect, put it back — all synchronously, before the browser paints, so
 * nothing flickers and no frame is rendered against a rect that has not been
 * taken yet.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";

import { DEFAULT_TRANSITION, findTransition, resolveMotion } from "./expandable-card.transitions";
import {
  cardAnchor,
  cardAnchorSelector,
  cardIds,
  resolveExpandableCardState,
  resolveItemState,
  type ExpandableCardAction,
  type ExpandableCardItem,
  type ExpandableCardMedia,
  type ExpandableCardPhase,
  type ExpandableCardVM,
  type Rect,
} from "./expandable-card.vm";

/**
 * What a caller passes in. Deliberately *structural* and free of forest types,
 * so an app already holding a list of clips, projects or people satisfies it
 * without importing anything from here but the container.
 */
export type ExpandableCardRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string | null;
  media: ExpandableCardMedia;
  /** Detail paragraphs, pre-formatted. Omit for a collection with no detail. */
  body?: string[];
  facts?: Array<{ label: string; value: string }>;
  action?: {
    label: string;
    href?: string | null;
    onActivate?: (() => void) | null;
    tone?: ExpandableCardAction["tone"];
  } | null;
};

export type ExpandableCardConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;
  /** Which motion preset resolves the opening. See `expandable-card.transitions.ts`. */
  transition?: string;
  /** How long one opening runs, in ms. Ignored under reduced motion. */
  durationMs?: number;

  records: ExpandableCardRecord[];

  /** Namespace for generated ids. Set it when two of these share a page. */
  scope?: string;

  eyebrow?: string | null;
  headline?: string | null;
  body?: string | null;
  emptyLabel?: string | null;
  closeLabel?: string;

  /**
   * Lock page scroll while a panel is open. True for the overlay leaves; pass
   * `false` for a leaf that expands in flow (`canon/inline-detail`), where
   * locking the page would trap the reader beside the thing they just opened.
   */
  lockScroll?: boolean;

  /** Reported after a card opens. The container never routes; that is the app's job. */
  onOpenChange?: (id: string | null) => void;
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

function rectOf(element: Element | null): Rect | null {
  if (!element) return null;
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
}

/**
 * The panel's untransformed rect. Neutralising the transform inside the same
 * synchronous read is what makes this correct while the morph is already
 * running — see the note at the top of the file.
 */
function untransformedRect(element: HTMLElement | null): Rect | null {
  if (!element) return null;
  const previous = element.style.transform;
  element.style.transform = "none";
  const rect = rectOf(element);
  element.style.transform = previous;
  return rect;
}

type OpenState = { id: string; phase: ExpandableCardPhase } | null;

export function ExpandableCardConnected({
  variant,
  transition = DEFAULT_TRANSITION,
  durationMs = 420,
  records,
  scope = "expandable-card",
  eyebrow = null,
  headline = null,
  body = null,
  emptyLabel = "Nothing here yet",
  closeLabel = "Close",
  lockScroll = true,
  onOpenChange,
}: ExpandableCardConnectedProps) {
  const Leaf = useForestLeaf<ExpandableCardVM>("disclosure", "expandable-card", variant);
  const reducedMotion = usePrefersReducedMotion();

  const [open, setOpen] = useState<OpenState>(null);
  const [progress, setProgress] = useState(1);
  const [origin, setOrigin] = useState<Rect | null>(null);

  /**
   * The panel's measurement, tagged with what it measured.
   *
   * The tag is why this is not just `Rect | null`: a rect can legitimately come
   * back unusable — zero-sized on a display:none ancestor, absent in a test
   * environment that does not lay anything out — and "measured, and there was
   * nothing there" has to be distinguishable from "not measured yet". Without
   * the distinction the clock below waits for a rect that is never coming and
   * the panel stays mid-open forever.
   */
  const [measurement, setMeasurement] = useState<{ panelId: string; rect: Rect | null } | null>(
    null,
  );

  const measured = findTransition(transition).measured && !reducedMotion;
  const openId = open?.id ?? null;
  const panelId = openId ? cardIds(scope, openId).panelId : null;

  /* ---------------------------------------------------------------- opening */

  const expand = useCallback(
    (id: string) => {
      setOrigin(rectOf(document.querySelector(cardAnchorSelector(id))));
      setMeasurement(null);
      setProgress(0);
      setOpen({ id, phase: "entering" });
      onOpenChange?.(id);
    },
    [onOpenChange],
  );

  const collapse = useCallback(() => {
    setOpen((current) => {
      if (!current || current.phase === "leaving") return current;
      // Re-measure: the page may have scrolled since the card was pressed, and
      // a morph that returns to where the card *used* to be is worse than none.
      setOrigin(rectOf(document.querySelector(cardAnchorSelector(current.id))));
      setProgress(0);
      return { id: current.id, phase: "leaving" };
    });
    onOpenChange?.(null);
  }, [onOpenChange]);

  /* ------------------------------------------------------------ measurement */

  useLayoutEffect(() => {
    if (!measured || !panelId || measurement?.panelId === panelId) return;
    setMeasurement({ panelId, rect: untransformedRect(document.getElementById(panelId)) });
  }, [measured, measurement, panelId]);

  /* ------------------------------------------------------------------ clock */

  const phase = open?.phase ?? "open";
  const target = measurement?.panelId === panelId ? measurement.rect : null;
  const waitingForRect = measured && phase !== "open" && measurement?.panelId !== panelId;

  useEffect(() => {
    if (!open || phase === "open") return;

    // Stillness was asked for: land on the finished frame without animating.
    if (reducedMotion) {
      setProgress(1);
      setOpen(phase === "entering" ? { id: open.id, phase: "open" } : null);
      return;
    }

    // Do not start counting until the destination is known, or the first frames
    // of the morph run against a rect that arrives late.
    if (waitingForRect) return;

    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = durationMs <= 0 ? 1 : Math.min(1, (now - started) / durationMs);
      setProgress(t);
      if (t < 1) {
        frame = requestAnimationFrame(step);
        return;
      }
      setOpen((current) => {
        if (!current) return null;
        return current.phase === "entering" ? { id: current.id, phase: "open" } : null;
      });
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, open, phase, reducedMotion, waitingForRect]);

  /* ------------------------------------------------- escape, outside, scroll */

  useEffect(() => {
    if (!openId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") collapse();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [collapse, openId]);

  useEffect(() => {
    if (!panelId) return;
    const onPointerDown = (event: PointerEvent) => {
      const panel = document.getElementById(panelId);
      if (panel && event.target instanceof Node && panel.contains(event.target)) return;
      collapse();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [collapse, panelId]);

  /**
   * Focus follows the disclosure, and comes back.
   *
   * Not a focus trap — the leaves decide their own structure and a trap written
   * out here would be guessing at it. What it does do is the part that is
   * always right and always forgotten: move focus into the thing that just
   * opened, and return it to the card when it closes, so a keyboard user is not
   * left at the top of the document. A leaf that wants a full trap should use a
   * Radix dialog from `src/components/ui/` and stay controlled.
   */
  useEffect(() => {
    if (!openId || !panelId) return;
    const trigger = document.activeElement;
    const panel = document.getElementById(panelId);
    if (panel) {
      if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "-1");
      panel.focus({ preventScroll: true });
    }
    return () => {
      if (trigger instanceof HTMLElement && document.contains(trigger)) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, [openId, panelId]);

  useEffect(() => {
    if (!openId || !lockScroll) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [lockScroll, openId]);

  /* --------------------------------------------------------------------- vm */

  const vm = useMemo<ExpandableCardVM>(() => {
    const cards: ExpandableCardItem[] = records.map((record) => {
      const ids = cardIds(scope, record.id);
      const action = record.action ?? null;
      return {
        id: record.id,
        title: record.title,
        subtitle: record.subtitle,
        meta: record.meta ?? null,
        media: record.media,
        state: resolveItemState(record.id, openId),
        triggerId: ids.triggerId,
        panelId: ids.panelId,
        anchor: cardAnchor(record.id),
        onExpand: () => expand(record.id),
        action: action
          ? {
              label: action.label,
              href: action.href ?? null,
              onActivate: action.onActivate ?? null,
              disabled: !action.href && !action.onActivate,
              tone: action.tone ?? "primary",
            }
          : null,
      };
    });

    const index = records.findIndex((record) => record.id === openId);
    const record = index >= 0 ? records[index] : null;
    const card = index >= 0 ? cards[index] : null;
    const ids = record ? cardIds(scope, record.id) : null;

    return {
      // An open id pointing at a record that no longer exists resolves to
      // `browsing`, not to a panel with nothing in it.
      state: resolveExpandableCardState(cards.length, record ? openId : null),
      progress,
      reducedMotion,
      eyebrow,
      headline,
      body,
      cards,
      panel:
        record && card && ids
          ? {
              id: ids.panelId,
              titleId: ids.titleId,
              labelledBy: ids.triggerId,
              card,
              body: record.body ?? [],
              facts: record.facts ?? [],
              action: card.action,
              close: { label: closeLabel, onClose: collapse },
              phase,
              motion: resolveMotion(
                transition,
                { phase, progress, origin: measured ? origin : null, target: measured ? target : null },
                reducedMotion,
              ),
            }
          : null,
      emptyLabel,
    };
  }, [
    body,
    closeLabel,
    collapse,
    emptyLabel,
    expand,
    eyebrow,
    headline,
    measured,
    openId,
    origin,
    phase,
    progress,
    records,
    reducedMotion,
    scope,
    target,
    transition,
  ]);

  return <Leaf {...vm} />;
}

export default ExpandableCardConnected;
