"use client";

/**
 * Product Card — connected container.
 *
 * This is the ONLY file in the tree allowed hooks, effects or clocks. It owns
 * four things, and all four are invisible to a leaf:
 *
 *  1. THE MONEY. Amounts arrive in minor units and leave as strings. The
 *     discount badge, the struck price and the saving line are three views of
 *     one calculation, done once here.
 *  2. THE COMMIT. Which option is selected, whether the add is in flight, and
 *     the "in your bag" state that has to outlive the press.
 *  3. THE CLOCK. One rAF sweep across one add — not a loop, and stopped dead
 *     under reduced motion.
 *  4. WHAT THE BUTTON SAYS. `resolveAdd` picks the copy per state so no variant
 *     invents the word "Adding…".
 *
 * A caller passes a product the shape their catalogue already has. Nothing in
 * `ProductCardRecord` is a forest type.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useForestLeaf } from "@/lib/use-forest-leaf";

import {
  clampProgress,
  compareAtPrice,
  formatMoney,
  normaliseBadges,
  percentOffLabel,
  resolveAdd,
  resolveFavorite,
  resolveProductCardState,
  specLine,
  type ProductCardAddLabels,
  type ProductCardBadge,
  type ProductCardChoice,
  type ProductCardCommitPhase,
  type ProductCardMedia,
  type ProductCardSpec,
  type ProductCardVM,
} from "./product-card.vm";

/**
 * What a caller passes in. Deliberately *structural* — an app already holding
 * a catalogue row satisfies it without importing anything from here but the
 * container.
 */
export type ProductCardRecord = {
  id: string;
  brand?: string | null;
  title: string;
  href?: string | null;
  media: ProductCardMedia;

  /** ISO 4217 — `"USD"`, `"EUR"`. */
  currency: string;
  /** MINOR UNITS. `19_900`, not `199`. See `formatMoney`. */
  priceMinor: number;
  /** MINOR UNITS, or null. Struck through only when higher than `priceMinor`. */
  compareAtMinor?: number | null;
  /** `"incl. VAT"`, `"per m²"`. Shown under the price. */
  priceNote?: string | null;

  /** Extra badges over the picture. The discount badge is added automatically. */
  badges?: ProductCardBadge[];

  /** Raw rating. The container rounds it — a leaf never sees the mean. */
  rating?: { average: number; count?: number | null; outOf?: number } | null;

  specs?: ProductCardSpec[];
  specUnit?: string | null;

  option?: {
    label: string;
    choices: Array<{ id: string; label: string; available?: boolean }>;
    /** Defaults to the first available choice. */
    selectedId?: string;
  } | null;

  inStock?: boolean;
  note?: string | null;
};

export type ProductCardConnectedProps = {
  /** `"<branch>/<leaf>"` — which visual variant to render. */
  variant?: string;

  product: ProductCardRecord;

  /** Locale for money. Defaults to `"en-US"` so SSR and the client agree. */
  locale?: string;

  /** How long one add runs, in ms. Ignored under reduced motion. */
  durationMs?: number;

  /** The shop's words for the commit, per state. */
  addLabels?: ProductCardAddLabels;

  /**
   * Do the add. Resolve when the cart has it. Reject and the card returns to
   * `available` — a failed add that leaves the button saying "In your bag" is
   * the worst bug this component can ship.
   */
  onAdd?: (input: { id: string; optionId: string | null }) => void | Promise<unknown>;

  favorited?: boolean;
  onToggleFavorite?: (id: string) => void;

  /** Reported when the shopper picks a different option. */
  onSelectOption?: (optionId: string) => void;
};

/** rAF clock normalised to 0..1, run ONCE and then held. Lives here so leaves stay pure. */
function useCommitProgress(running: boolean, durationMs: number, enabled: boolean): number {
  const [progress, setProgress] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      startedAt.current = null;
      setProgress(0);
      return;
    }
    if (!enabled) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      startedAt.current ??= now;
      const elapsed = now - startedAt.current;
      setProgress(clampProgress(elapsed / durationMs));
      if (elapsed < durationMs) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, durationMs, enabled]);

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

