"use client";

/**
 * Hover Dock — a leaf on Section Tabs / Experimental.
 *
 * PURE PRESENTATION. Its props ARE SectionTabsVM.
 *
 * Structural answer: the chrome gets out of the way. Tabs collapse to a column
 * of markers pinned beside the panel; the label is not drawn until you are
 * pointing at it. The panel therefore keeps the full measure of the page, which
 * is the trade this leaf is making — maximum content, minimum standing chrome.
 *
 * ── Why this is experimental and not canon ─────────────────────────────────
 * Hover is not a promise you can make to every visitor. A touch screen has no
 * hover, a keyboard has no pointer, and a marker whose meaning only appears on
 * hover is unusable for both. So the labels are not hover-only:
 *
 *   · the ACTIVE marker always shows its label, so the dock is never mute
 *   · every marker carries its `initial` and an `aria-label` with the full text
 *   · focus opens the same card hover does, so a keyboard sees what a mouse sees
 *   · `layout === "narrow"` — which is where touch actually lives — drops the
 *     dock entirely and renders a labelled strip instead
 *
 * That list is the cost of the idea. It is worth paying once, here, where it is
 * visible; it is not worth paying invisibly in every leaf, which is why this
 * sits on `experimental` rather than beside `top-track`.
 *
 * Theming: markers are drawn in `accent`, the active one in `primary`, so the
 * dock reads as the creator's colour even when it is showing almost nothing.
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
  label: "Hover Dock",
  description:
    "Tabs collapse to a column of markers that name themselves on hover or focus. Maximum panel, minimum standing chrome — and a labelled strip when narrow.",
  sizeHint: "lg",
  tags: ["tabs", "hover", "minimal", "shadcn", "experimental"],
};

export function SectionTabsHoverDock(vm: SectionTabsVM) {
  if (vm.state === "empty") {
    return (
      <div className="rounded-2xl border border-dashed border-primary/40 px-6 py-10 text-center">
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
      orientation={narrow ? "horizontal" : "vertical"}
      data-state={vm.state}
      data-layout={vm.layout}
      className={cn(
        "grid w-full gap-5",
        narrow ? "grid-cols-1" : "grid-cols-[auto_1fr] items-start gap-x-6",
      )}
    >
      <TabsList
        aria-label={vm.ariaLabel}
        data-tabs-track={vm.scopeId}
        className={cn(
          "min-w-0 gap-1.5",
          narrow
            ? "flex items-center overflow-x-auto rounded-full border border-border/60 bg-card/60 p-1 [scrollbar-width:none]"
            : "sticky top-6 flex flex-col items-start rounded-full border border-border/50 bg-card/40 p-1.5 backdrop-blur-md",
        )}
      >
        {vm.tabs.map((tab) => {
          const active = tab.state === "active";
          const className = cn(
            "group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full transition-all duration-200",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            narrow ? "px-3.5 py-2 text-sm font-medium" : "py-1.5 pl-1.5 pr-3",
            active
              ? "bg-primary/15 text-primary ring-1 ring-primary/25"
              : "text-muted-foreground hover:bg-accent/10 hover:text-accent",
            tab.state === "disabled" && "cursor-not-allowed opacity-40",
          );

          const body = narrow ? (
            <>
              <span>{tab.label}</span>
              {tab.badge ? (
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
          ) : (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  active
                    ? "bg-primary/25 text-primary"
                    : "bg-muted text-muted-foreground group-hover:bg-accent/20 group-hover:text-accent",
                )}
              >
                {tab.initial}
              </span>
              {/*
                The label is drawn for the active marker always, and for the
                others only while pointed at or focused. `max-w-0` rather than
                `hidden` so the dock widens smoothly instead of snapping — and
                so the text stays in the accessibility tree either way.
              */}
              <span
                className={cn(
                  "overflow-hidden text-sm font-medium transition-all duration-200",
                  active
                    ? "max-w-[12rem]"
                    : "max-w-0 opacity-0 group-hover:max-w-[12rem] group-hover:opacity-100 group-focus-visible:max-w-[12rem] group-focus-visible:opacity-100",
                )}
              >
                {tab.label}
              </span>
              {tab.badge && active ? (
                <span className="rounded-full bg-primary/25 px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-primary">
                  {tab.badge}
                </span>
              ) : null}
            </>
          );

          const trigger = (
            <TabsTrigger
              value={tab.id}
              // The marker is a circle with one character in it, so the full
              // label has to reach assistive tech some other way.
              aria-label={tab.label}
              disabled={tab.state === "disabled"}
              data-tab-state={tab.state}
              className={className}
            >
              {body}
            </TabsTrigger>
          );

          if (!tab.preview) {
            return <span key={tab.id} className="contents">{trigger}</span>;
          }

          return (
            <HoverCard key={tab.id} openDelay={180} closeDelay={120}>
              <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent
                  side={narrow ? "bottom" : "right"}
                  align="start"
                  sideOffset={12}
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

      <div className="grid min-w-0">
        {vm.heading ? (
          <h2 className="col-start-1 row-start-1 sr-only">{vm.heading}</h2>
        ) : null}
        {vm.panels.map((panel) => {
          if (panel.phase === "hidden") return null;
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

export default SectionTabsHoverDock;
