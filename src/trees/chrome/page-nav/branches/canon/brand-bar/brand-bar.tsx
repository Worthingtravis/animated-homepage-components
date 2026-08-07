/**
 * Brand Bar — a leaf on Page Nav / Canon.
 *
 * PURE PRESENTATION. Its props ARE PageNavVM.
 *
 * Structural answer: a full-width rule rather than a track. Brand pins the left
 * edge, items sit as bare text toward the right, and the call to action anchors
 * the far right — the marketing-navbar shape. Nothing is enclosed, so the only
 * thing separating the bar from the page is a hairline that gains weight as the
 * page scrolls.
 *
 * This is the option the creator page builder's Tabs dropdown does NOT have
 * yet: same contract, same data, a look the segmented tracks cannot reach
 * because a track can never span the viewport.
 *
 * The active item is marked by an underline in the page accent, not a fill —
 * against a full-width bar a filled pill reads as a button, and buttons in a
 * nav are what the actions are for.
 *
 * Theming: none of its own. `bg-primary` on the underline inherits whatever
 * `--primary` the surrounding creator-page wrapper set, and falls back to the
 * forest token when there is no wrapper.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { PageNavVM } from "../../../page-nav.vm";

export const meta: LeafMeta = {
  label: "Brand Bar",
  description:
    "Full-width marketing bar — brand left, bare text links right, one loud CTA. Active item is an accent underline.",
  sizeHint: "lg",
  tags: ["marketing", "full-width", "themed"],
};

export function PageNavBrandBar(vm: PageNavVM) {
  if (vm.state === "empty") {
    return (
      <div className="border-b border-dashed border-border px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">Nowhere to navigate yet.</p>
      </div>
    );
  }

  // Condensation buys the bar its separation: the rule darkens and the bar
  // loses height. Its box stays put, so the page under it never jumps.
  const settle = vm.reducedMotion ? 1 : vm.progress;

  return (
    <nav
      aria-label={vm.ariaLabel}
      data-state={vm.state}
      style={{
        paddingBlock: `${(16 - settle * 5).toFixed(2)}px`,
        borderBottomColor:
          vm.state === "condensed" ? "var(--color-border)" : "transparent",
      }}
      className="flex w-full items-center gap-6 border-b bg-background px-4 transition-colors duration-200 sm:px-6"
    >
      {vm.brand ? (
        <a
          href={vm.brand.href}
          className="flex shrink-0 items-center gap-2.5 rounded-lg text-base font-bold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {vm.brand.image ? (
            <Image
              unoptimized
              src={vm.brand.image.src}
              alt={vm.brand.image.alt}
              width={vm.brand.image.width}
              height={vm.brand.image.height}
              className="size-7"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-lg border border-current text-sm font-black text-primary"
            >
              {vm.brand.initial}
            </span>
          )}
          <span>{vm.brand.label}</span>
        </a>
      ) : null}

      {/* The items push right; with no brand they simply start at the left edge. */}
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
          const inner = (
            <>
              <span className="flex items-center gap-1.5">
                {item.label}
                {item.badge ? (
                  <span className="rounded-full border border-border px-1.5 text-[0.625rem] font-semibold text-muted-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {/* The underline exists for every item and only has width when
                  active — so the row never reflows as the route changes. */}
              <span
                aria-hidden
                style={{ transform: `scaleX(${active ? 1 : 0})` }}
                className="mt-1 block h-0.5 w-full origin-left rounded-full bg-primary transition-transform duration-200"
              />
            </>
          );
          const className = cn(
            "flex shrink-0 flex-col whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
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
                  {inner}
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
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>

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
                "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                action.emphasis === "primary"
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "text-muted-foreground hover:text-foreground",
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
            "shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden",
            vm.brand || vm.actions.length > 0 ? "" : "ml-auto",
          )}
        >
          {vm.menu.label}
        </button>
      ) : null}
    </nav>
  );
}

export default PageNavBrandBar;
