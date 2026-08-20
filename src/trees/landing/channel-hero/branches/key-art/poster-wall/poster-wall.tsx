/**
 * Poster Wall — a leaf on Channel Hero / Key Art.
 *
 * PURE PRESENTATION. Its props ARE ChannelHeroVM.
 *
 * Structural answer: the hero as a printed one-sheet. Every "start anywhere"
 * link becomes a panel in a hard-gutter mosaic, the headline is cut through the
 * middle of that mosaic as a wordmark slab, and the actions are set as a
 * billing block along the bottom — the way a game cover credits its studio.
 *
 * The entrance is a camera move, not an assembly. The whole poster starts
 * overscanned and settles back to frame while each panel falls out of its own
 * depth, so what arrives reads as one printed object being pushed into focus
 * rather than a UI building itself out of parts. The wordmark is last: it wipes
 * up out of its own hole and comes out of blur once the mosaic is already there.
 *
 * The slab is placed in the grid, never floated over it. A poster's logo hole
 * is a hole — a panel covered by the wordmark would be a link the viewer paid
 * for and cannot read, and this leaf refuses to make that trade.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import { clampProgress, staggerAt } from "../../../channel-hero.vm";
import type { ChannelHeroVM } from "../../../channel-hero.vm";

export const meta: LeafMeta = {
  label: "Poster Wall",
  description:
    "A printed one-sheet: links become a panel mosaic, the headline is a wordmark slab cut through it, actions set as a billing block.",
  sizeHint: "lg",
  tags: ["poster", "key-art", "mosaic", "loud"],
};

/**
 * Panel inks. A mosaic needs variety, and the only colours a creator can move
 * are primary / accent / ring — so the variety is made out of those three and
 * nothing else. A panel painted in neutrals would be a hole in their brand.
 */
const INKS = [
  "bg-gradient-to-br from-primary via-accent to-ring",
  "bg-gradient-to-tr from-accent via-ring to-primary",
  "bg-gradient-to-b from-ring via-primary to-accent",
  "bg-gradient-to-bl from-accent via-primary to-ring",
  "bg-gradient-to-tl from-primary via-ring to-accent",
] as const;

/** The ground the poster is printed on. Reads the creator's accent, not a hex. */
const GROUND =
  "radial-gradient(circle at 50% 26%, color-mix(in oklab, var(--accent) 42%, var(--background)), var(--background) 74%)";

