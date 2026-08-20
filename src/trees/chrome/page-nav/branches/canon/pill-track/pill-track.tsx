/**
 * Pill Track — a leaf on Page Nav / Canon.
 *
 * PURE PRESENTATION. Its props ARE PageNavVM.
 *
 * Structural answer: the creator page nav's other shipped style —
 * `CreatorTabStyle: "pill"`. A full capsule track with capsule triggers and a
 * heavier blur; the active item is a soft accent fill with no ring, so the
 * emphasis comes from the fill alone rather than from fill plus outline.
 *
 * It is a separate leaf from `glass-track` rather than a prop on it because the
 * page builder's Tabs dropdown already treats them as two choices — and because
 * a prop that switches every colour and radius in a component is a leaf
 * wearing a disguise.
 *
 * Theming: none of its own. The creator's accent arrives as ambient `--primary`
 * from the creator-page wrapper and this leaf inherits it, matching upstream's
 * `TRACK.pill` / `TRIGGER_ACTIVE.pill` (`bg-primary/15 text-primary shadow-sm`
 * — a fill with no ring, which is the whole difference from `glass-track`).
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { PageNavVM } from "../../../page-nav.vm";

export const meta: LeafMeta = {
  label: "Pill Track",
  description:
    "The creator nav's `pill` style — full capsule track and triggers, active item on a soft accent fill.",
  sizeHint: "md",
  tags: ["creator", "segmented", "themed", "port"],
};

export function PageNavPillTrack(vm: PageNavVM) {
  if (vm.state === "empty") {
    return (
      <div className="@container rounded-full border border-dashed border-border px-6 py-3 text-center">
        <p className="text-xs text-muted-foreground">Nowhere to navigate yet.</p>
      </div>
    );
  }

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
          className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {vm.brand.image ? (
            <Image
              unoptimized
              src={vm.brand.image.src}
              alt={vm.brand.image.alt}
              width={vm.brand.image.width}
              height={vm.brand.image.height}
              className="size-6 rounded-full"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-6 items-center justify-center rounded-full border border-current text-xs font-bold text-primary"
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
          // Upstream's `TRACK.pill`, verbatim.
          className="flex min-w-0 gap-1 overflow-x-auto rounded-full border border-border/50 bg-card/50 p-1 backdrop-blur-md"
          style={{ paddingInline: `${(4 + (1 - tighten) * 2).toFixed(2)}px` }}
        >
          {vm.items.map((item) => {
            const active = item.state === "active";
            const content = (
              <>
                {item.label}
                {item.badge ? (
                  <span className="ml-1.5 rounded-full bg-accent/25 px-1.5 text-[0.625rem] font-semibold">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            // Upstream's `TRIGGER_BASE.pill` + `TRIGGER_ACTIVE.pill` /
            // `TRIGGER_IDLE.pill` — a fill with no ring.
            const className = cn(
              "flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? cn("bg-primary/15 text-primary", !vm.reducedMotion && "shadow-sm")
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
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
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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
          className="shrink-0 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring @lg:hidden"
        >
          {vm.menu.label}
        </button>
      ) : null}
    </nav>
  );
}

export default PageNavPillTrack;
