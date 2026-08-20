/**
 * Door Row — a leaf on Pane Dock / Canon.
 *
 * PURE PRESENTATION. Its props ARE PaneDockVM.
 *
 * Structural answer: **one row, under the sentence that justifies it.**
 *
 * Every docked pane is a full-width-legible button in a single horizontal row
 * directly beneath `purpose` — read the job, then read the ways out of it. The
 * doors are read in the same direction as everything else on the page, they
 * carry their real labels rather than an initial, and there is exactly one
 * place to look for "what else is there", regardless of which slot the pane
 * would open into.
 *
 * ── Why one row and not four edges ─────────────────────────────────────────
 * The alternative on this same tree (`edge-strips`) puts each docked pane on
 * the edge of the column it would open into, which is locally the most
 * *informative* placement — the door is where the room is. It is also how a
 * surface ends up ringed on four sides, and the cost is not linear: each strip
 * takes a little space and a lot of the reader's ranking. A row of five doors
 * reads as one control that happens to have five options. Five strips on four
 * edges read as five separate claims on the screen, and the eye has to dismiss
 * each one before it can find the thing the page is for.
 *
 * So this leaf trades the placement information away deliberately. `door.slot`
 * is in the VM and this leaf only uses it to ORDER the row (lead → stage →
 * support → aside, the reading order of the layout itself), never to move a
 * door somewhere else.
 *
 * ── `solo` is the whole point ──────────────────────────────────────────────
 * When nothing is docked the row is not rendered empty and not rendered
 * disabled — it is not rendered. That is the state the contract carries a
 * dedicated string for, and honouring it is what keeps "nothing to reach" from
 * costing a permanent bar.
 *
 * Theming: the purpose badge is an accent chip, the primary door carries the
 * primary wash, and every door focuses to the ring — so a creator moving
 * `--accent`, `--primary` and `--ring` moves this leaf.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type {
  PaneDockPane,
  PaneDockSlot,
  PaneDockVM,
} from "../../../pane-dock.vm";

export const meta: LeafMeta = {
  label: "Door Row",
  description:
    "Every docked pane is one labelled button in a single row under the purpose line. One place to look, read in the reading direction, and nothing at all when nothing is docked.",
  sizeHint: "lg",
  tags: ["dock", "row", "disclosure", "legible", "recommended"],
};

/** Reading order of the layout itself. Presentation, so it lives in the leaf. */
const SLOT_ORDER: Record<PaneDockSlot, number> = {
  lead: 0,
  stage: 1,
  support: 2,
  aside: 3,
};

function PaneShell({ pane, className }: { pane: PaneDockPane; className?: string }) {
  return (
    <section
      id={pane.regionId}
      aria-labelledby={pane.headerId}
      data-slot={pane.slot}
      data-motion={pane.motion.kind}
      style={pane.motion.style}
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-border bg-card",
        className,
      )}
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

export function PaneDockDoorRow(vm: PaneDockVM) {
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
  const doors = [...vm.docked].sort(
    (a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot],
  );

  return (
    <section
      data-pane-dock={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="@container flex flex-col gap-4 rounded-2xl border border-border bg-background p-4"
    >
      {/* THE SENTENCE THAT RANKS EVERYTHING BELOW IT. Never null, and first. */}
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

      {/* THE ROW. Absent entirely in `solo` — see the header note. */}
      {vm.state === "solo" ? null : (
        <nav
          aria-label={vm.dockedLabel ?? "Docked panes"}
          className="flex flex-wrap items-center gap-2"
        >
          {doors.map((door, index) => (
            <button
              key={door.id}
              type="button"
              onClick={door.onOpen}
              aria-label={door.ariaLabel}
              data-slot={door.slot}
              className={cn(
                "group inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                // The first door is the most likely next action, so it is the
                // one that reads as an action rather than an option.
                index === 0
                  ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted",
              )}
            >
              <span className="font-medium">{door.label}</span>
              {door.badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-medium",
                    index === 0
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-accent text-accent-foreground",
                  )}
                >
                  {door.badge}
                </span>
              ) : null}
              {door.hint && vm.density === "wide" ? (
                <span
                  className={cn(
                    "hidden text-xs @4xl:inline",
                    index === 0
                      ? "text-primary-foreground/75"
                      : "text-muted-foreground",
                  )}
                >
                  {door.hint}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      )}

      {/* Flex, not a fixed grid template: a column that has no panes is not
          rendered at all, and a three-track grid would hold its gutter open for
          a column that is not there — the same "empty rail" failure the dock
          itself is about, one level down. */}
      <div
        className={cn(
          "flex min-h-0 flex-col gap-3",
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

        {/* The stage column carries `support` under it — what you DO with what
            you looked at belongs to the same column, not to a fourth edge. */}
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
    </section>
  );
}

export default PaneDockDoorRow;
