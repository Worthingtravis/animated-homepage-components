/**
 * Glass Track — a leaf on Page Nav / Canon.
 *
 * PURE PRESENTATION. Its props ARE PageNavVM.
 *
 * Structural answer: the creator page nav as it ships today — `CreatorTabStyle:
 * "default"`. A soft rounded track with a blurred fill, items as rounded
 * rectangles, and the active item filled in the page's accent with an inset
 * ring. Its sibling `pill-track` is the same structure at capsule radius; the
 * page builder's Tabs dropdown picks between them, which is why they are two
 * leaves and not one leaf with a prop.
 *
 * Theming: nothing. The creator's accent arrives as ambient `--primary` /
 * `--accent` / `--ring` from the surrounding creator-page wrapper, so this leaf
 * styles itself in those tokens and inherits — which is exactly what upstream's
 * `CreatorTabBar` does. The active-item classes below are its `default` variant
 * verbatim (`bg-primary/20 text-primary … ring-primary/30`). Outside a themed
 * wrapper the same classes resolve to the forest's own tokens, which is how one
 * leaf serves both a creator nav and an unthemed marketing bar.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { PageNavVM } from "../../../page-nav.vm";

export const meta: LeafMeta = {
  label: "Glass Track",
  description:
    "The creator nav's `default` style — soft rounded glass track, active item filled in the page accent.",
  sizeHint: "md",
  tags: ["creator", "segmented", "themed", "port"],
};

export function PageNavGlassTrack(vm: PageNavVM) {
  if (vm.state === "empty") {
    return (
      <div className="@container rounded-xl border border-dashed border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">Nowhere to navigate yet.</p>
      </div>
    );
  }

  // Condensation tightens the track rather than moving it — this branch stays
  // attached, so nothing below can shift as the page scrolls.
  const tighten = vm.reducedMotion ? 0 : vm.progress;

  return (
    <nav
      aria-label={vm.ariaLabel}
      data-state={vm.state}
      className="@container flex items-center justify-center gap-3"
    >
      {vm.brand ? (
        <a
          href={vm.brand.href}
          className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {vm.brand.image ? (
            <Image
              unoptimized
              src={vm.brand.image.src}
              alt={vm.brand.image.alt}
              width={vm.brand.image.width}
              height={vm.brand.image.height}
              className="size-6"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-6 items-center justify-center rounded-md border border-current text-xs font-bold text-primary"
            >
              {vm.brand.initial}
            </span>
          )}
          <span className="hidden @lg:inline">{vm.brand.label}</span>
        </a>
      ) : null}

      <div className="relative min-w-0">
        {vm.overflow?.canScrollBack ? (
          <button
            type="button"
            onClick={vm.overflow.onScrollBack}
            aria-label={vm.overflow.backLabel}
            className="absolute left-0 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden>‹</span>
          </button>
        ) : null}

        <div
          data-nav-track
          // Upstream's `TRACK.default`, verbatim.
          className="flex min-w-0 gap-1.5 overflow-x-auto rounded-xl border border-border/40 bg-card/30 p-1.5 backdrop-blur-sm"
          style={{
            // The only thing condensation moves: the track draws in slightly.
            paddingBlock: `${(6 - tighten * 2).toFixed(2)}px`,
          }}
        >
          {vm.items.map((item) => {
            const active = item.state === "active";
            const content = (
              <>
                {item.label}
                {item.badge ? (
                  <span className="ml-1.5 rounded-full border border-current px-1.5 text-[0.625rem] font-semibold opacity-80">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            // `TRIGGER_BASE.default` + `TRIGGER_ACTIVE.default` /
            // `TRIGGER_IDLE.default` from upstream's CreatorTabBar.
            const className = cn(
              "flex shrink-0 items-center whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? cn(
                    "bg-primary/20 text-primary ring-1 ring-inset ring-primary/30",
                    !vm.reducedMotion && "shadow-sm",
                  )
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            );

            if (item.href) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-item-state={item.state}
                  className={className}
                >
                  {content}
                </a>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onSelect ?? undefined}
                disabled={!item.onSelect}
                aria-current={active ? "page" : undefined}
                data-item-state={item.state}
                className={className}
              >
                {content}
              </button>
            );
          })}
        </div>

        {vm.overflow?.canScrollForward ? (
          <button
            type="button"
            onClick={vm.overflow.onScrollForward}
            aria-label={vm.overflow.forwardLabel}
            className="absolute right-0 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden>›</span>
          </button>
        ) : null}
      </div>

      {vm.actions.length > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          {vm.actions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              title={action.tooltip}
              onClick={action.onActivate}
              rel={action.external ? "noreferrer" : undefined}
              target={action.external ? "_blank" : undefined}
              data-emphasis={action.emphasis}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                action.emphasis === "primary"
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {action.label}
            </a>
          ))}
        </div>
      ) : null}

      {vm.menu ? (
        <button
          type="button"
          onClick={vm.menu.onToggle}
          aria-expanded={vm.menu.state === "open"}
          data-menu-state={vm.menu.state}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring @lg:hidden"
        >
          {vm.menu.label}
        </button>
      ) : null}
    </nav>
  );
}

export default PageNavGlassTrack;
