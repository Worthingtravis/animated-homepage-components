/**
 * Unit Blocks — a leaf on Countdown / Canon.
 *
 * PURE PRESENTATION. Its props ARE CountdownVM.
 * Structural answer: the classic. One tile per unit, monospaced so a digit
 * change never reflows the row, with the depletion drawn as a hairline under
 * the whole set rather than inside each tile — a per-tile fill reads as four
 * unrelated clocks.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { CountdownVM } from "../../../countdown.vm";

export const meta: LeafMeta = {
  label: "Unit Blocks",
  description: "Monospaced tiles per unit, with the window drawn as one hairline underneath.",
  sizeHint: "md",
  tags: ["classic", "tiles", "legible"],
};

export function CountdownUnitBlocks(vm: CountdownVM) {
  // No deadline is not an empty state to decorate — it is nothing to say.
  if (vm.state === "none") return null;

  const urgent = vm.state === "urgent";

  if (vm.state === "expired") {
    return (
      <section
        data-state={vm.state}
        className="rounded-xl border border-border bg-card p-8 text-center"
      >
        {vm.eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {vm.eyebrow}
          </p>
        ) : null}
        <p className="mt-3 text-2xl font-semibold tracking-tight text-primary">
          {vm.expiredLabel ?? "Time's up"}
        </p>
        {vm.deadlineLabel ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">{vm.deadlineLabel}</p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      data-state={vm.state}
      className={cn(
        "rounded-xl border bg-card p-8 transition-colors duration-500",
        urgent ? "border-ring" : "border-border",
      )}
    >
      {vm.eyebrow ? (
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-[0.18em]",
            urgent ? "text-primary" : "text-muted-foreground",
          )}
        >
          {vm.eyebrow}
        </p>
      ) : null}

      {vm.headline ? (
        <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground">
          {vm.headline}
        </h2>
      ) : null}

      <ol
        className="mt-6 flex flex-wrap items-end gap-3"
        aria-label={vm.remainingLabel ?? undefined}
      >
        {vm.units.map((unit, index) => (
          <li key={unit.id} className="flex items-end gap-3" data-unit={unit.id}>
            <div
              className={cn(
                "min-w-20 rounded-lg border px-4 py-3 text-center transition-colors duration-500",
                urgent ? "border-ring bg-primary/10" : "border-border bg-muted",
              )}
              style={
                // The seconds tile breathes with its own cycle; nothing else moves.
                unit.id === "seconds" && !vm.reducedMotion
                  ? { opacity: 0.72 + 0.28 * Math.abs(Math.cos(unit.fraction * Math.PI)) }
                  : undefined
              }
            >
              <span
                className={cn(
                  "block font-mono text-4xl font-semibold tabular-nums tracking-tight",
                  urgent ? "text-primary" : "text-foreground",
                )}
              >
                {unit.value}
              </span>
              <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                {unit.label}
              </span>
            </div>
            {index < vm.units.length - 1 ? (
              <span aria-hidden className="pb-6 font-mono text-2xl text-border">
                :
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      {/* One window, one hairline. `scheduled` has nothing to deplete yet. */}
      <div aria-hidden className="mt-6 h-px w-full bg-border">
        <div
          className={cn(
            "h-px transition-[width] duration-700 ease-out",
            urgent ? "bg-primary" : "bg-accent",
          )}
          style={{ width: `${Math.round((vm.state === "scheduled" ? 0 : vm.progress) * 100)}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {vm.remainingLabel ? (
            <p className="font-mono text-xs text-muted-foreground">{vm.remainingLabel}</p>
          ) : null}
          {vm.deadlineLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">{vm.deadlineLabel}</p>
          ) : null}
        </div>

        {vm.cta ? (
          <a
            href={vm.cta.href}
            onClick={vm.cta.onActivate}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {vm.cta.label}
          </a>
        ) : null}
      </div>

      {vm.body ? <p className="mt-4 max-w-prose text-sm text-muted-foreground">{vm.body}</p> : null}
    </section>
  );
}

export default CountdownUnitBlocks;
