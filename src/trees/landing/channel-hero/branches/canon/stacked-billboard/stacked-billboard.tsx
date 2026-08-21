/**
 * Stacked Billboard — a leaf on Channel Hero / Canon.
 *
 * PURE PRESENTATION. Its props ARE ChannelHeroVM.
 *
 * Structural answer: one centred column, no split. Everything stacks on a
 * single axis, so the hero reads top-to-bottom on every width and there is no
 * second column to collapse on mobile. The live strip becomes a pill above the
 * headline rather than a card beside it, and the links become a single divided
 * list — which is why this leaf stays calm under a nine-item link set where a
 * grid would start to look like a menu.
 *
 * Its breakpoints are CONTAINER queries: the stack has no second column to
 * collapse, but type size and the link rows still have to answer the width the
 * leaf was actually handed — half a lab row, a narrow sidebar, a full page.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import { staggerAt } from "../../../channel-hero.vm";
import type { ChannelHeroVM } from "../../../channel-hero.vm";

export const meta: LeafMeta = {
  label: "Stacked Billboard",
  description:
    "One centred column. Status becomes a pill above the headline; links become a divided list, not a grid.",
  sizeHint: "md",
  tags: ["centred", "single-axis", "quiet"],
};

const BANDS = 5;

function enter(vm: ChannelHeroVM, index: number) {
  const t = vm.reducedMotion ? 1 : staggerAt(vm.progress, index, BANDS);
  return {
    opacity: t,
    // A shorter, softer rise than Split Dock's — the stack is already vertical,
    // so a large travel would read as the whole page sliding.
    transform: `translateY(${((1 - t) * 8).toFixed(2)}px)`,
  };
}

export function ChannelHeroStackedBillboard(vm: ChannelHeroVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container rounded-lg border border-dashed border-border p-8 text-center @md:p-12">
        <p className="text-sm text-muted-foreground">No channel to introduce yet.</p>
      </section>
    );
  }

  if (vm.state === "loading") {
    return (
      <section aria-busy="true" className="@container mx-auto max-w-2xl space-y-5 py-16 text-center">
        <div className="mx-auto h-6 w-40 rounded-full bg-muted" />
        <div className="mx-auto h-12 w-full rounded bg-muted" />
        <div className="mx-auto h-12 w-3/4 rounded bg-muted" />
        <div className="mx-auto h-4 w-2/3 rounded bg-muted" />
        <span className="sr-only">Loading channel…</span>
      </section>
    );
  }

  return (
    <section
      data-state={vm.state}
      className="@container mx-auto flex max-w-3xl flex-col items-center gap-6 py-10 text-center @xl:gap-7 @xl:py-12"
    >
      <div style={enter(vm, 0)} className="flex flex-col items-center gap-4">
        {vm.channelAvatar ? (
          <Image
            unoptimized
            src={vm.channelAvatar.src}
            alt={vm.channelAvatar.alt}
            width={vm.channelAvatar.width}
            height={vm.channelAvatar.height}
            className="size-16 rounded-full"
          />
        ) : null}

        {vm.status ? (
          <p
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
              vm.state === "live"
                ? "border-destructive text-destructive"
                : "border-border text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                vm.state === "live" ? "bg-destructive" : "bg-muted-foreground",
                vm.state === "live" && !vm.reducedMotion && "animate-pulse",
              )}
            />
            {vm.status.label}
            {vm.status.audience ? (
              <span className="font-medium normal-case tracking-normal opacity-80">
                · {vm.status.audience}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="max-w-full truncate font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
            {vm.channelHandle}
          </p>
        )}
      </div>

      <h1
        style={enter(vm, 1)}
        className="text-balance text-3xl font-semibold leading-[1.08] tracking-tight text-foreground @sm:text-4xl @xl:text-5xl"
      >
        {vm.headlineLead}{" "}
        {/*
          The highlight was a clipped `primary→accent` gradient, which paints
          the largest text on the screen in the creator's raw accent. That is
          the trap `editor-mode.ts` already pins a test to: #9CCB1A measured
          1.91:1 upstream. A fill is the one place a creator's colour is SAFE,
          because `--primary-foreground` is derived against it — so the
          emphasis moves from the letterform to the plate behind it, and the
          creator's colour gets louder rather than quieter.
          `box-decoration-break: clone` keeps the padding on every wrapped line.
        */}
        <span className="bg-primary px-2 text-primary-foreground [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
          {vm.headlineHighlight}
        </span>
      </h1>

      {vm.headlineBadge ? (
        <p
          style={enter(vm, 1)}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          {vm.headlineBadge.image ? (
            <Image
              unoptimized
              src={vm.headlineBadge.image.src}
              alt={vm.headlineBadge.image.alt}
              width={vm.headlineBadge.image.width}
              height={vm.headlineBadge.image.height}
              className="h-4 w-auto opacity-60"
            />
          ) : null}
          {vm.headlineBadge.label}
        </p>
      ) : null}

      {vm.subheadline ? (
        <p style={enter(vm, 2)} className="max-w-xl text-pretty text-base text-muted-foreground">
          {vm.subheadline}
        </p>
      ) : null}

      {vm.status?.title ? (
        <p style={enter(vm, 2)} className="max-w-xl text-pretty text-sm font-medium text-foreground">
          {vm.status.title}
          {vm.status.elapsed ? (
            <span className="ml-2 font-normal text-muted-foreground">{vm.status.elapsed}</span>
          ) : null}
        </p>
      ) : null}

      {vm.actions.length > 0 ? (
        <div style={enter(vm, 3)} className="flex flex-wrap justify-center gap-3">
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
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                // `bg-foreground` is the one token a creator cannot move, so a
                // CTA painted in it stays platform-coloured on every creator
                // page. The accent is the whole point of this button.
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

      {vm.links.length > 0 ? (
        <div style={enter(vm, 4)} className="mt-6 w-full text-left">
          {vm.linksEyebrow ? (
            <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {vm.linksEyebrow}
            </p>
          ) : null}
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {vm.links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  onClick={link.onActivate}
                  data-icon={link.iconId}
                  data-recommended={link.recommended}
                  className="flex flex-col gap-0.5 py-3 transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring @sm:flex-row @sm:items-baseline @sm:justify-between @sm:gap-4"
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      link.recommended ? "text-primary" : "text-foreground",
                    )}
                  >
                    {link.label}
                  </span>
                  <span className="text-xs text-muted-foreground @sm:text-right">{link.detail}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default ChannelHeroStackedBillboard;
