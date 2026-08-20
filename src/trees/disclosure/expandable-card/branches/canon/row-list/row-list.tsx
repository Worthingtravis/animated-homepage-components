/**
 * Row List — a leaf on Expandable Card / Canon.
 *
 * PURE PRESENTATION. Its props ARE ExpandableCardVM.
 * Structural answer: one narrow column of rows, thumbnail left, action right —
 * the shape a playlist has had for twenty years. It bets that the *title* is
 * what people scan, not the picture, so the media is a 56px square and every
 * row is one line of reading rather than a tile to look at.
 *
 * It is the leaf where the morph is doing the most work: a small square
 * becoming a tall panel is a non-uniform scale, which is exactly what the
 * counter-scaled content in `panel.motion.content` exists for. Clip the
 * surface, or that content is visible outside it for the first few frames.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { ExpandableCardAction, ExpandableCardVM } from "../../../expandable-card.vm";

export const meta: LeafMeta = {
  label: "Row List",
  description:
    "A narrow playlist column — thumbnail, title, action per row. Scans by title rather than by picture.",
  sizeHint: "md",
  tags: ["list", "playlist", "compact", "morph"],
};

function Action({ action, compact }: { action: ExpandableCardAction; compact?: boolean }) {
  const className = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    compact ? "px-3 py-1.5 text-xs" : "px-5 py-2 text-sm",
    action.disabled
      ? "cursor-not-allowed border border-border text-muted-foreground"
      : action.tone === "primary"
        ? "bg-primary text-primary-foreground hover:bg-accent"
        : "border border-primary/40 text-primary hover:bg-primary/10",
  );

  if (action.href && !action.disabled) {
    return (
      <a href={action.href} onClick={action.onActivate ?? undefined} className={className}>
        {action.label}
      </a>
    );
  }
  return (
    <button
      type="button"
      disabled={action.disabled}
      onClick={action.onActivate ?? undefined}
      className={className}
    >
      {action.label}
    </button>
  );
}

export function ExpandableCardRowList(vm: ExpandableCardVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel ?? "Nothing to show yet."}</p>
      </section>
    );
  }

  const panel = vm.panel;

  return (
    <section data-state={vm.state} className="@container relative mx-auto max-w-2xl">
      {vm.eyebrow || vm.headline || vm.body ? (
        <header className="mb-6 text-center">
          {vm.eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {vm.eyebrow}
            </p>
          ) : null}
          {vm.headline ? (
            <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground">
              {vm.headline}
            </h2>
          ) : null}
          {vm.body ? (
            <p className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">{vm.body}</p>
          ) : null}
        </header>
      ) : null}

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {vm.cards.map((card) => (
          <li
            key={card.id}
            {...card.anchor}
            data-card-state={card.state}
            className={cn(
              "flex items-center gap-4 p-3 transition-all duration-300",
              card.state === "dimmed" ? "opacity-40" : null,
              card.state === "source" ? "opacity-0" : null,
              card.state === "resting" ? "hover:bg-primary/5" : null,
            )}
          >
            <button
              type="button"
              id={card.triggerId}
              aria-expanded={card.state === "source"}
              aria-controls={card.panelId}
              onClick={card.onExpand}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                <Image
                  src={card.media.src}
                  alt={card.media.alt}
                  width={card.media.width}
                  height={card.media.height}
                  className="size-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {card.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {card.subtitle}
                </span>
              </span>
              {card.meta ? (
                <span className="hidden shrink-0 font-mono text-xs text-muted-foreground @lg:block">
                  {card.meta}
                </span>
              ) : null}
            </button>

            {card.action ? <Action action={card.action} compact /> : null}
          </li>
        ))}
      </ul>

      {panel ? (
        <div
          data-phase={panel.phase}
          className="@container fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            aria-hidden
            style={panel.motion.backdrop}
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
          />

          <article
            id={panel.id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={panel.titleId}
            data-transition={panel.motion.transition}
            style={panel.motion.surface}
            className="relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <div style={panel.motion.content} className="flex max-h-full min-h-0 flex-col">
              <div
                style={panel.motion.media}
                className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted"
              >
                <Image
                  src={panel.card.media.src}
                  alt={panel.card.media.alt}
                  width={panel.card.media.width}
                  height={panel.card.media.height}
                  className="size-full object-cover"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <h3
                    id={panel.titleId}
                    className="text-balance text-lg font-semibold tracking-tight text-foreground"
                  >
                    {panel.card.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{panel.card.subtitle}</p>
                </div>
                {panel.action ? <Action action={panel.action} /> : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                {panel.facts.length > 0 ? (
                  <dl className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-primary/5 p-3">
                    {panel.facts.map((fact) => (
                      <div key={fact.label}>
                        <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                          {fact.label}
                        </dt>
                        <dd className="font-mono text-sm text-foreground">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {panel.body.map((paragraph, index) => (
                  <p key={index} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}

                <button
                  type="button"
                  onClick={panel.close.onClose}
                  className="mt-6 w-full rounded-full border border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {panel.close.label}
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default ExpandableCardRowList;
