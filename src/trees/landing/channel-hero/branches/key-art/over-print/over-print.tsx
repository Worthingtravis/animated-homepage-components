/**
 * Over Print — a leaf on Channel Hero / Key Art.
 *
 * PURE PRESENTATION. Its props ARE ChannelHeroVM.
 *
 * Structural answer: the sibling poster, argued the other way. Poster Wall
 * composes the art AROUND a logo hole, on the principle that a panel covered by
 * the wordmark is a link the viewer cannot read. This leaf covers them on
 * purpose — the mosaic runs edge to edge with no hole in it, and the wordmark
 * is floated across the middle at a size the grid cannot contain.
 *
 * It gets away with it because the overprint is HOLLOW. The type is a keyline
 * and a knockout, never a fill: a heavy stroke in the plate colour, a thin one
 * in a creator ink, and nothing in the counters. So the panels underneath read
 * straight through the letterforms, and the one thing that sits over a link is
 * a 2px outline rather than a slab. That is the trade the whole leaf is: the
 * logo gets to be bigger than the poster, and the art pays almost nothing.
 *
 * The panels are screen-printed rather than painted — flat plates, one hard
 * diagonal split, a coarse band overlay. Poster Wall's panels are lit scenes
 * with a sun in them; these are ink on paper, which is what lets type sit on
 * top of them without the two fighting.
 *
 * ── The entrance is a camera move ──────────────────────────────────────────
 * The sheet starts overscanned and settles back to frame while each panel
 * arrives out of its own depth, back to front. The overprint is last and it
 * resolves out of blur with a slight overshoot — a stamp coming down, not a
 * layer fading up. All of it derives from `vm.progress`, so the lab clock
 * scrubs it; `vm.reducedMotion` collapses every stage to its resting frame.
 *
 * ── The sheet is sized by its own box ──────────────────────────────────────
 * A one-sheet is a printed object at a fixed proportion, and the overprint only
 * works if the type and the mosaic agree on one width. Every breakpoint here is
 * a container query against the sheet, so the leaf composes the same whether it
 * is handed a sidebar or a full page.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import { clampProgress, staggerAt } from "../../../channel-hero.vm";
import type { ChannelHeroVM } from "../../../channel-hero.vm";

export const meta: LeafMeta = {
  label: "Over Print",
  description:
    "The mosaic runs edge to edge and the wordmark is overprinted across it — hollow, so the art reads through the letterforms.",
  sizeHint: "lg",
  tags: ["poster", "key-art", "mosaic", "overprint", "loud"],
};

/** The three inks a creator owns. Every plate below is mixed out of these. */
const INKS = ["var(--primary)", "var(--accent)", "var(--ring)"] as const;

/**
 * One screen-printed panel: two flat plates split on a hard diagonal, with a
 * coarse band overlay standing in for a halftone. No light source, no depth —
 * the flatness is what lets an outlined wordmark sit on top and still read.
 */
function plate(index: number) {
  const front = INKS[index % INKS.length];
  const back = INKS[(index + 2) % INKS.length];
  const angle = 108 + ((index * 37) % 144);
  const split = 38 + ((index * 13) % 30);
  const band = 3 + (index % 3);

  return {
    backgroundImage: [
      // The halftone. Coarse, low-contrast, and rotated per panel so the
      // mosaic does not moiré against itself.
      `repeating-linear-gradient(${angle + 45}deg,
         color-mix(in oklab, var(--background) 22%, transparent) 0px,
         color-mix(in oklab, var(--background) 22%, transparent) ${band}px,
         transparent ${band}px,
         transparent ${band * 3}px)`,
      // Two plates, one hard edge. `color-mix` against the plate colours keeps
      // every panel inside the creator's palette rather than beside it.
      `linear-gradient(${angle}deg,
         color-mix(in oklab, ${front} 82%, var(--foreground)) 0%,
         color-mix(in oklab, ${front} 82%, var(--foreground)) ${split}%,
         color-mix(in oklab, ${back} 70%, var(--background)) ${split}%,
         color-mix(in oklab, ${back} 70%, var(--background)) 100%)`,
    ].join(", "),
  };
}

/** The field the sheet hangs in. */
const FIELD = [
  "radial-gradient(70% 48% at 50% 0%, color-mix(in oklab, var(--ring) 62%, var(--background)), transparent 70%)",
  "radial-gradient(80% 60% at 50% 110%, color-mix(in oklab, var(--primary) 52%, var(--background)), transparent 76%)",
  "linear-gradient(to bottom, var(--background), var(--background))",
].join(", ");

