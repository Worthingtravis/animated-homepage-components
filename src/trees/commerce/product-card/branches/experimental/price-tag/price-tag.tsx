/**
 * Price Tag — a leaf on Product Card / Experimental.
 *
 * PURE PRESENTATION. Its props ARE ProductCardVM.
 *
 * Structural answer: there is no card around the photograph — the photograph IS
 * the card. Type sits on it under a wash, the price hangs off the corner as a
 * tag, and the commit is the entire bottom edge, which fills across as the add
 * runs. One product per screenful; a shape for a feature slot, not a grid.
 *
 * The reason it is worth having next to `canon/spec-shelf` is that it takes the
 * SAME contract and drops two things the other leaf leads with: the W/H/D block
 * (a tag has no room for a table) and the icon shelf. Nothing in the VM changed
 * to allow that — a leaf renders what it has room for, and the fields it skips
 * are still there for its siblings.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { ProductCardVM } from "../../../product-card.vm";

export const meta: LeafMeta = {
  label: "Price Tag",
  description:
    "The photograph is the card — type under a wash, the price hanging off the corner, and the commit as the whole bottom edge.",
  sizeHint: "md",
  tags: ["poster", "full-bleed", "feature", "overlay"],
};

export function ProductCardPriceTag(vm: ProductCardVM) {
  const committing = vm.state === "adding" && !vm.reducedMotion;
  const sweep = committing ? vm.progress : vm.state === "added" ? 1 : 0;
  const tilt = committing ? Math.sin(vm.progress * Math.PI) * 2 : 0;

  return (
    <article
      data-state={vm.state}
      className={cn(
        "@container",
        "relative flex aspect-[4/5] w-full max-w-sm flex-col justify-end overflow-hidden rounded-3xl",
        "bg-muted ring-1 ring-border transition-shadow duration-300",
        vm.state === "added" ? "ring-2 ring-primary" : "hover:shadow-xl",
      )}
    >
      <Image
        src={vm.media.src}
        alt={vm.media.alt}
        width={vm.media.width}
        height={vm.media.height}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-transform duration-700",
          vm.state === "unavailable" ? "opacity-60 saturate-50" : null,
        )}
        style={{ transform: `scale(${1.02 + sweep * 0.04})` }}
      />

      {/* The wash. Without it, type over a photograph is a lottery. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-card via-card/85 to-transparent"
      />

      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
        {vm.badges.map((badge) => (
          <span
            key={badge.id}
            data-tone={badge.tone}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              badge.tone === "promo"
                ? "bg-primary text-primary-foreground"
                : "bg-card/90 text-foreground",
            )}
          >
            {badge.label}
          </span>
        ))}
        {vm.rating ? (
          <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground">
            <span aria-hidden className="text-accent">
              ★
            </span>{" "}
            {vm.rating.value}
            <span className="sr-only">{vm.rating.label}</span>
          </span>
        ) : null}
      </div>

      <button
        type="button"
        aria-pressed={vm.favorite.active}
        aria-label={vm.favorite.label}
        disabled={vm.favorite.onToggle === null}
        onClick={vm.favorite.onToggle ?? undefined}
        className={cn(
          "absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-card/90 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          vm.favorite.active ? "text-primary" : "text-foreground hover:text-primary",
          vm.favorite.onToggle === null ? "cursor-not-allowed opacity-60" : null,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-5 w-5"
          fill={vm.favorite.active ? "currentColor" : "none"}
        >
          <path
            d="M12 20.5s-7.5-4.7-7.5-9.8A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 3.1c0 5.1-7.5 9.8-7.5 9.8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="relative flex flex-col gap-3 p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {vm.brand ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {vm.brand}
              </p>
            ) : null}
            <h3 className="mt-1 text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground">
              {vm.href ? (
                <a href={vm.href} className="hover:text-primary">
                  {vm.title}
                </a>
              ) : (
                vm.title
              )}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {[vm.option?.selectedLabel, vm.specLine, vm.note]
                .filter((part): part is string => Boolean(part))
                .join(" · ")}
            </p>
          </div>

          {/* The tag. It leans, and it leans a little further while the add runs. */}
          <div
            className="shrink-0 rounded-2xl bg-primary px-4 py-2 text-right text-primary-foreground shadow-lg transition-transform duration-300"
            style={{ transform: `rotate(${-3 + tilt}deg)` }}
          >
            {vm.price.compareAt ? (
              <p className="text-xs opacity-80 line-through">{vm.price.compareAt}</p>
            ) : null}
            <p className="text-xl font-semibold tracking-tight">{vm.price.current}</p>
          </div>
        </div>

        {vm.option && vm.option.choices.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            {vm.option.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                aria-pressed={choice.selected}
                disabled={choice.onSelect === null}
                onClick={choice.onSelect ?? undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  choice.selected ? "border-primary text-primary" : "border-border text-muted-foreground",
                  !choice.available ? "cursor-not-allowed line-through opacity-50" : null,
                  choice.available && !choice.selected ? "hover:border-primary" : null,
                )}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          aria-label={vm.add.a11yLabel}
          disabled={vm.add.disabled}
          onClick={vm.add.onActivate ?? undefined}
          className={cn(
            "relative w-full overflow-hidden rounded-full py-3 text-sm font-semibold transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            vm.add.disabled
              ? "cursor-not-allowed border border-border text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-accent",
            vm.state === "added" ? "bg-primary text-primary-foreground" : null,
          )}
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-150"
            style={{ width: `${sweep * 100}%` }}
          />
          <span className="relative">{vm.add.label}</span>
          {vm.price.savingLabel && vm.state === "available" ? (
            <span className="relative ml-2 opacity-80">· {vm.price.savingLabel}</span>
          ) : null}
        </button>
      </div>
    </article>
  );
}

export default ProductCardPriceTag;
