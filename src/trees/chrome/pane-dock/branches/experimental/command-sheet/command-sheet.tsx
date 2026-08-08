/**
 * Command Sheet — a leaf on Pane Dock / Experimental.
 *
 * PURE PRESENTATION. Its props ARE PaneDockVM.
 *
 * Structural answer: **no standing chrome at all.** One trigger sits in the
 * purpose header carrying a pre-formatted count; everything docked lives behind
 * it in a sheet, listed with its label, its hint and its badge. The panes get
 * the entire screen.
 *
 * This is the only leaf on the tree whose footprint does not grow with the
 * number of docked panes — five and twelve cost identical header — which makes
 * it the honest answer for a surface with one job and a long tail of places you
 * could go instead. It is `experimental` because it takes the trade to its
 * limit: reachability drops from one click to two, and a door nobody can see is
 * a door some people will never open.
 *
 * ── The cost, named ────────────────────────────────────────────────────────
 * `edge-strips` spends screen to make every destination permanently visible.
 * This spends visibility to make the job unmissable. Neither is free and the
 * tree exists so a surface can pick per posture rather than once, forever: a
 * first-time viewer sent from a Twitch panel wants this; someone who lives in
 * the workspace all day wants `one-rail`. Same VM, one prop.
 *
 * ── Degrading when the container offers no disclosure ──────────────────────
 * `vm.overlay` is null when the container decided this surface does not get a
 * sheet at this density. Rather than invent one — a leaf holding open state is
 * the one thing the contract forbids — this leaf falls back to a compact inline
 * strip of doors. That path is a real fixture (`Send page — five docked`), not
 * a defensive branch nobody looks at.
 *
 * Theming: the trigger is a primary-tinted pill, the sheet's selected hairline
 * and every focus ring are `--ring`, badges are accent.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type {
  PaneDockDoor,
  PaneDockPane,
  PaneDockVM,
} from "../../../pane-dock.vm";

export const meta: LeafMeta = {
  label: "Command Sheet",
  description:
    "Zero standing chrome — one counted trigger in the header, every docked pane behind it in a sheet. The only leaf whose footprint does not grow with the dock.",
  sizeHint: "lg",
  tags: ["dock", "sheet", "disclosure", "minimal", "compact"],
};

function DoorRow({ door }: { door: PaneDockDoor }) {
  return (
    <button
      type="button"
      onClick={door.onOpen}
      aria-label={door.ariaLabel}
      data-slot={door.slot}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left",
        "hover:border-primary/40 hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground"
      >
        {door.initial}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {door.label}
        </span>
        {door.hint ? (
          <span className="truncate text-xs text-muted-foreground">
            {door.hint}
          </span>
        ) : null}
      </span>
      {door.badge ? (
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {door.badge}
        </span>
      ) : null}
    </button>
  );
}

function PaneShell({ pane }: { pane: PaneDockPane }) {
  return (
    <section
      id={pane.regionId}
      aria-labelledby={pane.headerId}
      data-slot={pane.slot}
      data-motion={pane.motion.kind}
      style={pane.motion.style}
      className="flex min-w-0 flex-col rounded-xl border border-border bg-card"
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h3
          id={pane.headerId}
          className="truncate text-sm font-semibold text-foreground"
        >
          {pane.label}
        </h3>
        {pane.badge ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {pane.badge}
          </span>
        ) : null}
        {pane.hint ? (
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {pane.hint}
          </p>
        ) : (
          <span className="flex-1" />
        )}
        {pane.onDock ? (
          <button
            type="button"
            onClick={pane.onDock}
            aria-label={pane.dockAriaLabel ?? undefined}
            className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Put away
          </button>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 p-3">{pane.content}</div>
    </section>
  );
}

export function PaneDockCommandSheet(vm: PaneDockVM) {
  if (vm.state === "empty") {
    return (
      <section className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel}</p>
      </section>
    );
  }

  const lead = vm.open.filter((p) => p.slot === "lead");
  const stage = vm.open.filter((p) => p.slot === "stage");
  const support = vm.open.filter((p) => p.slot === "support");
  const aside = vm.open.filter((p) => p.slot === "aside");
  const hasDock = vm.state !== "solo" && vm.docked.length > 0;

  return (
    <section
      data-pane-dock={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4"
    >
      <header className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-balance text-xl font-semibold text-foreground">
              {vm.purpose.title}
            </h2>
            {vm.purpose.badge ? (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {vm.purpose.badge}
              </span>
            ) : null}
          </div>
          {vm.purpose.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {vm.purpose.subtitle}
            </p>
          ) : null}
        </div>

        {/* THE ENTIRE DOCK, when the container offered a disclosure. */}
        {hasDock && vm.overlay ? (
          <button
            type="button"
            onClick={() => vm.overlay?.onOpenChange(vm.overlay.state !== "open")}
            aria-label={vm.overlay.triggerAriaLabel}
            aria-expanded={vm.overlay.state === "open"}
            // The whole dock, as one element. Stamped so "how much chrome does
            // this leaf spend on the dock" is a query and not an eyeball.
            data-dock-trigger=""
            className={cn(
              "shrink-0 rounded-full border border-transparent bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {vm.overlay.triggerLabel}
          </button>
        ) : null}
      </header>

      {/* The sheet. Its open state is the VM's, which is what lets the lab draw
          it open as a static fixture instead of requiring a click. */}
      {hasDock && vm.overlay?.state === "open" ? (
        <nav
          aria-label={vm.dockedLabel ?? "Docked panes"}
          className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2"
        >
          {vm.docked.map((door) => (
            <DoorRow key={door.id} door={door} />
          ))}
        </nav>
      ) : null}

      {/* DEGRADED PATH — no disclosure was offered. See the header note. */}
      {hasDock && !vm.overlay ? (
        <nav
          aria-label={vm.dockedLabel ?? "Docked panes"}
          className="flex flex-wrap gap-1.5"
        >
          {vm.docked.map((door) => (
            <button
              key={door.id}
              type="button"
              onClick={door.onOpen}
              aria-label={door.ariaLabel}
              data-slot={door.slot}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground",
                "hover:border-primary/50 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {door.label}
              {door.badge ? (
                <span className="rounded-full bg-accent px-1.5 text-[10px] font-medium leading-4 text-accent-foreground">
                  {door.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      ) : null}

      <div
        className={cn(
          "flex min-h-0 flex-col gap-3",
          vm.density === "narrow" ? null : "lg:flex-row",
        )}
      >
        {lead.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-3 lg:flex-1">
            {lead.map((pane) => (
              <PaneShell key={pane.id} pane={pane} />
            ))}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-3 lg:flex-[2]">
          {stage.map((pane) => (
            <PaneShell key={pane.id} pane={pane} />
          ))}
          {support.map((pane) => (
            <PaneShell key={pane.id} pane={pane} />
          ))}
        </div>

        {aside.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-3 lg:flex-1">
            {aside.map((pane) => (
              <PaneShell key={pane.id} pane={pane} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default PaneDockCommandSheet;
