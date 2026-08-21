"use client";

/**
 * Top Track — a leaf on Section Tabs / Canon.
 *
 * PURE PRESENTATION. Its props ARE SectionTabsVM.
 *
 * Structural answer: the familiar one. A horizontal segmented track above the
 * panel, active item on a soft primary fill, chevrons at the edges when it
 * overflows. This is what a creator page's tab bar looks like today, so it is
 * the leaf a page can adopt with nothing else changing.
 *
 * ── Responsiveness ─────────────────────────────────────────────────────────
 * The track scrolls rather than wraps. Wrapping a tab bar is the failure mode
 * that looks fine at every width you test and then puts one lonely tab on a
 * second row at the width your visitors actually use. Scrolling keeps the bar
 * exactly one row tall forever, and the container's overflow measurement gives
 * it real edge affordances instead of a hidden scrollbar nobody notices.
 *
 * On `layout === "narrow"` the padding tightens and the badge column drops —
 * the count is still reachable in the hover preview, which is the only thing on
 * the bar that was ever optional.
 *
 * ── Hover previews ─────────────────────────────────────────────────────────
 * The preview is PORTALLED. A hover card rendered inside a horizontally
 * scrolling track is clipped by that track's own `overflow-x`, which is the
 * single most common way a "working" popover ships broken. The portal is why
 * `overflow-x-auto` above and a fully readable card below can both be true, and
 * `collisionPadding` is why the card stays on screen for the last tab in the
 * row as well as the first.
 *
 * ── Who owns the aria wiring here ──────────────────────────────────────────
 * Radix generates and cross-references its own trigger/panel ids, so this leaf
 * deliberately does NOT stamp `tab.triggerId` / `panel.id` over them — doing so
 * would rewrite one half of a pair Radix wired to the other half. The VM's ids
 * exist for the leaves that render panels outside a tablist (`popover-menu`,
 * `hover-dock`), where no primitive is doing it for them. Both routes end up
 * with the same trigger→panel graph.
 *
 * Theming: none of its own. `--primary` / `--accent` / `--ring` arrive ambient
 * from the creator-page wrapper and this leaf inherits them.
 */

import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { SectionTabsVM } from "../../../section-tabs.vm";

export const meta: LeafMeta = {
  label: "Top Track",
  description:
    "A horizontal segmented track above the panel — scrolls rather than wraps, with edge chevrons and portalled hover previews.",
  sizeHint: "md",
  tags: ["tabs", "horizontal", "segmented", "shadcn", "hover-preview"],
};

export function SectionTabsTopTrack(vm: SectionTabsVM) {
  if (vm.state === "empty") {
    return (
      <div className="@container rounded-2xl border border-dashed border-primary/40 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel}</p>
      </div>
    );
  }

  const activeTab = vm.tabs.find((tab) => tab.state === "active") ?? vm.tabs[0];
  const narrow = vm.layout === "narrow";

  return (
    <Tabs
      value={activeTab?.id}
      onValueChange={(next) => vm.tabs.find((tab) => tab.id === next)?.onSelect()}
      data-state={vm.state}
      data-layout={vm.layout}
      className="@container flex w-full flex-col gap-5"
    >
      {vm.heading ? (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {vm.heading}
        </h2>
      ) : null}

      <div className="relative">
        {vm.overflow?.canScrollBack ? (
          <button
            type="button"
            onClick={vm.overflow.onScrollBack}
            aria-label={vm.overflow.backLabel}
            /*
              32px, and deliberately under the 44px touch figure. These arrows
              sit ON TOP of the track they scroll, so growing them eats the
              tabs they exist to reveal — and the same scroll is reachable by
              swipe, trackpad, and arrow key on the tablist itself. WCAG 2.5.8
              names that case: a small target is fine when an equivalent
              control on the same page does the job. They stay above the 24px
              floor, which is the number this forest actually enforces.
            */
            className="absolute left-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden>‹</span>
          </button>
        ) : null}

        <TabsList
          aria-label={vm.ariaLabel}
          data-tabs-track={vm.scopeId}
          className={cn(
            "flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-border/60 bg-card/60 p-1 backdrop-blur-md [scrollbar-width:none]",
            vm.overflow?.canScrollBack && "pl-9",
            vm.overflow?.canScrollForward && "pr-9",
          )}
        >
          {vm.tabs.map((tab) => {
            const active = tab.state === "active";
            const className = cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              narrow ? "px-3 py-1.5" : "px-4 py-2",
              active
                ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
              tab.state === "disabled" && "cursor-not-allowed opacity-40",
            );
            const label = (
              <>
                <span>{tab.label}</span>
                {tab.badge && !narrow ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none",
                      active ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </>
            );

            if (!tab.preview) {
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={tab.state === "disabled"}
                  data-tab-state={tab.state}
                  className={className}
                >
                  {label}
                </TabsTrigger>
              );
            }

            return (
              <HoverCard key={tab.id} openDelay={220} closeDelay={120}>
                <HoverCardTrigger asChild>
                  <TabsTrigger
                    value={tab.id}
                    disabled={tab.state === "disabled"}
                    data-tab-state={tab.state}
                    onFocus={tab.onPreview ?? undefined}
                    className={className}
                  >
                    {label}
                  </TabsTrigger>
                </HoverCardTrigger>
                <HoverCardPortal>
                  <HoverCardContent
                    side="bottom"
                    align="start"
                    sideOffset={10}
                    collisionPadding={16}
                    className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-4 shadow-lg ring-1 ring-primary/10"
                  >
                    <p className="text-sm font-semibold text-foreground">{tab.preview.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{tab.preview.summary}</p>
                    {tab.preview.meta ? (
                      <p className="mt-2 text-xs font-medium text-primary">{tab.preview.meta}</p>
                    ) : null}
                  </HoverCardContent>
                </HoverCardPortal>
              </HoverCard>
            );
          })}
        </TabsList>

        {vm.overflow?.canScrollForward ? (
          <button
            type="button"
            onClick={vm.overflow.onScrollForward}
            aria-label={vm.overflow.forwardLabel}
            className="absolute right-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden>›</span>
          </button>
        ) : null}
      </div>

      {/*
        Both panels of a change share one grid cell, so a crossfade overlaps
        instead of the page jumping to double height, and the cell keeps the
        taller of the two rather than collapsing at the midpoint.
      */}
      <div className="grid">
        {vm.panels.map((panel) => {
          if (panel.phase === "hidden") return null;
          const body = panel.content ?? (
            <div className="rounded-xl border border-dashed border-primary/40 px-6 py-12 text-center text-sm text-muted-foreground">
              {panel.emptyLabel}
            </div>
          );

          /*
           * A leaving panel is decorative. It is on its way out, so it must not
           * be announced as a second tab panel and must not swallow a click
           * aimed at the panel arriving underneath it.
           */
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
            <TabsContent
              key={panel.id}
              value={panel.tabId}
              forceMount
              data-phase={panel.phase}
              data-transition={panel.motion.transition}
              className="col-start-1 row-start-1 min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              style={panel.motion.style}
            >
              {body}
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}

export default SectionTabsTopTrack;