export function ProductCardConnected({
  variant,
  product,
  locale = "en-US",
  durationMs = 700,
  addLabels,
  onAdd,
  favorited = false,
  onToggleFavorite,
  onSelectOption,
}: ProductCardConnectedProps) {
  const Leaf = useForestLeaf<ProductCardVM>("commerce", "product-card", variant);
  const reducedMotion = usePrefersReducedMotion();

  const [phase, setPhase] = useState<ProductCardCommitPhase>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(
    product.option?.selectedId ??
      product.option?.choices.find((choice) => choice.available !== false)?.id ??
      null,
  );

  const progress = useCommitProgress(phase !== "idle", durationMs, !reducedMotion);

  // The commit lands when the clock does, not when the promise does — the
  // promise decides *whether* it lands.
  useEffect(() => {
    if (phase === "adding" && progress >= 1) setPhase("added");
  }, [phase, progress]);

  const inStock = product.inStock !== false;
  const state = resolveProductCardState(inStock, phase);

  const handleAdd = useCallback(() => {
    setPhase("adding");
    const result = onAdd?.({ id: product.id, optionId: selectedId });
    if (result instanceof Promise) {
      result.catch(() => setPhase("idle"));
    }
  }, [onAdd, product.id, selectedId]);

  const price = useMemo(() => {
    const compareAtMinor = product.compareAtMinor ?? null;
    const saving =
      compareAtMinor !== null && compareAtMinor > product.priceMinor
        ? `Save ${formatMoney(compareAtMinor - product.priceMinor, product.currency, locale)}`
        : null;
    return {
      current: formatMoney(product.priceMinor, product.currency, locale),
      compareAt: compareAtPrice(product.priceMinor, compareAtMinor, product.currency, locale),
      discountLabel: percentOffLabel(product.priceMinor, compareAtMinor),
      savingLabel: saving,
      note: product.priceNote ?? null,
    };
  }, [product.priceMinor, product.compareAtMinor, product.currency, product.priceNote, locale]);

  const badges = useMemo(() => {
    const discount: ProductCardBadge[] = price.discountLabel
      ? [{ id: "discount", label: price.discountLabel, tone: "promo" }]
      : [];
    return normaliseBadges([...discount, ...(product.badges ?? [])]);
  }, [price.discountLabel, product.badges]);

  const option = useMemo(() => {
    if (!product.option) return null;
    const choices = product.option.choices.map<ProductCardChoice>((choice) => {
      const selected = choice.id === selectedId;
      const available = choice.available !== false;
      return {
        id: choice.id,
        label: choice.label,
        selected,
        available,
        onSelect:
          selected || !available
            ? null
            : () => {
                setSelectedId(choice.id);
                setPhase("idle");
                onSelectOption?.(choice.id);
              },
      };
    });
    return {
      label: product.option.label,
      selectedLabel: choices.find((choice) => choice.selected)?.label ?? "",
      choices,
    };
  }, [product.option, selectedId, onSelectOption]);

  const rating = useMemo(() => {
    if (!product.rating) return null;
    const outOf = product.rating.outOf ?? 5;
    // The one place a mean becomes a string. A leaf that did this would pick
    // its own decimal count and two variants would disagree about 4.85.
    const value = product.rating.average.toFixed(1);
    const count = product.rating.count == null ? null : product.rating.count.toLocaleString(locale);
    return {
      value,
      label: count
        ? `${value} out of ${outOf} — ${count} reviews`
        : `${value} out of ${outOf}`,
      count,
    };
  }, [product.rating, locale]);

  const specs = product.specs ?? [];

  const vm: ProductCardVM = {
    state,
    progress: clampProgress(phase === "added" ? 1 : progress),
    reducedMotion,
    brand: product.brand ?? null,
    title: product.title,
    href: product.href ?? null,
    media: product.media,
    badges,
    price,
    rating,
    specs,
    specLine: specLine(specs, product.specUnit ?? null),
    option,
    add: resolveAdd(state, product.title, onAdd ? handleAdd : null, addLabels),
    favorite: resolveFavorite(
      favorited,
      onToggleFavorite ? () => onToggleFavorite(product.id) : null,
    ),
    note: product.note ?? null,
  };

  return <Leaf {...vm} />;
}

export default ProductCardConnected;
