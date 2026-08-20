"use client";

/**
 * The container for `finding/clip-picker`.
 *
 * Everything a leaf is not allowed to hold lives here: the query, the debounce,
 * the settle clock, the per-card send state, the media query. What comes out is
 * a `ClipPickerVM` of pre-formatted strings and callbacks, and which leaf
 * renders it is one prop.
 *
 * ── Why the query is debounced here and not in the leaf ────────────────────
 * The field is controlled off `vm.search.query`, so every keystroke is a VM.
 * If the *search* also ran per keystroke the surface would flicker between
 * `searching` and `results` four times a second. So the typed value is
 * immediate (the field must never lag a keystroke) and the query that actually
 * searches trails it by `debounceMs`. Two values, one of them visible — a
 * distinction a leaf could not make even if it were allowed to try.
 *
 * ── The settle clock ───────────────────────────────────────────────────────
 * `progress` here is not a loop. It restarts at 0 whenever the settled query
 * changes and ramps once to 1, which is exactly what `frameAt` samples. A
 * reduced-motion reader gets 1 immediately — resolved before any style is made,
 * never inside a leaf.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";

import {
  formatClipDuration,
  formatResultLabel,
  resolveClipPickerState,
  resolveSendAction,
  splitTranscript,
  type ClipCard,
  type ClipPickerImage,
  type ClipPickerNotice,
  type ClipPickerVM,
  type ClipSendState,
  type ClipShelf,
  type SearchSuggestion,
} from "./clip-picker.vm";

/* ------------------------------------------------------------ the input */

/** What a caller hands in. Raw-ish — the container formats it. */
export type ClipSource = {
  id: string;
  title: string;
  /** Seconds. Formatted here, never in a leaf. */
  durationSeconds: number;
  /** Pre-formatted by the caller — relative time needs the caller's clock. */
  age?: string | null;
  plays?: string | null;
  /** Pre-formatted position in the VOD. */
  timestamp?: string | null;
  thumbnail?: ClipPickerImage | null;
  badge?: string | null;
  creatorLabel?: string | null;
  /** The transcript line this clip sits on. Searched, and quoted on a hit. */
  transcript?: string | null;
};

export type ShelfSource = {
  id: string;
  label: string;
  hint?: string | null;
  featured?: boolean;
  clipIds: string[];
};

export type ClipPickerConnectedProps = {
  /** `"<branch>/<leaf>"`. */
  variant: string;
  id?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  clips: ClipSource[];
  shelves: ShelfSource[];
  suggestions?: Array<{ id: string; label: string; query: string; count?: string | null }>;
  scopes?: ReadonlyArray<{ value: string; label: string }>;
  loading?: boolean;
  /**
   * Something true of the whole surface — most often "sending is paused". Note
   * that this does NOT hide the shelves: a paused streamer's picks are the
   * reason to come back, so they stay up and every card blocks instead.
   */
  notice?: ClipPickerNotice | null;
  /** How long the field may run ahead of the search. */
  debounceMs?: number;
  settleMs?: number;
  narrowBelowPx?: number;
  /** Fired when a card is sent. Resolve to `false` to mark the queue full. */
  onSend?: (clipId: string) => Promise<boolean> | boolean;
};