export function ChannelHeroPosterWall(vm: ChannelHeroVM) {
  if (vm.state === "empty") {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border p-12">
        <p className="text-sm text-muted-foreground">No key art to print yet.</p>
      </section>
    );
  }

  if (vm.state === "loading") {
    return (
      <section aria-busy="true" className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 gap-2 p-2 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="aspect-square rounded-sm bg-muted" />
          ))}
        </div>
        <span className="sr-only">Printing…</span>
      </section>
    );
  }

  // Panels, then the wordmark, then the billing block — the wordmark is late on
  // purpose, so the poster exists before it is signed.
  const cells = vm.links.length + 3;
  const at = (index: number) => (vm.reducedMotion ? 1 : staggerAt(vm.progress, index, cells));

  // The camera move. Eased here rather than in the VM: this is presentation.
  const camera = vm.reducedMotion ? 1 : clampProgress(vm.progress);
  const settled = 1 - Math.pow(1 - camera, 3);

  const wordmark = at(vm.links.length + 1);
  // Five panels is the smallest mosaic that can close around a 2x2 hole on a
  // three-column grid without leaving one.
  const surrounded = vm.links.length >= 5;
  const billing = at(vm.links.length + 2);

  return (
    <section
      data-state={vm.state}
      data-poster-wall
      className="overflow-hidden rounded-xl border border-border"
      style={{ background: GROUND }}
    >
      <div
        data-poster-camera
        className="origin-center p-2 sm:p-3"
        style={{
          transform: `scale(${(1 + (1 - settled) * 0.14).toFixed(4)})`,
          opacity: Number((0.15 + 0.85 * settled).toFixed(3)),
        }}
      >
        {/* Studio credit — who printed this, and whether they are on air. */}
        <div
          style={{ opacity: Number(at(0).toFixed(3)) }}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-2 text-[0.6rem] font-black uppercase tracking-[0.28em] text-muted-foreground"
        >
          {vm.channelAvatar ? (
            <Image
              unoptimized
              src={vm.channelAvatar.src}
              alt={vm.channelAvatar.alt}
              width={vm.channelAvatar.width}
              height={vm.channelAvatar.height}
              className="size-5 rounded-sm ring-1 ring-ring"
            />
          ) : null}
          <span className="text-foreground">{vm.channelName}</span>
          <span>{vm.channelHandle}</span>
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
          {vm.linksEyebrow ? (
            <span className="ml-auto tracking-[0.2em]">{vm.linksEyebrow}</span>
          ) : null}
        </div>

        {/* The mosaic. Dense flow fills every cell the wordmark hole leaves. */}
        <div className="grid grid-flow-row-dense grid-cols-2 gap-2 md:grid-cols-3">
          {/*
            The wordmark slab. Placed in the grid at a fixed cell so panels flow
            around it, and revealed by a bottom-up wipe out of blur — the poster
            is stamped, not faded in.
          */}
          <div
            data-poster-wordmark
            style={{
              clipPath: `inset(${((1 - wordmark) * 100).toFixed(1)}% 0% 0% 0%)`,
              filter: `blur(${((1 - wordmark) * 5).toFixed(2)}px)`,
            }}
            className={cn(
              "col-span-2 flex flex-col justify-center gap-3 rounded-sm p-5 text-center sm:p-8",
              "bg-background/70 ring-2 ring-ring backdrop-blur-sm",
              // The hole only sits INSIDE the mosaic when there are enough
              // panels to close around it. Below that it takes a full band, so
              // the poster never prints with a gap where a panel should be.
              surrounded
                ? "row-span-2 row-start-2 md:col-start-2 md:row-start-2"
                : "md:col-span-3",
            )}
          >
            <h1 className="text-balance font-black uppercase leading-[0.78] tracking-tighter">
              <span className="block text-[0.7rem] tracking-[0.5em] text-muted-foreground sm:text-xs">
                {vm.headlineLead}
              </span>
              <span className="mt-3 block bg-gradient-to-b from-primary via-primary to-accent bg-clip-text text-6xl text-transparent sm:text-8xl">
                {vm.headlineHighlight}
              </span>
            </h1>

            {vm.headlineBadge ? (
              <p className="flex items-center justify-center gap-2 text-[0.58rem] font-bold uppercase tracking-[0.3em] text-muted-foreground">
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

            {vm.subheadline ? (
              <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                {vm.subheadline}
              </p>
            ) : null}

            {vm.status?.title ? (
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-foreground">
                {vm.status.title}
                {vm.status.audience ? (
                  <span className="ml-2 font-normal tracking-normal text-muted-foreground">
                    {vm.status.audience}
                  </span>
                ) : null}
                {vm.status.elapsed ? (
                  <span className="ml-2 font-normal tracking-normal text-muted-foreground">
                    {vm.status.elapsed}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          {vm.links.map((link, index) => {
            const t = at(index);
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={link.onActivate}
                title={link.detail}
                data-icon={link.iconId}
                data-recommended={link.recommended}
                data-poster-panel
                style={{
                  // Each panel falls out of its own depth — deeper the later it
                  // is billed, which is what makes the mosaic read as one move.
                  transform: `scale(${(1 + (1 - t) * (0.1 + index * 0.035)).toFixed(4)})`,
                  opacity: Number(t.toFixed(3)),
                }}
                className={cn(
                  "group relative flex aspect-[5/4] flex-col justify-end overflow-hidden rounded-sm p-3",
                  "ring-1 ring-inset ring-ring/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  INKS[index % INKS.length],
                  link.recommended && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
              >
                {/* Title-card scrim. A panel is art; the caption has to stay readable over it. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent"
                />
                {link.recommended ? (
                  <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-[0.2em] text-primary-foreground">
                    Start here
                  </span>
                ) : null}
                <span className="relative text-sm font-black uppercase leading-tight tracking-[0.06em] text-foreground">
                  {link.label}
                </span>
                <span className="relative mt-0.5 text-[0.68rem] leading-snug text-muted-foreground">
                  {link.detail}
                </span>
              </a>
            );
          })}
        </div>

        {/* Billing block. Credits type: small, centred, evenly billed. */}
        {vm.actions.length > 0 ? (
          <div
            style={{ opacity: Number(billing.toFixed(3)) }}
            className="flex flex-wrap items-center justify-center gap-2 px-1 pt-3"
          >
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
                  "rounded-sm px-4 py-2 text-[0.6rem] font-black uppercase tracking-[0.26em] transition-colors",
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
      </div>
    </section>
  );
}

export default ChannelHeroPosterWall;