/**
 * Panel spans, as a repeating figure rather than a rule per index. A mosaic
 * needs a beat — two wide, one tall, three square — and a modulus gives it one
 * that holds for four links or for forty.
 */
const SPANS = [
  "col-span-2 row-span-2",
  "col-span-2",
  "col-span-1 row-span-2",
  "col-span-1",
  "col-span-1",
  "col-span-2",
] as const;

/** Overshoot without a clock: easeOutBack, sampled straight off `progress`. */
function stamp(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function ChannelHeroOverPrint(vm: ChannelHeroVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border p-8">
        <p className="text-sm text-muted-foreground">Nothing to print yet.</p>
      </section>
    );
  }

  if (vm.state === "loading") {
    return (
      <section
        aria-busy="true"
        className="@container overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-1 p-1">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={cn("min-h-16 bg-muted", SPANS[index % SPANS.length])} />
          ))}
        </div>
        <span className="sr-only">Printing…</span>
      </section>
    );
  }

  // Panels first, then the overprint, then the billing block. The logo is late
  // on purpose: the art has to exist before it is signed.
  const stages = vm.links.length + 3;
  const at = (index: number) => (vm.reducedMotion ? 1 : staggerAt(vm.progress, index, stages));

  // The camera. Eased here rather than in the VM — this is presentation.
  const camera = vm.reducedMotion ? 1 : clampProgress(vm.progress);
  const settled = 1 - Math.pow(1 - camera, 3);

  const overprint = at(vm.links.length + 1);
  const billing = at(vm.links.length + 2);

  return (
    <section
      data-state={vm.state}
      data-over-print
      className="@container overflow-hidden rounded-xl border border-border"
      style={{ backgroundImage: FIELD }}
    >
      <div
        data-poster-camera
        className="mx-auto w-full max-w-3xl origin-center px-3 py-6 @lg:px-4 @lg:py-8 @2xl:px-6 @2xl:py-10"
        style={{
          transform: `scale(${(1 + (1 - settled) * 0.12).toFixed(4)})`,
          opacity: Number((0.2 + 0.8 * settled).toFixed(3)),
        }}
      >
        {/* Studio credit — who printed this, and whether they are on air. */}
        <div
          style={{ opacity: Number(at(0).toFixed(3)) }}
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pb-3 text-[0.58rem] font-black uppercase tracking-[0.32em] text-muted-foreground"
        >
          {vm.channelAvatar ? (
            <Image
              unoptimized
              src={vm.channelAvatar.src}
              alt={vm.channelAvatar.alt}
              width={vm.channelAvatar.width}
              height={vm.channelAvatar.height}
              className="size-4 rounded-sm ring-1 ring-ring"
            />
          ) : null}
          <span className="max-w-full truncate text-foreground">{vm.channelName}</span>
          <span className="max-w-full truncate">{vm.channelHandle}</span>
          {vm.status ? (
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  vm.state === "live" ? "bg-destructive" : "bg-muted-foreground",
                  vm.state === "live" && !vm.reducedMotion && "animate-pulse",
                )}
              />
              <span className={vm.state === "live" ? "text-destructive" : undefined}>
                {vm.status.label}
              </span>
              {vm.status.category ? <span>· {vm.status.category}</span> : null}
            </span>
          ) : null}
        </div>

        {/* The sheet. The mosaic and the overprint are siblings in one stack. */}
        <div className="relative isolate overflow-hidden bg-border ring-1 ring-border">
          {/*
            The art. No hole — every cell is a panel, and the spans repeat on a
            six-beat figure so the mosaic keeps a rhythm at any link count.
          */}
          {vm.links.length > 0 ? (
            <ul className="grid auto-rows-[minmax(3.5rem,1fr)] grid-flow-row-dense grid-cols-4 gap-1 p-1 @lg:auto-rows-[minmax(4.5rem,1fr)] @2xl:auto-rows-[minmax(6rem,1fr)]">
              {vm.links.map((link, index) => {
                // Back to front: a panel arrives out of its own depth, so the
                // mosaic assembles as one object rather than a queue of tiles.
                const arrived = at(index);
                return (
                  <li
                    key={link.id}
                    className={cn("relative", SPANS[index % SPANS.length])}
                    style={{
                      opacity: Number(arrived.toFixed(3)),
                      transform: `translateY(${((1 - arrived) * 14).toFixed(2)}px) scale(${(
                        0.94 +
                        0.06 * arrived
                      ).toFixed(4)})`,
                    }}
                  >
                    <a
                      href={link.href}
                      onClick={link.onActivate}
                      data-icon={link.iconId}
                      data-recommended={link.recommended}
                      className={cn(
                        "group relative flex h-full flex-col justify-end overflow-hidden p-2 @lg:p-3",
                        "focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring",
                        link.recommended && "ring-2 ring-inset ring-ring",
                      )}
                      style={plate(index)}
                    >
                      {/* Caption plate. The panel is ink; the words need paper. */}
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent"
                      />
                      <span className="relative truncate text-[0.6rem] font-black uppercase tracking-[0.14em] text-foreground @lg:text-xs">
                        {link.label}
                      </span>
                      <span className="relative truncate text-[0.55rem] text-muted-foreground @lg:text-[0.65rem]">
                        {link.detail}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* No links is not an empty frame — it is a single uncut plate. */
            <div className="min-h-48 @2xl:min-h-64" style={plate(0)} />
          )}

          {/*
            The overprint. `pointer-events-none` is the whole safety argument:
            the type covers the panels visually and not at all functionally, so
            every link underneath stays clickable across its full area.
          */}
          <div
            data-overprint
            aria-hidden={false}
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-2 text-center"
            style={{
              filter: `blur(${((1 - overprint) * 10).toFixed(2)}px)`,
              opacity: Number(overprint.toFixed(3)),
              transform: `scale(${(0.82 + 0.18 * stamp(overprint)).toFixed(4)})`,
            }}
          >
            {vm.headlineLead ? (
              <p className="text-[0.5rem] font-black uppercase leading-none tracking-[0.4em] text-foreground @lg:text-[0.6rem] @lg:tracking-[0.5em] @2xl:text-xs">
                {vm.headlineLead}
              </p>
            ) : null}

            {/*
              Three passes of one word. A heavy keyline in the plate colour so
              the letterforms separate from whatever panel they land on, a thin
              ink keyline just inside it, and a face that is TRANSPARENT — the
              art shows through the counters, which is the only reason this is
              allowed to sit over the links at all.
            */}
            <span className="relative block max-w-[8ch] break-words text-4xl font-black uppercase leading-[0.78] tracking-tighter @lg:text-5xl @2xl:text-6xl">
              <span
                aria-hidden
                className="absolute inset-0 text-transparent"
                style={{ WebkitTextStroke: "0.2em var(--background)" }}
              >
                {vm.headlineHighlight}
              </span>
              <span
                aria-hidden
                className="absolute inset-0 text-transparent"
                style={{ WebkitTextStroke: "0.07em var(--primary)" }}
              >
                {vm.headlineHighlight}
              </span>
              <span className="relative text-transparent" style={{ WebkitTextStroke: "0" }}>
                {vm.headlineHighlight}
              </span>
              {/* The word still has to reach a screen reader, once. */}
              <span className="sr-only">{vm.headlineHighlight}</span>
            </span>

            {vm.headlineBadge ? (
              <p className="flex items-center gap-2 text-[0.5rem] font-black uppercase tracking-[0.3em] text-foreground @lg:text-[0.6rem]">
                {vm.headlineBadge.image ? (
                  <Image
                    unoptimized
                    src={vm.headlineBadge.image.src}
                    alt={vm.headlineBadge.image.alt}
                    width={vm.headlineBadge.image.width}
                    height={vm.headlineBadge.image.height}
                    className="h-3 w-auto opacity-70"
                  />
                ) : null}
                {vm.headlineBadge.label}
              </p>
            ) : null}
          </div>
        </div>

        {/* Billing block — everything a poster prints small, outside the art. */}
        <div
          className="flex flex-col items-center gap-3 pt-4"
          style={{
            opacity: Number(billing.toFixed(3)),
            transform: `translateY(${((1 - billing) * 8).toFixed(2)}px)`,
          }}
        >
          {vm.status?.title || vm.status?.audience || vm.status?.elapsed ? (
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[0.55rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
              {vm.status.title ? (
                <span className="max-w-full truncate text-foreground">{vm.status.title}</span>
              ) : null}
              {vm.status.audience ? <span>· {vm.status.audience}</span> : null}
              {vm.status.elapsed ? <span>· {vm.status.elapsed}</span> : null}
            </p>
          ) : null}

          {vm.subheadline ? (
            <p className="max-w-prose text-pretty text-center text-xs text-muted-foreground @lg:text-sm">
              {vm.subheadline}
            </p>
          ) : null}

          {vm.actions.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
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
                    "px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.2em] transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    index === 0
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {action.label}
                </a>
              ))}
            </div>
          ) : null}

          {vm.linksEyebrow ? (
            <p className="text-[0.5rem] font-black uppercase tracking-[0.34em] text-muted-foreground">
              {vm.linksEyebrow}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default ChannelHeroOverPrint;
