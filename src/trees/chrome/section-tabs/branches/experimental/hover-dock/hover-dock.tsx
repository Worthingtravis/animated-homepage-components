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
 *     — and its badge, so a count is never hidden behind a pointer
 *   · a marker with a badge wears a dot while collapsed, so nothing the badge
 *     was announcing disappears just because the dock is small
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
      <div className="@container rounded-2xl border border-dashed border-primary/40 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel}</p>
      </div>
    );
  }

  const activeTab = vm.tabs.find((tab) => tab.state === "active") ?? vm.tabs[0];
  const narrow = vm.layout === "narrow";
  /*
   * The dock's whole idea is a reveal, so reduced motion cannot remove it — it
   * removes the travel. Labels and badges still appear, they just cut in.
   */
  const reveal = vm.reducedMotion ? "transition-none" : "transition-all duration-200";

  return (
    <Tabs
      value={activeTab?.id}
      onValueChange={(next) => vm.tabs.find((tab) => tab.id === next)?.onSelect()}
      orientation={narrow ? "horizontal" : "vertical"}
      data-state={vm.state}
      data-layout={vm.layout}
      className={cn(
        "@container",
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
            /*
               `items-stretch`, not `items-start`: the list is as wide as its
               widest child (the active marker, which carries a label), so
               left-aligned children left a dead column beside every collapsed
               marker and an inconsistent hit target. Stretched, every marker is
               one full-width row that happens to start with a circle. And a
               tall column wants a rail radius — `rounded-full` on it produced a
               capsule whose curve fought the rows inside it.
            */
            : "sticky top-6 flex flex-col items-stretch rounded-2xl border border-border/50 bg-card/40 p-1.5 backdrop-blur-md",
        )}
      >
        {vm.tabs.map((tab) => {
          const active = tab.state === "active";
          const className = cn(
            "group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full",
            reveal,
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            narrow
              ? "px-3.5 py-2 text-sm font-medium"
              : "w-full justify-start py-1.5 pl-1.5 pr-3",
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
              {/*
                `initial` may be two characters when a sibling label collides
                with this one ("Shop" / "Support"), so the marker is sized for
                two — the type scale gives, not the circle.
              */}
              <span
                aria-hidden
                className={cn(
                  "relative flex size-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold leading-none tracking-tight transition-colors",
                  active
                    ? "bg-primary/25 text-primary"
                    : "bg-muted text-muted-foreground group-hover:bg-accent/20 group-hover:text-accent",
                )}
              >
                {tab.initial}
                {/*
                  Collapsed, the marker is the only thing on screen — so a tab
                  carrying a badge says so with a dot rather than dropping the
                  fact entirely until it is selected, which is the one moment a
                  badge no longer needs to summon anyone. The count itself is on
                  the trigger's accessible name; this is decoration.
                */}
                {tab.badge && !active ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-card" />
                ) : null}
              </span>
              {/*
                The label is drawn for the active marker always, and for the
                others only while pointed at or focused. `max-w-0` rather than
                `hidden` so the dock widens smoothly instead of snapping — and
                so the text stays in the accessibility tree either way.
              */}
              <span
                className={cn(
                  "overflow-hidden text-sm font-medium",
                  reveal,
                  active
                    ? "max-w-[12rem]"
                    : "max-w-0 opacity-0 group-hover:max-w-[12rem] group-hover:opacity-100 group-focus-visible:max-w-[12rem] group-focus-visible:opacity-100",
                )}
              >
                {tab.label}
              </span>
              {/*
                The badge travels with the label: full text for the active
                marker always, and revealed on the same hover/focus for the
                rest. Collapsed it is not gone — it is the dot on the circle.
              */}
              {tab.badge ? (
                active ? (
                  <span className="rounded-full bg-primary/25 px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-primary">
                    {tab.badge}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex overflow-hidden",
                      reveal,
                      "max-w-0 opacity-0 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100",
                    )}
                  >
                    <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-accent">
                      {tab.badge}
                    </span>
                  </span>
                )
              ) : null}
            </>
          );

          const trigger = (
            <TabsTrigger
              value={tab.id}
              // The marker is a circle with one or two characters in it, so the
              // full label has to reach assistive tech some other way — and so
              // does the badge, which is drawn as a bare dot while collapsed.
              aria-label={tab.badge ? `${tab.label} (${tab.badge})` : tab.label}
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
