"use client";

/**
 * Side Rail — a leaf on Section Tabs / Canon.
 *
 * PURE PRESENTATION. Its props ARE SectionTabsVM.
 *
 * Structural answer: the tabs stand beside the panel instead of above it. That
 * is not a rotation of `top-track` — it changes what the chrome can afford. A
 * vertical rail has room for a second line, so `tab.hint` is shown inline and
 * the tab stops being a bare word. Ten tabs cost vertical space the page
 * already has; on a horizontal track the same ten tabs cost horizontal space
 * the page does not.
 *
 * ── Responsiveness ─────────────────────────────────────────────────────────
 * A rail is a wide-screen affordance and pretending otherwise is how side
 * navigation ends up eating half a phone. On `layout === "narrow"` this leaf
 * genuinely restructures: the rail becomes a scrolling strip above the panel,
 * the hints drop out, and — because the hint was the rail's whole advantage —
 * they come back as a hover preview instead of just disappearing.
 *
 * That is the case `SectionTabsLayout` exists for. A CSS breakpoint could move
 * the column, but it could not move the hint from inline text into a portalled
 * card, because those are different elements and only one of them may exist.
 *
 * Theming: none of its own. The active rail item is a primary wash with a
 * primary edge, both inherited from the creator-page wrapper.
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
  label: "Side Rail",
  description:
    "Tabs stand beside the panel with room for a hint line. Restructures into a scrolling strip when narrow, moving the hint into a hover preview.",
  sizeHint: "lg",
  tags: ["tabs", "vertical", "rail", "shadcn", "responsive"],
};

export function SectionTabsSideRail(vm: SectionTabsVM) {
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
        "grid w-full gap-6",
        narrow ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[minmax(11rem,15rem)_1fr]",
      )}
    >
      <div className="flex min-w-0 flex-col gap-3">
        {vm.heading ? (
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {vm.heading}
          </h2>
        ) : null}

        <TabsList
          aria-label={vm.ariaLabel}
          data-tabs-track={vm.scopeId}
          className={cn(
            "min-w-0 gap-1",
            narrow
              ? "flex items-center overflow-x-auto rounded-full border border-border/60 bg-card/60 p-1 [scrollbar-width:none]"
              : "flex flex-col items-stretch rounded-2xl border border-border/60 bg-card/40 p-2",
          )}
        >
          {vm.tabs.map((tab) => {
            const active = tab.state === "active";
            const className = cn(
              "group flex min-w-0 shrink-0 items-center gap-2.5 text-left transition-colors duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              narrow
                ? "whitespace-nowrap rounded-full px-3.5 py-2"
                : "w-full rounded-xl border-l-2 px-3 py-2.5",
              active
                ? narrow
                  ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                  : "border-l-primary bg-primary/10 text-primary"
                : narrow
                  ? "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                  : "border-l-transparent text-muted-foreground hover:border-l-accent/50 hover:bg-accent/5 hover:text-foreground",
              tab.state === "disabled" && "cursor-not-allowed opacity-40",
            );

            const body = (
              <>
                {/*
                  The initial is a rail affordance, not decoration: it keeps the
                  left edge of every label on the same axis whether or not a tab
                  has a hint, so the column reads as a list rather than as rows
                  of different shapes.
                */}
                {narrow ? null : (
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-bold leading-none tracking-tight",
                      active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.initial}
                  </span>
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", !narrow && "truncate")}>
                      {tab.label}
                    </span>
                    {tab.badge ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none",
                          active ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tab.badge}
                      </span>
                    ) : null}
                  </span>
                  {tab.hint && !narrow ? (
                    <span className="truncate text-xs text-muted-foreground">{tab.hint}</span>
                  ) : null}
                </span>
              </>
            );

            const trigger = (
              <TabsTrigger
                value={tab.id}
                disabled={tab.state === "disabled"}
                data-tab-state={tab.state}
                className={className}
              >
                {body}
              </TabsTrigger>
            );

            /*
             * The preview only earns its place where the hint cannot be shown.
             * Opening a card that repeats text already two pixels below it is
             * noise, and it trains people to dismiss the card that does matter.
             */
            if (!narrow || !tab.preview) {
              return <span key={tab.id} className="contents">{trigger}</span>;
            }

            return (
              <HoverCard key={tab.id} openDelay={220} closeDelay={120}>
                <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
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
      </div>

      <div className="grid min-w-0">
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

export default SectionTabsSideRail;
