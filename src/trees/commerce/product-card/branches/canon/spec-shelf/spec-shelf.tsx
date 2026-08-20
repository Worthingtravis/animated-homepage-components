/**
 * Spec Shelf — a leaf on Product Card / Canon.
 *
 * PURE PRESENTATION. Its props ARE ProductCardVM.
 *
 * Structural answer: the photograph sits in its own inset panel, and everything
 * a shopper compares between two products — the dimensions, the rating, the two
 * presses — sits on one shelf of chips directly beneath it. The name and the
 * price share the last line, because that is the pair the eye actually reads.
 *
 * The shelf exists so the card has ONE row that changes between products and
 * one row that never does. Dimensions and rating are the facts people scan
 * across a grid; putting them in a fixed-height strip means two cards side by
 * side line up even when one has no rating.
 *
 * It computes nothing. Every string here arrives finished — `vm.price.current`,
 * `vm.specLine`, `vm.rating.value` — and `vm.progress` is used only to move
 * pixels during the add.
 */

import { Fragment } from "react";

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { ProductCardVM } from "../../../product-card.vm";

export const meta: LeafMeta = {
  label: "Spec Shelf",
  description:
    "Photograph in an inset panel, facts and actions on one chip shelf beneath it, name and price sharing the last line.",
  sizeHint: "md",
  tags: ["retail", "chips", "specs", "grid"],
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 20.5s-7.5-4.7-7.5-9.8A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 3.1c0 5.1-7.5 9.8-7.5 9.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none">
      <path
        d="M5.5 8h13l-1 11.5h-11L5.5 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 8V6.8a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none">
      <path
        d="m5.5 12.5 4 4 9-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 text-accent" fill="currentColor">
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
    </svg>
  );
}

export function ProductCardSpecShelf(vm: ProductCardVM) {
  // The commit, as pixels. Nothing here decides anything — `vm.state` already did.
  const committing = vm.state === "adding" && !vm.reducedMotion;
  const sweep = committing ? vm.progress : vm.state === "added" ? 1 : 0;
  const lift = committing ? Math.sin(vm.progress * Math.PI) * -3 : 0;

  return (
    <article
      data-state={vm.state}
      className={cn(
        "@container",
        "flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-border bg-card p-3",
        "shadow-sm transition-shadow duration-300",
        vm.state === "unavailable" ? "opacity-80" : "hover:shadow-lg",
      )}
      style={{ transform: `translateY(${lift}px)` }}
    >
      {/* ── The photograph, in its own room ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
          {vm.badges.map((badge) => (
            <span
              key={badge.id}
              data-tone={badge.tone}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold tracking-tight",
                badge.tone === "promo"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground shadow-sm",
              )}
            >
              {badge.label}
            </span>
          ))}
          {vm.option ? (
            <span className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
              {vm.option.selectedLabel}
            </span>
          ) : null}
        </div>

        <Image
          src={vm.media.src}
          alt={vm.media.alt}
          width={vm.media.width}
          height={vm.media.height}
          className={cn(
            "h-auto w-full object-contain transition-transform duration-500",
            vm.state === "unavailable" ? "opacity-60 saturate-50" : null,
          )}
          style={{ transform: `scale(${1 + sweep * 0.03})` }}
        />

        {vm.note ? (
          <p className="absolute inset-x-3 bottom-3 rounded-full bg-card/90 px-3 py-1.5 text-center text-xs font-medium text-foreground">
            {vm.note}
          </p>
        ) : null}
      </div>

      {/* ── The shelf: the facts people compare, then the two presses ───── */}
      <div className="flex items-stretch gap-2">
        {vm.specs.length > 0 ? (
          <dl
            className="flex flex-1 flex-col justify-center rounded-2xl bg-muted px-4 py-2"
            aria-label={vm.specLine ?? undefined}
          >
            <div className="flex items-baseline justify-between gap-3">
              {vm.specs.map((spec) => (
                <dt
                  key={`${spec.id}-label`}
                  className="flex-1 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground"
                >
                  {spec.label}
                </dt>
              ))}
            </div>
            {/* The separators sit BETWEEN the cells rather than inside them, so
                the values stay in the same columns as their labels. */}
            <div className="flex items-baseline justify-between gap-1">
              {vm.specs.map((spec, index) => (
                <Fragment key={spec.id}>
                  {index > 0 ? (
                    <span aria-hidden className="text-xs text-muted-foreground">
                      ×
                    </span>
                  ) : null}
                  <dd className="flex-1 text-center text-base font-semibold text-foreground">
                    {spec.value}
                  </dd>
                </Fragment>
              ))}
            </div>
          </dl>
        ) : null}

        {vm.rating ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl bg-muted px-4 py-2"
            title={vm.rating.label}
          >
            <StarIcon />
            <span className="text-base font-semibold text-foreground">{vm.rating.value}</span>
            <span className="sr-only">{vm.rating.label}</span>
          </div>
        ) : null}

        <button
          type="button"
          aria-pressed={vm.favorite.active}
          aria-label={vm.favorite.label}
          disabled={vm.favorite.onToggle === null}
          onClick={vm.favorite.onToggle ?? undefined}
          className={cn(
            "flex w-14 items-center justify-center rounded-2xl bg-muted transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            vm.favorite.active ? "text-primary" : "text-foreground hover:text-primary",
            vm.favorite.onToggle === null ? "cursor-not-allowed opacity-60" : null,
          )}
        >
          <HeartIcon filled={vm.favorite.active} />
        </button>

        <button
          type="button"
          aria-label={vm.add.a11yLabel}
          disabled={vm.add.disabled}
          onClick={vm.add.onActivate ?? undefined}
          className={cn(
            "relative flex w-14 items-center justify-center overflow-hidden rounded-2xl transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            vm.state === "added"
              ? "bg-primary text-primary-foreground"
              : vm.add.disabled
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {/* The commit, filling the tile from the bottom. */}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 bg-primary transition-[height] duration-150"
            style={{ height: `${sweep * 100}%` }}
          />
          <span className="relative">
            {vm.state === "added" ? <CheckIcon /> : <BagIcon />}
          </span>
        </button>
      </div>

      {/* ── Name and price, on one line ─────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 px-1 pb-1">
        <div className="min-w-0">
          {vm.brand ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {vm.brand}
            </p>
          ) : null}
          <h3 className="mt-1 text-balance text-xl font-semibold tracking-tight text-foreground">
            {vm.href ? (
              <a href={vm.href} className="hover:text-primary">
                {vm.title}
              </a>
            ) : (
              vm.title
            )}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          {vm.price.compareAt ? (
            <p className="text-sm text-muted-foreground line-through">{vm.price.compareAt}</p>
          ) : null}
          <p className="text-xl font-semibold tracking-tight text-foreground">
            {vm.price.current}
          </p>
          {vm.price.note ? (
            <p className="text-xs text-muted-foreground">{vm.price.note}</p>
          ) : null}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {vm.add.label}
      </p>
    </article>
  );
}

export default ProductCardSpecShelf;