/* ------------------------------------------------------------ the hooks */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function useDensity(narrowAt: number): "wide" | "narrow" {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${narrowAt - 1}px)`);
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [narrowAt]);
  return narrow ? "narrow" : "wide";
}

/** The typed value, and the value that trails it and actually searches. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (delayMs <= 0) {
      setSettled(value);
      return;
    }
    const timer = window.setTimeout(() => setSettled(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}

/** A one-shot ramp that restarts whenever `key` changes. Settles at 1. */
function useSettle(key: string, durationMs: number, enabled: boolean): number {
  const [progress, setProgress] = useState(enabled ? 0 : 1);
  const frame = useRef(0);

  useEffect(() => {
    if (!enabled || durationMs <= 0) {
      setProgress(1);
      return;
    }
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const next = Math.min(1, (now - start) / durationMs);
      setProgress(next);
      if (next < 1) frame.current = requestAnimationFrame(tick);
    };
    setProgress(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [key, durationMs, enabled]);

  return progress;
}

/* -------------------------------------------------------- the container */

export function ClipPickerConnected({
  variant,
  id = "clip-picker",
  title,
  subtitle = null,
  badge = null,
  clips,
  shelves,
  suggestions = [],
  scopes,
  loading = false,
  notice = null,
  debounceMs = 180,
  settleMs = 320,
  narrowBelowPx = 768,
  onSend,
}: ClipPickerConnectedProps) {
  const Leaf = useForestLeaf<ClipPickerVM>("finding", "clip-picker", variant);

  const reducedMotion = usePrefersReducedMotion();
  const density = useDensity(narrowBelowPx);

  const [typed, setTyped] = useState("");
  const query = useDebounced(typed, debounceMs);
  const [scopeValue, setScopeValue] = useState(scopes?.[0]?.value ?? "all");

  /* Per card, never global — a viewer sends three in a row and the second must
     not wait on the first. */
  const [sendStates, setSendStates] = useState<Record<string, ClipSendState>>({});
  const [sendHints, setSendHints] = useState<Record<string, string | null>>({});

  const send = useCallback(
    async (clipId: string) => {
      setSendStates((current) => ({ ...current, [clipId]: "sending" }));
      const accepted = onSend ? await onSend(clipId) : true;
      setSendStates((current) => ({ ...current, [clipId]: accepted ? "sent" : "blocked" }));
      setSendHints((current) => ({
        ...current,
        [clipId]: accepted ? "it is in the queue" : "try again in a few minutes",
      }));
    },
    [onSend],
  );

  const byId = useMemo(() => new Map(clips.map((clip) => [clip.id, clip])), [clips]);

  const toCard = useCallback(
    (clip: ClipSource, withQuote: boolean): ClipCard => {
      /* A blocking notice blocks every card. Keeping the two in sync here is
         what stops a leaf from having to reconcile "the banner says no" with
         "the button says Send" — it never sees the disagreement. */
      const blocking = notice?.tone === "blocked";
      const state: ClipSendState = blocking ? "blocked" : (sendStates[clip.id] ?? "ready");
      return {
        id: clip.id,
        title: clip.title,
        creatorLabel: clip.creatorLabel ?? null,
        duration: formatClipDuration(clip.durationSeconds),
        age: clip.age ?? null,
        plays: clip.plays ?? null,
        timestamp: clip.timestamp ?? null,
        thumbnail: clip.thumbnail ?? null,
        badge: clip.badge ?? null,
        quote: withQuote && clip.transcript ? splitTranscript(clip.transcript, query) : null,
        send: resolveSendAction(state, {
          title: clip.title,
          hint: blocking ? null : (sendHints[clip.id] ?? null),
          onSend: () => void send(clip.id),
          blocked: blocking
            ? { label: "Paused", reason: "sending is switched off right now" }
            : undefined,
        }),
        onPreview: null,
        previewAriaLabel: null,
      };
    },
    [query, send, sendStates, sendHints, notice],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return [];
    return clips
      .filter((clip) => (clip.transcript ?? "").toLowerCase().includes(needle))
      .map((clip) => toCard(clip, true));
  }, [clips, query, toCard]);

  const resolvedShelves = useMemo<ClipShelf[]>(
    () =>
      shelves.map((source) => ({
        id: source.id,
        label: source.label,
        hint: source.hint ?? null,
        headingId: `${id}-shelf-${source.id}`,
        featured: source.featured ?? false,
        items: source.clipIds
          .map((clipId) => byId.get(clipId))
          .filter((clip): clip is ClipSource => Boolean(clip))
          .map((clip) => toCard(clip, false)),
      })),
    [shelves, byId, toCard, id],
  );

  const resolvedSuggestions = useMemo<SearchSuggestion[]>(
    () =>
      suggestions.map((entry) => ({
        id: entry.id,
        label: entry.label,
        count: entry.count ?? null,
        onPick: () => setTyped(entry.query),
      })),
    [suggestions],
  );

  const state = resolveClipPickerState({
    loading,
    // The field running ahead of the search IS the in-flight window.
    searching: typed.trim() !== query.trim() && typed.trim().length > 0,
    query,
    shelfCount: resolvedShelves.length,
    resultCount: results.length,
    indexed: clips.length > 0,
  });

  const progress = useSettle(`${query}|${scopeValue}`, settleMs, !reducedMotion);

  const vm: ClipPickerVM = {
    state,
    progress: reducedMotion ? 1 : progress,
    reducedMotion,
    density,
    scopeId: id,
    purpose: { title, subtitle, badge },
    search: {
      query: typed,
      label: "Search what they said",
      placeholder: "Search what they said…",
      resultLabel: state === "results" ? formatResultLabel(results.length) : null,
      hint: state === "browse" ? "Every word from every VOD." : null,
      onQueryChange: setTyped,
      onClear: typed.length > 0 ? () => setTyped("") : null,
      suggestions: resolvedSuggestions,
      suggestionsLabel: state === "empty" ? "Try one of these instead" : "Or start here",
    },
    scope: scopes
      ? { value: scopeValue, label: "Search", options: scopes, onChange: setScopeValue }
      : null,
    notice,
    shelves: resolvedShelves,
    results,
    emptyLabel: "Nothing matched that.",
    offlineLabel: "Nothing to send yet — this channel has no clips indexed.",
    loadingLabel: "Loading clips…",
    skeletonCount: 3,
  };

  return <Leaf {...vm} />;
}

export default ClipPickerConnected;
