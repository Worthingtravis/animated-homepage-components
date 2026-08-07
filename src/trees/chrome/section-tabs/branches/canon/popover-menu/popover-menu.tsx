"use client";

/**
 * Popover Menu — a leaf on Section Tabs / Canon.
 *
 * PURE PRESENTATION. Its props ARE SectionTabsVM.
 *
 * Structural answer: the tabs are not on the page at all. One trigger names the
 * section you are in, and the rest live in a disclosure. This is the only leaf
 * on the tree whose footprint does not grow with the number of tabs — twenty
 * sections cost exactly as much header as two — which makes it the honest
 * answer for a page that has genuinely outgrown a track.
 *
 * ── Why the open state comes from the VM ───────────────────────────────────
 * `vm.overlay` carries `state`, the requested `side`/`align`, and
 * `onOpenChange`. The leaf owns none of it. That is what lets the lab render
 * this leaf with the menu *open* as a static fixture — "Narrow · overlay open"
 * — and it is why the open state survives a leaf swap: a page that hands you a
 * popover-menu with the menu open hands the next leaf the same fact.
 *
 * Placement is requested here and *resolved* by the primitive against the real
 * viewport. A leaf must not measure; a popover must not run off screen. Both
 * are true because the two jobs are on opposite sides of the boundary.
 *
 * ── Not a tablist ──────────────────────────────────────────────────────────
 * There is no visible row of tabs, so `role="tablist"` would be a lie told to
 * a screen reader — arrow keys would be advertised for a widget that is a
 * button and a menu. The trigger is a button, the options are buttons, and each
 * panel is a labelled region. This is the leaf the VM's `triggerId` / `panelId`
 * exist for, since no primitive is generating them here.
 *
 * Theming: the trigger is a primary-tinted pill; the active option carries a
 * primary wash. Both inherit from the creator-page wrapper.
 */

import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { SectionTabsVM } from "../../../section-tabs.vm";

export const meta: LeafMeta = {
  label: "Popover Menu",
  description:
    "One trigger names the current section; every other tab lives in a collision-aware popover. Footprint does not grow with the tab count.",
  sizeHint: "sm",
  tags: ["tabs", "popover", "disclosure", "shadcn", "compact"],
};

export function SectionTabsPopoverMenu(vm: SectionTabsVM) {
  if (vm.state === "empty" || !vm.overlay) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/40 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel}</p>
      </div>
    );
  }

  const overlay = vm.overlay;

  return (
    <div data-state={vm.state} data-layout={vm.layout} className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {vm.heading ? (
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {vm.heading}
          </h2>
        ) : null}

        <Popover open={overlay.state === "open"} onOpenChange={overlay.onOpenChange}>
          <PopoverTrigger
            aria-label={overlay.triggerAriaLabel}
            data-overlay-state={overlay.state}
            className="flex min-w-0 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="truncate">{overlay.triggerLabel}</span>
            <span aria-hidden className="text-xs opacity-70">
              ▾
            </span>
          </PopoverTrigger>

          <PopoverPortal>
            <PopoverContent
              side={overlay.side}
              align={overlay.align}
              sideOffset={10}
              collisionPadding={16}
              className={cn(
                "z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card p-2 shadow-xl ring-1 ring-primary/10",
                // The list is capped rather than allowed to grow past the fold:
                // a twenty-tab menu that runs off the bottom of the viewport is
                // the failure this leaf exists to avoid.
                "max-h-[min(24rem,70vh)] overflow-y-auto",
              )}
            >
              <ul className="flex flex-col gap-0.5">
                {vm.tabs.map((tab) => {
                  const active = tab.state === "active";
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        id={tab.triggerId}
                        aria-current={active ? "true" : undefined}
                        aria-controls={tab.panelId}
                        disabled={tab.state === "disabled"}
                        data-tab-state={tab.state}
                        onClick={() => {
                          tab.onSelect();
                          // Choosing is the whole purpose of the menu, so it
                          // closes itself rather than waiting to be dismissed.
                          overlay.onOpenChange(false);
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent/10",
                          tab.state === "disabled" && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                            active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {tab.initial}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{tab.label}</span>
                            {tab.badge ? (
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none",
                                  active
                                    ? "bg-primary/25 text-primary"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {tab.badge}
                              </span>
                            ) : null}
                          </span>
                          {/*
                            The menu has room the trigger never had, so the
                            preview is shown inline here instead of needing a
                            second layer of popover on top of a popover.
                          */}
                          {tab.preview ? (
                            <span className="text-xs text-muted-foreground">
                              {tab.preview.summary}
                            </span>
                          ) : tab.hint ? (
                            <span className="truncate text-xs text-muted-foreground">
                              {tab.hint}
                            </span>
                          ) : null}
                          {tab.preview?.meta ? (
                            <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-wide text-primary">
                              {tab.preview.meta}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      </div>

      <div className="grid">
        {vm.panels.map((panel) => {
          if (panel.phase === "hidden") return null;
          const owner = vm.tabs.find((tab) => tab.id === panel.tabId);
          const body = panel.content ?? (
            <div className="rounded-xl border border-dashed border-primary/40 px-6 py-12 text-center text-sm text-muted-foreground">
              {panel.emptyLabel}
            </div>
          );

          if (panel.phase === "leaving") {
            return (
              <div
                key={panel.id}
                aria-hidden
                data-phase={panel.phase}
                data-transition={panel.motion.transition}
                className="pointer-events-none col-start-1 row-start-1 min-w-0"
                style={panel.motion.style}
              >
                {body}
              </div>
            );
          }

          return (
            <section
              key={panel.id}
              id={panel.id}
              // The options that could label this region only exist while the
              // menu is open, so the region names itself instead of pointing at
              // an id that is absent most of the time.
              aria-label={owner?.label}
              data-phase={panel.phase}
              data-transition={panel.motion.transition}
              className="col-start-1 row-start-1 min-w-0"
              style={panel.motion.style}
            >
              {body}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default SectionTabsPopoverMenu;
