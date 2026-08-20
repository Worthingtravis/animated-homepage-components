/**
 * One Rail — a leaf on Pane Dock / Canon.
 *
 * PURE PRESENTATION. Its props ARE PaneDockVM.
 *
 * Structural answer: **one rail, every door in it, labels the right way up.**
 *
 * A single vertical column on the left holds every docked pane regardless of
 * which slot it would open into. It is the middle answer between `edge-strips`
 * (a rail per edge) and `command-sheet` (no standing chrome at all), and it is
 * the one to reach for when a surface has a genuinely persistent set of places
 * to go — a rail the reader learns once and then stops seeing.
 *
 * ── Why it stays horizontal ────────────────────────────────────────────────
 * The rail is wide enough for a real word. That is the entire discipline of
 * this leaf and it is deliberately expensive: a rail that fits "Overlay setup"
 * costs ~11rem it can never give back, and the moment you try to buy that width
 * back you get `edge-strips`' rotated labels or an icon nobody can identify.
 *
 * So the width is the honest price of a persistent rail, and the design rule is
 * to keep the rail SHORT rather than to make it thin. If the doors do not fit
 * legibly in one column, the surface has too many — that is a `purpose`
 * problem, and squeezing the type is answering it with the wrong tool.
 *
 * `hint` renders under the label, which is the affordance the other three
 * leaves cannot afford: this is the only leaf where a door can explain itself
 * without being hovered.
 *
 * ── Grouped by slot, because a rail is a list and lists want order ─────────
 * Doors are grouped under their slot's role name. It costs three small headings
 * and it is what stops a twelve-door rail from reading as an undifferentiated
 * stack — see the `Many docked` fixture, which is where this leaf's ceiling is.
 *
 * Theming: the rail's active hairline and every focus ring are primary/ring;
 * badges are accent.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type {
  PaneDockPane,
  PaneDockSlot,
  PaneDockVM,
} from "../../../pane-dock.vm";

export const meta: LeafMeta = {
  label: "One Rail",
  description:
    "Every docked pane in a single left rail, grouped by role, with labels the right way up and room for a hint. The width is the honest price of a rail you can read.",
  sizeHint: "lg",
  tags: ["dock", "rail", "persistent", "legible", "grouped"],
};

/** Presentation: what to call each slot in the rail. */
const SLOT_LABEL: Record<PaneDockSlot, string> = {
  lead: "Find",
  stage: "Watch",
  support: "Do",
  aside: "Keep",
};

const SLOT_ORDER: readonly PaneDockSlot[] = ["lead", "stage", "support", "aside"];

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

export function PaneDockOneRail(vm: PaneDockVM) {
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

  const groups = SLOT_ORDER.map((slot) => ({
    slot,
    doors: vm.docked.filter((d) => d.slot === slot),
  })).filter((g) => g.doors.length > 0);

  return (
    <section
      data-pane-dock={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="@container flex flex-col gap-4 rounded-2xl border border-border bg-background p-4"
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

      <div
        className={cn(
          "flex min-h-0 gap-4",
          vm.density === "narrow" ? "flex-col" : "flex-col @4xl:flex-row",
        )}
      >
        {/* THE RAIL. Absent in `solo` — a rail with nothing in it is the exact
            failure this tree exists to name, and it is one `null` away. */}
        {vm.state === "solo" ? null : (
          <nav
            aria-label={vm.dockedLabel ?? "Docked panes"}
            className={cn(
              "flex shrink-0 flex-col gap-4 rounded-xl border border-border bg-card p-3",
              vm.density === "narrow" ? null : "@4xl:w-44",
            )}
          >
            {groups.map((group) => (
              <div key={group.slot} className="flex flex-col gap-1">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {SLOT_LABEL[group.slot]}
                </p>
                {group.doors.map((door) => (
                  <button
                    key={door.id}
                    type="button"
                    onClick={door.onOpen}
                    aria-label={door.ariaLabel}
                    data-slot={door.slot}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-lg border border-transparent px-2 py-1.5 text-left",
                      "hover:border-primary/40 hover:bg-muted",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {door.label}
                      </span>
                      {door.badge ? (
                        <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium leading-none text-accent-foreground">
                          {door.badge}
                        </span>
                      ) : null}
                    </span>
                    {door.hint ? (
                      <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                        {door.hint}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        )}

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
      </div>
    </section>
  );
}

export default PaneDockOneRail;
