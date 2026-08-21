/**
 * Inline Detail — a leaf on Expandable Card / Canon.
 *
 * PURE PRESENTATION. Its props ARE ExpandableCardVM.
 * Structural answer: **no overlay at all.** The detail opens as a row in the
 * flow, directly under the grid, and the page stays where it was. Nothing is
 * covered, nothing is trapped, and the reader can still see what else was on
 * offer while reading one of them.
 *
 * This leaf is the proof that the contract is not modal-shaped. It renders the
 * same VM as its siblings, gets the same measured morph — the panel is laid out
 * in flow and transformed to start on the card, which is the only difference
 * between an accordion and a dialog — and simply ignores `motion.backdrop`,
 * because it has no scrim to put it on. A field a leaf does not need is a field
 * a leaf does not render.
 *
 * It also keeps the source card *visible*, unlike the overlay leaves: with
 * nothing covering the grid, hiding the card you just pressed is a hole in the
 * layout. Pair it with `lockScroll={false}` on the container.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { ExpandableCardAction, ExpandableCardVM } from "../../../expandable-card.vm";

export const meta: LeafMeta = {
  label: "Inline Detail",
  description:
    "No overlay — the detail opens as a row in the flow under the grid. Nothing is covered and the page never locks.",
  sizeHint: "lg",
  tags: ["accordion", "in-flow", "no-modal", "morph"],
};

function Action({ action }: { action: ExpandableCardAction }) {
  const className = cn(
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    action.disabled
      ? "cursor-not-allowed border border-border text-muted-foreground"
      : action.tone === "primary"
        ? "bg-primary text-primary-foreground hover:bg-accent"
        : "border border-border text-foreground hover:border-primary hover:text-primary",
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

export function ExpandableCardInlineDetail(vm: ExpandableCardVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel ?? "Nothing to show yet."}</p>
      </section>
    );
  }

  const panel = vm.panel;

  return (
    <section data-state={vm.state} className="@container flex flex-col gap-5">
      {vm.eyebrow || vm.headline || vm.body ? (
        <header>
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
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{vm.body}</p>
          ) : null}
        </header>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @4xl:grid-cols-4">
        {vm.cards.map((card) => (
          <li key={card.id}>
            <button
              type="button"
              {...card.anchor}
              id={card.triggerId}
              aria-expanded={card.state === "source"}
              aria-controls={card.panelId}
              onClick={card.onExpand}
              data-card-state={card.state}
              className={cn(
                "flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left transition-all duration-300",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                card.state === "source"
                  ? "border-primary ring-2 ring-ring/50"
                  : "border-border hover:border-primary/60",
                card.state === "dimmed" ? "opacity-55" : null,
              )}
            >
              <span className="relative aspect-video w-full overflow-hidden bg-muted">
                <Image
                  src={card.media.src}
                  alt={card.media.alt}
                  width={card.media.width}
                  height={card.media.height}
                  className="size-full object-cover"
                />
              </span>
              <span className="flex flex-1 flex-col gap-0.5 p-3">
                <span className="text-balance text-sm font-semibold leading-snug text-foreground">
                  {card.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">{card.subtitle}</span>
                {card.meta ? (
                  <span className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-primary">
                    {card.meta}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {panel ? (
        <article
          id={panel.id}
          role="region"
          aria-labelledby={panel.titleId}
          data-phase={panel.phase}
          data-transition={panel.motion.transition}
          style={panel.motion.surface}
          className="overflow-hidden rounded-xl border border-primary/40 bg-card shadow-lg"
        >
          <div style={panel.motion.content} className="flex flex-col gap-5 p-5 @lg:flex-row">
            <div
              style={panel.motion.media}
              className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted @lg:w-64"
            >
              <Image
                src={panel.card.media.src}
                alt={panel.card.media.alt}
                width={panel.card.media.width}
                height={panel.card.media.height}
                className="size-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3
                    id={panel.titleId}
                    className="text-balance text-lg font-semibold tracking-tight text-foreground"
                  >
                    {panel.card.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{panel.card.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={panel.close.onClose}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-border px-3 text-xs text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {panel.close.label}
                </button>
              </div>

              {panel.facts.length > 0 ? (
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
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

              {panel.action ? (
                <div className="mt-5">
                  <Action action={panel.action} />
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}

export default ExpandableCardInlineDetail;
