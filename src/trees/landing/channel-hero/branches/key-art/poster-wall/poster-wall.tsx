/**
 * Poster Wall — a leaf on Channel Hero / Key Art.
 *
 * PURE PRESENTATION. Its props ARE ChannelHeroVM.
 *
 * Structural answer: the hero as a printed one-sheet — a square poster hung in
 * a dark field, not a section that fills the page. Every "start anywhere" link
 * becomes a painted panel in a hard-gutter mosaic, the headline is the logo cut
 * through the middle of it, and everything a poster prints small — the studio
 * credit, the tagline, the billing block — sits outside the art.
 *
 * The entrance is a camera move, not an assembly. The whole poster starts
 * overscanned and settles back to frame while each panel falls out of its own
 * depth, so what arrives reads as one printed object being pushed into focus
 * rather than a UI building itself out of parts. The logo is last: it wipes up
 * out of its own hole and comes out of blur once the art is already there.
 *
 * The logo is placed IN the grid, never floated over it. A poster's logo hole
 * is a hole — the art is composed around it — and a panel covered by the
 * wordmark would be a link the viewer paid for and cannot read.
 *
 * ── Why the panels are painted rather than filled ──────────────────────────
 * Key art is illustration, and the flat two-stop fills this leaf started with
 * read as UI chrome no matter how loud the colours got. So each panel is a
 * composed scene — a low sun, a horizon, a wash coming up off the ground —
 * built ONLY out of the three inks a creator can move. `color-mix` against
 * `--background` is what makes one ink produce a whole sky, so the poster is
 * genuinely theirs rather than a picture with their colour dabbed on it.
 *
 * ── The poster is sized by its own box, never by the window ────────────────
 * A one-sheet is a printed object at a fixed proportion: the mosaic, the logo
 * hole and the wordmark all have to agree, and they only agree if they read the
 * same width. Viewport rules broke that agreement — at 1440px in a 548px lab
 * column the art opened three 160px panels while the wordmark stayed at 72px,
 * so the logo was bigger than the picture it was signing. `@container` keeps
 * the whole sheet on one measurement.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import { clampProgress, staggerAt } from "../../../channel-hero.vm";
import type { ChannelHeroVM } from "../../../channel-hero.vm";

export const meta: LeafMeta = {
  label: "Poster Wall",
  description:
    "A square one-sheet: links become painted panels around a logo hole, the headline is the logo, credits and actions print outside the art.",
  sizeHint: "lg",
  tags: ["poster", "key-art", "mosaic", "loud"],
};

/** The three inks a creator owns. Every scene below is mixed out of these. */
const INKS = ["var(--primary)", "var(--accent)", "var(--ring)"] as const;

/**
 * One painted panel. Sun, sky, horizon glow — the same four layers each time,
 * rotated through the inks and nudged by index so no two panels repeat.
 */
function scene(index: number) {
  const sun = INKS[index % INKS.length];
  const sky = INKS[(index + 1) % INKS.length];
  const ground = INKS[(index + 2) % INKS.length];
  const horizon = 52 + ((index * 7) % 22);
  const sunX = 24 + ((index * 29) % 54);

  return {
    backgroundImage: [
      // The sun, sitting on the horizon. Mixed toward the foreground so it
      // burns rather than tints — key art is lit, not washed.
      `radial-gradient(34% 22% at ${sunX}% ${horizon}%, color-mix(in oklab, var(--foreground) 58%, ${sun}), transparent 68%)`,
      // Sky down to a saturated horizon, a hard cut, then ground falling into
      // the plate — one gradient, because a sunset is one gradient.
      `linear-gradient(to bottom,
         color-mix(in oklab, ${sky} 62%, var(--foreground)) 0%,
         ${sun} ${horizon}%,
         color-mix(in oklab, ${ground} 62%, var(--background)) ${horizon + 2}%,
         var(--background) 100%)`,
    ].join(", "),
  };
}

/** The field the poster hangs in. */
const FIELD = [
  "radial-gradient(78% 55% at 50% 14%, color-mix(in oklab, var(--accent) 72%, var(--background)), transparent 74%)",
  "radial-gradient(66% 54% at 50% 106%, color-mix(in oklab, var(--primary) 58%, var(--background)), transparent 72%)",
  "linear-gradient(to bottom, var(--background), var(--background))",
].join(", ");

