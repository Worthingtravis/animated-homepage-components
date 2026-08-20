/**
 * Edge Strips — a leaf on Pane Dock / Canon.
 *
 * PURE PRESENTATION. Its props ARE PaneDockVM.
 *
 * Structural answer: **the door is where the room is.** Every docked pane
 * leaves a one-click strip on the edge of the column it would open into — lead
 * on the left, aside on the right, support along the bottom, stage across the
 * top. Nothing is hidden, nothing is grouped, and the position of a strip tells
 * you where the pane will appear.
 *
 * ── This is the shipped answer, and it is here to be compared against ──────
 * It is not a straw man. Placement-as-affordance is real information, the
 * gesture is symmetrical with putting a pane away, and each strip individually
 * costs almost nothing. This leaf exists so the argument for the other three is
 * empirical rather than rhetorical: flip a real surface between this and
 * `door-row` on the same VM and the difference is a fact you can look at.
 *
 * What to look at when you do:
 *
 *  · **Four edges, one screen.** With five panes docked the content is ringed
 *    on all four sides. Each strip won its place against the strip beside it;
 *    none of them was ever weighed against `purpose`.
 *  · **The labels turn sideways.** A vertical strip has no room for horizontal
 *    text, so the label rotates. A word you tilt your head to read is a word
 *    the layout could not afford — the rotation is the cost becoming visible,
 *    and it is the reason this leaf is the one that scales worst on `Many
 *    docked`.
 *  · **The reader ranks nothing.** Five equally-weighted edges say five equally
 *    important things, on a screen whose `purpose` names exactly one.
 *
 * Theming: strips carry a primary hairline and focus to the ring, so a creator
 * moving `--primary` / `--ring` moves this leaf too — it is deaf to nothing, it
 * is simply loud.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type {
  PaneDockDoor,
  PaneDockPane,
  PaneDockVM,
} from "../../../pane-dock.vm";

export const meta: LeafMeta = {
  label: "Edge Strips",
  description:
    "One collapsed strip per docked pane, on the edge of the column it would open into. Maximum placement information, and the reason a five-pane surface ends up ringed on four sides with its labels turned sideways.",
  sizeHint: "lg",
  tags: ["dock", "strips", "edges", "baseline", "status-quo"],
};

function VerticalStrip({ door }: { door: PaneDockDoor }) {
  return (
    <button
      type="button"
      onClick={door.onOpen}
      aria-label={door.ariaLabel}
      data-slot={door.slot}
      title={door.hint ?? door.label}
      className={cn(
        "flex w-8 shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-card py-3",
        "text-muted-foreground hover:border-primary/60 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {door.badge ? (
        <span className="rounded-full bg-accent px-1 text-[10px] font-medium leading-4 text-accent-foreground">
          {door.badge}
        </span>
      ) : null}
      {/* The rotation IS the finding. See the header note. */}
      <span
        className="whitespace-nowrap text-xs font-medium tracking-wide"
        style={{ writingMode: "vertical-rl" }}
      >
        {door.label}
      </span>
    </button>
  );
}

function HorizontalStrip({ door }: { door: PaneDockDoor }) {
  return (
    <button
      type="button"
      onClick={door.onOpen}
      aria-label={door.ariaLabel}
      data-slot={door.slot}
      title={door.hint ?? door.label}
      className={cn(
        "flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3",
        "text-muted-foreground hover:border-primary/60 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span className="text-xs font-medium tracking-wide">{door.label}</span>
      {door.badge ? (
        <span className="rounded-full bg-accent px-1.5 text-[10px] font-medium leading-4 text-accent-foreground">
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
            ‹‹
          </button>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 p-3">{pane.content}</div>
    </section>
  );
}

export function PaneDockEdgeStrips(vm: PaneDockVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8">
        <p className="text-sm text-muted-foreground">{vm.emptyLabel}</p>
      </section>
    );
  }

  const lead = vm.open.filter((p) => p.slot === "lead");
  const stage = vm.open.filter((p) => p.slot === "stage");
  const support = vm.open.filter((p) => p.slot === "support");
  const aside = vm.open.filter((p) => p.slot === "aside");

  // Each edge takes the doors of the column it belongs to. `solo` means every
  // one of these is empty, and an edge with nothing in it must not reserve a
  // gutter — the one thing this leaf and its siblings agree about completely.
  const leftDoors = vm.docked.filter((d) => d.slot === "lead");
  const rightDoors = vm.docked.filter((d) => d.slot === "aside");
  const bottomDoors = vm.docked.filter((d) => d.slot === "support");
  const topDoors = vm.docked.filter((d) => d.slot === "stage");

  return (
    <section
      data-pane-dock={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="@container flex flex-col gap-3 rounded-2xl border border-border bg-background p-4"
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-balance text-xl font-semibold text-foreground">
          {vm.purpose.title}
        </h2>
        {vm.purpose.badge ? (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {vm.purpose.badge}
          </span>
        ) : null}
        {vm.purpose.subtitle ? (
          <p className="w-full text-sm text-muted-foreground">
            {vm.purpose.subtitle}
          </p>
        ) : null}
      </header>

      {topDoors.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {topDoors.map((door) => (
            <HorizontalStrip key={door.id} door={door} />
          ))}
        </div>
      ) : null}

      <div className="flex min-h-0 gap-2">
        {leftDoors.length > 0 ? (
          <div className="flex flex-col gap-2">
            {leftDoors.map((door) => (
              <VerticalStrip key={door.id} door={door} />
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col gap-3",
            vm.density === "narrow" ? null : "@4xl:flex-row",
          )}
        >
          {lead.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-3 @4xl:flex-1">
              {lead.map((pane) => (
                <PaneShell key={pane.id} pane={pane} />
              ))}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-3 @4xl:flex-[2]">
            {stage.map((pane) => (
              <PaneShell key={pane.id} pane={pane} />
            ))}
            {support.map((pane) => (
              <PaneShell key={pane.id} pane={pane} />
            ))}
          </div>

          {aside.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-3 @4xl:flex-1">
              {aside.map((pane) => (
                <PaneShell key={pane.id} pane={pane} />
              ))}
            </div>
          ) : null}
        </div>

        {rightDoors.length > 0 ? (
          <div className="flex flex-col gap-2">
            {rightDoors.map((door) => (
              <VerticalStrip key={door.id} door={door} />
            ))}
          </div>
        ) : null}
      </div>

      {bottomDoors.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {bottomDoors.map((door) => (
            <HorizontalStrip key={door.id} door={door} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default PaneDockEdgeStrips;
