/**
 * Floating Capsule — a leaf on Page Nav / Experimental.
 *
 * PURE PRESENTATION. Its props ARE PageNavVM.
 *
 * Structural answer: the bar detaches. At the top of the page it is a wide,
 * flat, edge-to-edge strip; as the page scrolls it draws in, gains a radius and
 * a shadow, and ends up a capsule floating over the content. Transport does the
 * whole thing — nothing appears, nothing disappears, only the box changes.
 *
 * That is the trade this branch exists to make: it is the most expressive of
 * the four and the only one whose box moves, so it will collide with anything
 * the page puts near its top edge. Reach for a Canon leaf when the page has
 * content up there.
 *
 * Theming: none of its own. The capsule styles itself in `primary` / `accent`
 * and inherits whatever the surrounding creator-page wrapper set.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { PageNavVM } from "../../../page-nav.vm";

export const meta: LeafMeta = {
  label: "Floating Capsule",
  description:
    "Detaches on scroll — a flat strip that draws in, rounds off and floats as a capsule over the page.",
  sizeHint: "lg",
  tags: ["detached", "expressive", "themed"],
};

export function PageNavFloatingCapsule(vm: PageNavVM) {
  if (vm.state === "empty") {
    return (
      <div className="mx-auto max-w-md rounded-full border border-dashed border-border px-6 py-3 text-center">
        <p className="text-xs text-muted-foreground">Nowhere to navigate yet.</p>
      </div>
    );
  }

  // One transport value drives every dimension, so the shape can never be
  // half-detached in one axis and attached in another.
  const t = vm.reducedMotion ? 1 : vm.progress;

  return (
    <div
      style={{ paddingInline: `${(t * 24).toFixed(2)}px`, paddingBlock: `${(t * 10).toFixed(2)}px` }}
      className="w-full"
    >
      <nav
        aria-label={vm.ariaLabel}
        data-state={vm.state}
        style={{
          borderRadius: `${(t * 999).toFixed(0)}px`,
          boxShadow: t > 0 ? `0 ${(t * 10).toFixed(1)}px ${(t * 30).toFixed(1)}px rgb(0 0 0 / ${(t * 0.22).toFixed(3)})` : undefined,
        }}
        className="flex items-center gap-4 border border-border/50 bg-card/50 px-4 py-2.5 backdrop-blur-md"
      >
        {vm.brand ? (
          <a
            href={vm.brand.href}
            className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
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
                className="flex size-6 items-center justify-center rounded-full border border-current text-xs font-black text-primary"
              >
                {vm.brand.initial}
              </span>
            )}
            {/* The wordmark is the one thing the capsule gives up for width. */}
            <span style={{ opacity: 1 - t * 0.65 }} className="hidden sm:inline">
              {vm.brand.label}
            </span>
          </a>
        ) : null}

        <ul
          data-nav-track
          className={cn(
            "flex min-w-0 items-center gap-1 overflow-x-auto",
            vm.brand ? "ml-auto" : "",
            vm.menu ? "hidden sm:flex" : "flex",
          )}
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
            const className = cn(
              "flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
            );

            return (
              <li key={item.id} className="shrink-0">
                {item.href ? (
                  <a
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    data-item-state={item.state}
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={item.onSelect ?? undefined}
                    disabled={!item.onSelect}
                    aria-current={active ? "page" : undefined}
                    data-item-state={item.state}
                    className={className}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {vm.overflow?.canScrollForward ? (
          <button
            type="button"
            onClick={vm.overflow.onScrollForward}
            aria-label={vm.overflow.forwardLabel}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden>›</span>
          </button>
        ) : null}

        {vm.actions.length > 0 ? (
          <div className={cn("flex shrink-0 items-center gap-2", vm.brand ? "" : "ml-auto")}>
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
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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
            className={cn(
              "shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden",
              vm.brand || vm.actions.length > 0 ? "" : "ml-auto",
            )}
          >
            {vm.menu.label}
          </button>
        ) : null}
      </nav>
    </div>
  );
}

export default PageNavFloatingCapsule;