export function ChannelHeroPosterWall(vm: ChannelHeroVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border p-8 @md:p-12">
        <p className="text-sm text-muted-foreground">No key art to print yet.</p>
      </section>
    );
  }

  if (vm.state === "loading") {
    return (
      <section aria-busy="true" className="@container overflow-hidden rounded-xl border border-border bg-card">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-1 p-6 @2xl:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="aspect-square bg-muted" />
          ))}
        </div>
        <span className="sr-only">Printing…</span>
      </section>
    );
  }

  // Panels, then the logo, then the billing block — the logo is late on
  // purpose, so the art exists before it is signed.
  const cells = vm.links.length + 3;
  const at = (index: number) => (vm.reducedMotion ? 1 : staggerAt(vm.progress, index, cells));

  // The camera move. Eased here rather than in the VM: this is presentation.
  const camera = vm.reducedMotion ? 1 : clampProgress(vm.progress);
  const settled = 1 - Math.pow(1 - camera, 3);

  const wordmark = at(vm.links.length + 1);
  const billing = at(vm.links.length + 2);

  // Five panels is the smallest mosaic that can close around a 2x2 hole on a
  // three-column grid without leaving one — and at exactly five it is a square.
  const surrounded = vm.links.length >= 5;

  const credits = [vm.status?.title, vm.status?.audience, vm.status?.elapsed].filter(Boolean);

  return (
    <section
      data-state={vm.state}
      data-poster-wall
      className="@container overflow-hidden rounded-xl border border-border"
      style={{ backgroundImage: FIELD }}
    >
      <div
        data-poster-camera
        className="mx-auto w-full max-w-3xl origin-center px-3 py-6 @lg:px-4 @lg:py-8 @2xl:px-6 @2xl:py-12"
        style={{
          transform: `scale(${(1 + (1 - settled) * 0.14).toFixed(4)})`,
          opacity: Number((0.15 + 0.85 * settled).toFixed(3)),
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

        {/* The art. Hard, thin gutters — the panels are butted, not spaced. */}
        <div className="grid grid-flow-row-dense grid-cols-2 gap-1 bg-border p-1 @2xl:grid-cols-3">
          {/*
            The logo hole. No plate, no border, no blur behind it: on a poster
            the logo IS the art at that spot. Revealed by a bottom-up wipe out
            of blur, so it is stamped rather than faded in.
          */}
          <div
            data-poster-wordmark
            style={{
              clipPath: `inset(${((1 - wordmark) * 100).toFixed(1)}% 0% 0% 0%)`,
              filter: `blur(${((1 - wordmark) * 6).toFixed(2)}px)`,
            }}
            className={cn(
              "relative col-span-2 flex flex-col items-center justify-center gap-3 px-3 py-6 text-center",
              surrounded
                ? "row-span-2 row-start-2 @2xl:col-start-2 @2xl:row-start-2"
                : "@2xl:col-span-3 @2xl:py-12",
            )}
          >
            <span aria-hidden className="absolute inset-0" style={scene(vm.links.length)} />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/30 to-background/45"
            />

            {vm.headlineLead ? (
              <p className="relative text-[0.55rem] font-black uppercase leading-none tracking-[0.4em] text-foreground @lg:tracking-[0.5em] @2xl:text-xs">
                {vm.headlineLead}
              </p>
            ) : null}

            {/*
              Two passes of the same word: a heavy keyline underneath, the
              gradient face on top. That outline is the whole reason game
              wordmarks survive being printed over illustration, and it cannot
              be faked with a shadow — it has to sit around every letterform.

              It is also the CONTRAST GUARD, and that is why this is the one
              leaf in the forest allowed to clip a gradient into text. Painting
              display type in the creator's raw accent is normally the trap
              `editor-mode.ts` pins a test to (#9CCB1A at 1.91:1), because
              nothing derives a legible ground for it the way
              `--primary-foreground` is derived for a fill. Here something
              does: a `0.16em` stroke of `--background` is drawn around every
              letterform, so the wordmark's ground is a known token at a known
              width rather than whatever illustration happens to be behind it.
              Take the keyline away and the gradient stops being earned — which
              is exactly the shape `bans clipped-gradient text without a
              keyline` checks for in the conformance suite.
            */}
            {/*
              The ladder stops at `@2xl:` on purpose. The camera above is
              `max-w-3xl`, so past ~768px the wordmark's own box stops growing
              — a wider step would be keyed to a width this text never sees.
            */}
            <span className="relative z-10 block max-w-[7ch] break-words text-4xl font-black uppercase leading-[0.76] tracking-tighter @sm:text-5xl @2xl:text-6xl">
              <span
                aria-hidden
                className="absolute inset-0 text-transparent"
                style={{ WebkitTextStroke: "0.16em var(--background)" }}
              >
                {vm.headlineHighlight}
              </span>
              <span className="relative bg-gradient-to-b from-primary via-accent to-primary bg-clip-text text-transparent">
                {vm.headlineHighlight}
              </span>
            </span>

            {vm.headlineBadge ? (
              <p className="relative flex items-center justify-center gap-2 text-[0.55rem] font-bold uppercase tracking-[0.34em] text-foreground">
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
                  "group relative flex aspect-square flex-col justify-end overflow-hidden p-3",
                  "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring",
                  link.recommended && "outline outline-2 -outline-offset-4 outline-ring",
                )}
              >
                <span aria-hidden className="absolute inset-0" style={scene(index)} />
                {/* Title-card scrim. A panel is art; the caption has to stay readable over it. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background via-background/70 to-transparent"
                />
                {link.recommended ? (
                  <span className="absolute left-2 top-2 bg-primary px-1.5 py-0.5 text-[0.5rem] font-black uppercase tracking-[0.22em] text-primary-foreground">
                    Start here
                  </span>
                ) : null}
                <span className="relative text-[0.7rem] font-black uppercase leading-tight tracking-[0.14em] text-foreground">
                  {link.label}
                </span>
                <span className="relative mt-0.5 text-[0.62rem] leading-snug text-muted-foreground">
                  {link.detail}
                </span>
              </a>
            );
          })}
        </div>

        {/* Everything a poster prints small, under the art. */}
        <div style={{ opacity: Number(billing.toFixed(3)) }} className="space-y-3 pt-4 text-center">
          {vm.linksEyebrow || credits.length > 0 ? (
            <p className="text-[0.55rem] font-black uppercase tracking-[0.32em] text-muted-foreground">
              {vm.linksEyebrow}
              {vm.linksEyebrow && credits.length > 0 ? <span className="mx-2">·</span> : null}
              {credits.map((credit, index) => (
                <span key={credit}>
                  {index > 0 ? <span className="mx-2">·</span> : null}
                  {credit}
                </span>
              ))}
            </p>
          ) : null}

          {vm.subheadline ? (
            <p className="mx-auto max-w-xl text-pretty text-xs leading-relaxed text-muted-foreground">
              {vm.subheadline}
            </p>
          ) : null}

          {vm.actions.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
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
                    "inline-flex min-h-11 items-center px-4 text-[0.58rem] font-black uppercase tracking-[0.28em] transition-colors",
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
      </div>
    </section>
  );
}

export default ChannelHeroPosterWall;
