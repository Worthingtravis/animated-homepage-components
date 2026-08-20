/**
 * Full Bleed — a leaf on Expandable Card / Experimental.
 *
 * PURE PRESENTATION. Its props ARE ExpandableCardVM.
 * Structural answer: the picture is the whole card. Type sits *on* the media
 * behind a gradient rather than under it, and the panel opens to nearly the
 * whole viewport with the same image full-bleed across its head — so the thing
 * that grows is the picture, and the copy arrives on top of it.
 *
 * The experimental part is what it gives up. There is no separate text block to
 * fall back on, so a light thumbnail and a long title are in direct competition
 * and only the scrim keeps the title legible. That is a real bet about the
 * media a caller has, which is why this is not on Canon — and why the `Missing
 * optionals` and `Long copy` fixtures matter more here than anywhere else on
 * this tree.
 *
 * It pairs naturally with the `sheet` transition, but takes whatever it is
 * given: it spreads `panel.motion.*` like every other leaf and decides nothing.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { ExpandableCardAction, ExpandableCardVM } from "../../../expandable-card.vm";

export const meta: LeafMeta = {
  label: "Full Bleed",
  description:
    "The picture is the card — type rides on the media, and the panel opens to a near-full-viewport sheet.",
  sizeHint: "lg",
  tags: ["editorial", "media-led", "sheet", "experimental"],
};

function Action({ action }: { action: ExpandableCardAction }) {
  const className = cn(
    "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    action.disabled
      ? "cursor-not-allowed border border-border text-muted-foreground"
      : action.tone === "primary"
        ? "bg-primary text-primary-foreground hover:bg-accent"
        : "border border-primary/50 text-primary hover:bg-primary/10",
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

export function ExpandableCardFullBleed(vm: ExpandableCardVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-card/40">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel ?? "Nothing to show yet."}</p>
      </section>
    );
  }

  const panel = vm.panel;

  return (
    <section data-state={vm.state} className="@container relative">
      {vm.eyebrow || vm.headline || vm.body ? (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {vm.eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                {vm.eyebrow}
              </p>
            ) : null}
            {vm.headline ? (
              <h2 className="mt-2 text-balance text-4xl font-semibold tracking-tight text-foreground">
                {vm.headline}
              </h2>
            ) : null}
          </div>
          {vm.body ? (
            <p className="max-w-sm text-sm text-muted-foreground">{vm.body}</p>
          ) : null}
        </header>
      ) : null}

      <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @5xl:grid-cols-3">
        {vm.cards.map((card, index) => (
          <li
            key={card.id}
            // A deliberately uneven grid — every third tile is tall. It is
            // index arithmetic about *layout*, which is presentation; the VM
            // still decides nothing about size.
            className={index % 3 === 0 ? "@lg:row-span-2" : undefined}
          >
            <button
              type="button"
              {...card.anchor}
              id={card.triggerId}
              aria-expanded={card.state === "source"}
              aria-controls={card.panelId}
              onClick={card.onExpand}
              data-card-state={card.state}
              className={cn(
                "group relative flex h-full min-h-52 w-full cursor-pointer overflow-hidden rounded-2xl border border-border text-left transition-all duration-300",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                card.state === "dimmed" ? "opacity-35" : null,
                card.state === "source" ? "opacity-0" : null,
                card.state === "resting" ? "hover:border-primary" : null,
              )}
            >
              <Image
                src={card.media.src}
                alt={card.media.alt}
                width={card.media.width}
                height={card.media.height}
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <span className="relative mt-auto flex w-full flex-col gap-1 p-4">
                {card.meta ? (
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-primary">
                    {card.meta}
                  </span>
                ) : null}
                <span className="text-balance text-lg font-semibold leading-tight text-foreground">
                  {card.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">{card.subtitle}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {panel ? (
        <div data-phase={panel.phase} className="@container fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-6">
          <div
            aria-hidden
            style={panel.motion.backdrop}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
          />

          <article
            id={panel.id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={panel.titleId}
            data-transition={panel.motion.transition}
            style={panel.motion.surface}
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl @lg:max-h-[86vh] @lg:max-w-3xl @lg:rounded-3xl"
          >
            <div style={panel.motion.content} className="flex max-h-full min-h-0 flex-col">
              <div
                style={panel.motion.media}
                className="relative aspect-[16/7] w-full shrink-0 overflow-hidden bg-muted"
              >
                <Image
                  src={panel.card.media.src}
                  alt={panel.card.media.alt}
                  width={panel.card.media.width}
                  height={panel.card.media.height}
                  className="size-full object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  {panel.card.meta ? (
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-primary">
                      {panel.card.meta}
                    </p>
                  ) : null}
                  <h3
                    id={panel.titleId}
                    className="mt-1 text-balance text-2xl font-semibold tracking-tight text-foreground @lg:text-3xl"
                  >
                    {panel.card.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{panel.card.subtitle}</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
                {panel.facts.length > 0 ? (
                  <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border pb-4">
                    {panel.facts.map((fact) => (
                      <div key={fact.label}>
                        <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                          {fact.label}
                        </dt>
                        <dd className="font-mono text-base text-foreground">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {panel.body.map((paragraph, index) => (
                  <p
                    key={index}
                    className={cn(
                      "mt-4 leading-relaxed text-muted-foreground",
                      index === 0 ? "text-base text-foreground" : "text-sm",
                    )}
                  >
                    {paragraph}
                  </p>
                ))}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {panel.action ? <Action action={panel.action} /> : null}
                  <button
                    type="button"
                    onClick={panel.close.onClose}
                    className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {panel.close.label}
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default ExpandableCardFullBleed;
