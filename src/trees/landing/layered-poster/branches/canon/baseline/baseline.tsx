/**
 * Baseline — a leaf on Layered Poster / Canon.
 *
 * PURE PRESENTATION. Its props ARE LayeredPosterVM.
 *
 * Structural answer: the plates, straight. A square sheet centred in its box,
 * every plate full-bleed on top of the last, and one camera settling the whole
 * stack. Nothing is cropped, nothing is arranged — the composition lives in the
 * artwork, and this leaf's whole job is to put the plates in the right places at
 * the right moments and otherwise stay out of the way.
 *
 * ── What the original did with a clock, this does with a position ──────────
 * Aceternity's `gta-vi-poster` runs a `motion/react` timeline: each plate has a
 * delay in seconds, the camera has a duration, and a `timeScale` keeps them in
 * step. None of that survives contact with a leaf — a leaf has no clock and
 * cannot have one. Every value here is instead sampled from `vm.progress`
 * through the tree's own helpers, which is why the lab can scrub the entrance
 * backwards and why `vm.reducedMotion` can collapse it to a single frame
 * without a special case.
 *
 * ── The square is CSS, not a measurement ───────────────────────────────────
 * The original ran a `ResizeObserver` over its stage to compute
 * `min(width, height) * fit` in pixels. A leaf may not observe anything, so the
 * sheet is `aspect-square` with `fit` applied as a percentage width and a
 * matching `max-height`. That is strictly better than the observer was: it
 * survives being dropped into a column it was never measured for, which is the
 * whole promise of this forest.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import { cameraAt, plateScaleAt, revealOf } from "../../../layered-poster.vm";
import type { LayeredPosterLayer, LayeredPosterVM } from "../../../layered-poster.vm";

export const meta: LeafMeta = {
  label: "Baseline",
  description:
    "The plates straight: a square sheet, every layer full-bleed, one camera settling the whole stack into frame.",
  sizeHint: "lg",
  tags: ["poster", "parallax", "depth", "key-art"],
};

/** The field the sheet hangs in — the creator's inks, not the original's hex. */
const BACKDROP = [
  "radial-gradient(64% 46% at 50% 24%, color-mix(in oklab, var(--accent) 62%, var(--background)), transparent 72%)",
  "radial-gradient(78% 58% at 50% 108%, color-mix(in oklab, var(--primary) 48%, var(--background)), transparent 76%)",
  "linear-gradient(to bottom, var(--background), var(--background))",
].join(", ");

/**
 * One plate, at this instant. Depth decides where it starts, `revealAt` decides
 * when it begins, and the focus plate is the only one that resolves out of blur.
 */
function plateStyle(vm: LayeredPosterVM, layer: LayeredPosterLayer, index: number) {
  if (vm.reducedMotion) return { zIndex: index };

  const arrived = revealOf(vm.progress, layer);
  const scale = plateScaleAt(vm.progress, layer.depth);

  return {
    zIndex: index,
    opacity: Number(arrived.toFixed(3)),
    transform: `scale(${scale.toFixed(4)})`,
    // A wipe reveals from the bottom edge up; a fade has no clip at all.
    clipPath:
      layer.reveal === "wipe-up" ? `inset(${((1 - arrived) * 100).toFixed(1)}% 0% 0% 0%)` : undefined,
    // Focus is pulled on exactly one plate — the logo comes out of blur last,
    // after the art it is signing already exists.
    filter: layer.focusPull ? `blur(${((1 - arrived) * 12).toFixed(2)}px)` : undefined,
  };
}

export function LayeredPosterBaseline(vm: LayeredPosterVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border p-8">
        <p className="text-sm text-muted-foreground">No plates to print.</p>
      </section>
    );
  }

  if (vm.state === "loading") {
    return (
      <section
        aria-busy="true"
        className="@container flex items-center justify-center rounded-xl border border-border bg-card p-6"
      >
        <div className="aspect-square w-full max-w-md rounded-sm bg-muted" />
        <span className="sr-only">Printing…</span>
      </section>
    );
  }

  // The camera. One curve for the whole sheet, so the plates cannot disagree
  // with the frame they are landing in.
  const camera = vm.reducedMotion ? 1 : cameraAt(vm.progress);
  const overscan = 1 + (vm.cameraScale - 1) * (1 - camera);
  const fit = Math.round(Math.min(1, Math.max(0, vm.fit)) * 100);

  return (
    <section
      data-state={vm.state}
      data-layered-poster
      className="@container flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-border p-4 @lg:p-6 @2xl:p-8"
      style={{ backgroundImage: BACKDROP }}
    >
      {/*
        The sheet. `aspect-square` plus a percentage width is the whole of what
        the original's ResizeObserver was computing, and it costs no JavaScript.
      */}
      <div
        data-poster-sheet
        role="img"
        aria-label={vm.title}
        className="relative isolate aspect-square origin-center overflow-hidden ring-1 ring-border"
        style={{
          width: `${fit}%`,
          transform: `scale(${overscan.toFixed(4)})`,
          opacity: Number((vm.reducedMotion ? 1 : 0.25 + 0.75 * camera).toFixed(3)),
        }}
      >
        {vm.layers.map((layer, index) => (
          <Image
            key={layer.id}
            unoptimized
            aria-hidden
            src={layer.image.src}
            alt=""
            width={layer.image.width}
            height={layer.image.height}
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full origin-center select-none object-cover"
            style={plateStyle(vm, layer, index)}
          />
        ))}
      </div>

      {vm.caption ? (
        <p
          className="max-w-prose text-pretty text-center text-[0.65rem] font-black uppercase tracking-[0.28em] text-muted-foreground @lg:text-xs"
          style={{
            opacity: Number((vm.reducedMotion ? 1 : camera).toFixed(3)),
          }}
        >
          {vm.caption}
        </p>
      ) : null}

      {vm.replay ? (
        <button
          type="button"
          onClick={vm.replay.onActivate}
          className={cn(
            "relative rounded-full border border-border px-4 py-1.5 text-[0.6rem] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors",
            /*
             * A 0.6rem micro-pill draws at roughly 23px tall — under the 24px
             * target floor, and the only control in the forest that was. It is
             * drawn that small on purpose: it is a footnote under a poster, and
             * a 44px pill would read as the poster's call to action instead of
             * its replay. So the DRAWN size stays and the TOUCHED size grows —
             * a transparent pseudo-element carries the hit area out to ~44px.
             * This works here because the control is alone on its row; between
             * adjacent chips the expanded areas would overlap and the last one
             * painted would quietly eat its neighbour's taps.
             */
            "after:absolute after:left-1/2 after:top-1/2 after:h-11 after:min-w-[2.75rem] after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
            "after:w-full",
            "hover:border-ring hover:text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          {vm.replay.label}
        </button>
      ) : null}
    </section>
  );
}

export default LayeredPosterBaseline;
