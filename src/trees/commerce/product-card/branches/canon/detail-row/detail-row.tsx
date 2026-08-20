/**
 * Detail Row — a leaf on Product Card / Canon.
 *
 * PURE PRESENTATION. Its props ARE ProductCardVM.
 *
 * Structural answer: the card laid on its side. A square thumbnail, then
 * everything in reading order, then the money and the commit in a column on the
 * right. This is the shape a product takes inside a cart, a wishlist, a search
 * result or a comparison list — anywhere a shopper is reading DOWN a page
 * rather than across a grid.
 *
 * Two decisions separate it from its sibling:
 *  - it takes `vm.specLine` (`"58 × 79 × 60 cm"`) rather than `vm.specs`,
 *    because a row has one line of horizontal space and no room for a W/H/D
 *    header — and it does not build that string, which is exactly why both
 *    leaves say the same thing;
 *  - the commit is a labelled button, not an icon, because a list row has the
 *    width for a word and a word is unambiguous.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { ProductCardVM } from "../../../product-card.vm";

export const meta: LeafMeta = {
  label: "Detail Row",
  description:
    "The card on its side — thumbnail, facts in reading order, money and the commit in a right-hand column. The list shape.",
  sizeHint: "lg",
  tags: ["row", "list", "cart", "compare"],
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 20.5s-7.5-4.7-7.5-9.8A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 3.1c0 5.1-7.5 9.8-7.5 9.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCardDetailRow(vm: ProductCardVM) {
  const committing = vm.state === "adding" && !vm.reducedMotion;
  const sweep = committing ? vm.progress : vm.state === "added" ? 1 : 0;

  return (
    <article
      data-state={vm.state}
      className={cn(
        "@container",
        "flex w-full max-w-3xl items-stretch gap-4 rounded-2xl border border-border bg-card p-4",
        "transition-colors duration-300",
        vm.state === "unavailable" ? "opacity-80" : "hover:border-primary/50",
      )}
    >
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={vm.media.src}
          alt={vm.media.alt}
          width={vm.media.width}
          height={vm.media.height}
          className={cn(
            "h-full w-full object-contain",
            vm.state === "unavailable" ? "opacity-60 saturate-50" : null,
          )}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {vm.brand ? (
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {vm.brand}
            </span>
          ) : null}
          {vm.badges.map((badge) => (
            <span
              key={badge.id}
              data-tone={badge.tone}
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
                badge.tone === "promo"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground",
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>

        <h3 className="text-balance text-lg font-semibold leading-tight tracking-tight text-foreground">
          {vm.href ? (
            <a href={vm.href} className="hover:text-primary">
              {vm.title}
            </a>
          ) : (
            vm.title
          )}
        </h3>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {/* One pre-built line. This leaf never joins the specs itself. */}
          {vm.specLine ? <span>{vm.specLine}</span> : null}
          {vm.rating ? (
            <span className="text-foreground">
              <span aria-hidden className="text-accent">
                ★
              </span>{" "}
              {vm.rating.value}
              <span className="sr-only">{vm.rating.label}</span>
            </span>
          ) : null}
          {vm.note ? <span className="text-foreground">{vm.note}</span> : null}
        </p>

        {vm.option ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{vm.option.label}</span>
            {vm.option.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                aria-pressed={choice.selected}
                disabled={choice.onSelect === null}
                onClick={choice.onSelect ?? undefined}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  choice.selected
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground",
                  !choice.available ? "cursor-not-allowed line-through opacity-50" : null,
                  choice.available && !choice.selected ? "hover:border-primary" : null,
                )}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex w-40 shrink-0 flex-col items-end justify-between gap-3">
        <div className="text-right">
          {vm.price.compareAt ? (
            <p className="text-sm text-muted-foreground line-through">{vm.price.compareAt}</p>
          ) : null}
          <p className="text-xl font-semibold tracking-tight text-foreground">{vm.price.current}</p>
          {vm.price.savingLabel ? (
            <p className="text-xs font-medium text-primary">{vm.price.savingLabel}</p>
          ) : null}
          {vm.price.note ? <p className="text-xs text-muted-foreground">{vm.price.note}</p> : null}
        </div>

        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            aria-pressed={vm.favorite.active}
            aria-label={vm.favorite.label}
            disabled={vm.favorite.onToggle === null}
            onClick={vm.favorite.onToggle ?? undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              vm.favorite.active ? "border-primary text-primary" : "text-muted-foreground hover:text-primary",
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
              "relative flex-1 overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              vm.state === "added"
                ? "bg-primary text-primary-foreground"
                : vm.add.disabled
                  ? "cursor-not-allowed border border-border text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-accent",
            )}
          >
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-150"
              style={{ width: `${sweep * 100}%` }}
            />
            <span className="relative whitespace-nowrap">{vm.add.label}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCardDetailRow;
