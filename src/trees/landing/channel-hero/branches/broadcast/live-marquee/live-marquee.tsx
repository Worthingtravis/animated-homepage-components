/**
 * Live Marquee — a leaf on Channel Hero / Broadcast.
 *
 * PURE PRESENTATION. Its props ARE ChannelHeroVM.
 *
 * Structural answer: on-stream furniture. A tally bar wipes across the top as
 * the hero arrives, the identity sits in a lower-third slab pinned to the
 * bottom-left of a wide stage, and the links run as a ticker rail rather than a
 * grid. It answers the same contract as its Canon siblings, but it assumes the
 * page has nothing else to say — which is exactly when a hero is allowed to be
 * this loud.
 *
 * The one thing it will not do is imply the channel is live when it is not: the
 * tally light, the wipe and the ticker all read `vm.state`, not `vm.progress`.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import { staggerAt } from "../../../channel-hero.vm";
import type { ChannelHeroVM } from "../../../channel-hero.vm";

export const meta: LeafMeta = {
  label: "Live Marquee",
  description:
    "Broadcast furniture — a tally bar that wipes in, a lower-third slab, and links on a ticker rail.",
  sizeHint: "lg",
  tags: ["loud", "broadcast", "ticker"],
};

const BANDS = 4;

function enter(vm: ChannelHeroVM, index: number) {
  const t = vm.reducedMotion ? 1 : staggerAt(vm.progress, index, BANDS);
  return {
    opacity: t,
    transform: `translateX(${((1 - t) * -18).toFixed(2)}px)`,
  };
}

export function ChannelHeroLiveMarquee(vm: ChannelHeroVM) {
  if (vm.state === "empty") {
    return (
      <section className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">No channel on air.</p>
      </section>
    );
  }

  if (vm.state === "loading") {
    return (
      <section aria-busy="true" className="overflow-hidden rounded-2xl border border-border">
        <div className="h-1.5 w-1/3 bg-muted" />
        <div className="flex min-h-64 items-end bg-card p-6">
          <div className="w-full space-y-3">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-10 w-2/3 rounded bg-muted" />
          </div>
        </div>
        <span className="sr-only">Coming on air…</span>
      </section>
    );
  }

  // The wipe is transport-driven, so the lab's clock scrubs it directly.
  const wipe = vm.reducedMotion ? 1 : staggerAt(vm.progress, 0, BANDS);

  return (
    <section
      data-state={vm.state}
      className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
    >
      {/* Tally bar — full width only once the entrance has finished. */}
      <div className="h-1.5 w-full bg-muted">
        <div
          className={cn(
            "h-1.5 transition-none",
            vm.state === "live" ? "bg-destructive" : "bg-muted-foreground",
          )}
          style={{ width: `${(wipe * 100).toFixed(1)}%` }}
        />
      </div>

      <div className="flex min-h-72 flex-col justify-end gap-6 bg-gradient-to-b from-card to-background p-6 sm:p-8">
        {/* Lower third */}
        <div style={enter(vm, 0)} className="flex items-center gap-4">
          {vm.channelAvatar ? (
            <Image
              unoptimized
              src={vm.channelAvatar.src}
              alt={vm.channelAvatar.alt}
              width={vm.channelAvatar.width}
              height={vm.channelAvatar.height}
              className="size-12 shrink-0 rounded-md"
            />
          ) : null}
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.3em]">
              {vm.status ? (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full",
                      vm.state === "live" ? "bg-destructive" : "bg-muted-foreground",
                      vm.state === "live" && !vm.reducedMotion && "animate-pulse",
                    )}
                  />
                  <span
                    className={vm.state === "live" ? "text-destructive" : "text-muted-foreground"}
                  >
                    {vm.status.label}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{vm.channelHandle}</span>
              )}
              {vm.status?.category ? (
                <span className="truncate font-semibold tracking-[0.16em] text-muted-foreground">
                  · {vm.status.category}
                </span>
              ) : null}
            </p>
            <p className="truncate text-lg font-bold">{vm.channelName}</p>
          </div>
        </div>

        <h1
          style={enter(vm, 1)}
          className="text-balance text-3xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl"
        >
          {vm.headlineLead}{" "}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            {vm.headlineHighlight}
          </span>
        </h1>

        {vm.status?.title ? (
          <p style={enter(vm, 1)} className="text-pretty text-sm font-medium text-muted-foreground">
            <span className="text-foreground">{vm.status.title}</span>
            {vm.status.audience ? <span className="ml-3">{vm.status.audience}</span> : null}
            {vm.status.elapsed ? <span className="ml-3">{vm.status.elapsed}</span> : null}
          </p>
        ) : null}

        {vm.subheadline ? (
          <p style={enter(vm, 2)} className="max-w-2xl text-pretty text-sm text-muted-foreground">
            {vm.subheadline}
          </p>
        ) : null}

        {vm.headlineBadge ? (
          <p
            style={enter(vm, 2)}
            className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-muted-foreground"
          >
            {vm.headlineBadge.image ? (
              <Image
                unoptimized
                src={vm.headlineBadge.image.src}
                alt={vm.headlineBadge.image.alt}
                width={vm.headlineBadge.image.width}
                height={vm.headlineBadge.image.height}
                className="h-3.5 w-auto opacity-60"
              />
            ) : null}
            {vm.headlineBadge.label}
          </p>
        ) : null}

        {vm.actions.length > 0 ? (
          <div style={enter(vm, 3)} className="flex flex-wrap gap-2">
            {vm.actions.map((action, index) => (
              <a
                key={action.id}
                href={action.href}
                title={action.tooltip}
                onClick={action.onActivate}
                rel={action.external ? "noreferrer" : undefined}
                target={action.external ? "_blank" : undefined}
                data-kind={action.kind}
                className={cn(
                  "rounded-md px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  // The loud action wears the CREATOR's accent, not the tally
                  // light's red. `bg-destructive` here meant a streamer could
                  // never colour their own primary call to action — the red
                  // below is reserved for the live indicator, which is
                  // genuinely semantic and genuinely not theirs to pick.
                  index === 0
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border text-muted-foreground hover:border-ring hover:text-foreground",
                )}
              >
                {action.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      {/* Ticker rail. Horizontal scroll, not a grid — it never grows taller. */}
      {vm.links.length > 0 ? (
        <div className="border-t border-border bg-card">
          {vm.linksEyebrow ? (
            <p className="px-6 pt-3 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-muted-foreground sm:px-8">
              {vm.linksEyebrow}
            </p>
          ) : null}
          <ul className="flex snap-x gap-3 overflow-x-auto px-6 py-3 sm:px-8">
            {vm.links.map((link) => (
              <li key={link.id} className="snap-start">
                <a
                  href={link.href}
                  onClick={link.onActivate}
                  data-icon={link.iconId}
                  data-recommended={link.recommended}
                  className={cn(
                    "flex w-52 shrink-0 flex-col rounded-md border px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    link.recommended
                      ? "border-ring bg-background"
                      : "border-border hover:border-ring hover:bg-background",
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">
                    {link.label}
                  </span>
                  <span className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
                    {link.detail}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default ChannelHeroLiveMarquee;
