/**
 * Media Grid — a leaf on Expandable Card / Canon.
 *
 * PURE PRESENTATION. Its props ARE ExpandableCardVM.
 * Structural answer: the picture leads. Cards are a responsive grid of media
 * tiles, and the open panel is a centred dialog over a scrim — the arrangement
 * the shared-element morph was designed for, because a tile and a panel are the
 * same shape at two sizes.
 *
 * The three obligations this leaf meets, and every leaf on this tree meets:
 *  1. spread `card.anchor` on the card's outermost element — that is the rect
 *     the morph starts from;
 *  2. put `panel.id` on the panel's outermost element, and spread
 *     `panel.motion.surface` there;
 *  3. clip the surface (`overflow-hidden`), because the counter-scaled content
 *     is deliberately wider than the box early in the morph.
 *
 * It computes no motion of its own. `vm.progress` is never read here.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { ExpandableCardAction, ExpandableCardVM } from "../../../expandable-card.vm";

export const meta: LeafMeta = {
  label: "Media Grid",
  description:
    "A grid of media tiles that open into a centred dialog — the arrangement the morph was designed for.",
  sizeHint: "lg",
  tags: ["grid", "media", "dialog", "morph"],
};

function ActionButton({
  action,
  className,
}: {
  action: ExpandableCardAction;
  className?: string;
}) {
  const base = cn(
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    action.disabled
      ? "cursor-not-allowed border border-border text-muted-foreground"
      : action.tone === "primary"
        ? "bg-primary text-primary-foreground hover:bg-accent"
        : "border border-border text-foreground hover:border-primary hover:text-primary",
    className,
  );

  if (action.href && !action.disabled) {
    return (
      <a href={action.href} onClick={action.onActivate ?? undefined} className={base}>
        {action.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={action.disabled}
      onClick={action.onActivate ?? undefined}
      className={base}
    >
      {action.label}
    </button>
  );
}

export function ExpandableCardMediaGrid(vm: ExpandableCardVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel ?? "Nothing to show yet."}</p>
      </section>
    );
  }

  const panel = vm.panel;

  return (
    <section data-state={vm.state} className="@container relative">
      {vm.eyebrow || vm.headline || vm.body ? (
        <header className="mb-6">
          {vm.eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {vm.eyebrow}
            </p>
          ) : null}
          {vm.headline ? (
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground">
              {vm.headline}
            </h2>
          ) : null}
          {vm.body ? (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{vm.body}</p>
          ) : null}
        </header>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
        {vm.cards.map((card) => (
          <li key={card.id}>
            <article
              {...card.anchor}
              data-card-state={card.state}
              className={cn(
                "group h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-300",
                card.state === "dimmed" ? "opacity-40" : "opacity-100",
                // The source card is the panel now. Holding its space stops the
                // grid reflowing behind the scrim, which is only visible on the
                // way out — and by then it reads as a glitch.
                card.state === "source" ? "opacity-0" : null,
                card.state === "resting"
                  ? "hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
                  : null,
              )}
            >
              <button
                type="button"
                id={card.triggerId}
                aria-expanded={card.state === "source"}
                aria-controls={card.panelId}
                onClick={card.onExpand}
                className="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Image
                    src={card.media.src}
                    alt={card.media.alt}
                    width={card.media.width}
                    height={card.media.height}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-balance text-base font-semibold leading-snug text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>
                </div>
              </button>

              {card.meta || card.action ? (
                <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                  {card.meta ? (
                    <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      {card.meta}
                    </span>
                  ) : (
                    <span />
                  )}
                  {card.action ? (
                    <ActionButton action={card.action} className="px-3 py-1 text-xs" />
                  ) : null}
                </div>
              ) : null}
            </article>
          </li>
        ))}
      </ul>

      {panel ? (
        <div
          data-phase={panel.phase}
          className="@container fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
        >
          <div
            aria-hidden
            style={panel.motion.backdrop}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <article
            id={panel.id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={panel.titleId}
            data-transition={panel.motion.transition}
            style={panel.motion.surface}
            className="relative flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div style={panel.motion.content} className="flex max-h-full min-h-0 w-full flex-col">
              <div
                style={panel.motion.media}
                className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted"
              >
                <Image
                  src={panel.card.media.src}
                  alt={panel.card.media.alt}
                  width={panel.card.media.width}
                  height={panel.card.media.height}
                  className="size-full object-cover"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      id={panel.titleId}
                      className="text-balance text-xl font-semibold tracking-tight text-foreground"
                    >
                      {panel.card.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{panel.card.subtitle}</p>
                  </div>
                  {panel.action ? <ActionButton action={panel.action} /> : null}
                </div>

                {panel.facts.length > 0 ? (
                  <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-border py-3">
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
                  <p key={index} className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={panel.close.onClose}
              className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-background/80 text-sm text-foreground ring-1 ring-border backdrop-blur hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span aria-hidden>×</span>
              <span className="sr-only">{panel.close.label}</span>
            </button>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default ExpandableCardMediaGrid;
