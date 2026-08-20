/**
 * Flip Stack — a leaf on Countdown / Experimental.
 *
 * PURE PRESENTATION. Its props ARE CountdownVM.
 * Structural answer: split-flap. Each unit is a hinged card, and the hinge leaf
 * tilts through `unit.fraction` — the unit's own cycle, which the container
 * already computed. That is the whole trick: a real split-flap needs to know
 * the previous digit and when it changed, which is state; reading the *phase*
 * of the current cycle gets the same motion out of a pure function.
 *
 * The digit underneath never moves. Only the hinge does — so a screenshot at
 * any instant still reads as the correct time.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { CountdownVM } from "../../../countdown.vm";

export const meta: LeafMeta = {
  label: "Flip Stack",
  description: "Split-flap cards whose hinge tilts on each unit's own cycle — no state, no jump cut.",
  sizeHint: "md",
  tags: ["split-flap", "mechanical", "loud"],
};

export function CountdownFlipStack(vm: CountdownVM) {
  if (vm.state === "none") return null;

  const urgent = vm.state === "urgent";

  if (vm.state === "expired") {
    return (
      <section
        data-state={vm.state}
        className="@container rounded-2xl border border-ring bg-card p-10 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {vm.eyebrow ?? "Closed"}
        </p>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-primary">
          {vm.expiredLabel ?? "Time's up"}
        </p>
      </section>
    );
  }

  return (
    <section
      data-state={vm.state}
      className={cn(
        "@container",
        "rounded-2xl border bg-card p-10 transition-colors duration-500",
        urgent ? "border-ring" : "border-border",
      )}
    >
      {vm.eyebrow ? (
        <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {vm.eyebrow}
        </p>
      ) : null}

      <ol
        className="mt-6 flex flex-wrap items-start justify-center gap-4"
        aria-label={vm.remainingLabel ?? undefined}
      >
        {vm.units.map((unit) => {
          // The hinge sweeps 0 → -180° across the unit's own cycle. Held flat
          // when the viewer asked for stillness, or before the window opens.
          const tilt =
            vm.reducedMotion || vm.state === "scheduled" ? 0 : -180 * unit.fraction;

          return (
            <li key={unit.id} data-unit={unit.id} className="flex flex-col items-center">
              <div className="relative w-24 overflow-hidden rounded-lg border border-border bg-muted">
                <span
                  className={cn(
                    "block py-4 text-center font-mono text-5xl font-semibold tabular-nums tracking-tighter",
                    urgent ? "text-primary" : "text-foreground",
                  )}
                >
                  {unit.value}
                </span>

                {/* The hinge line, and the flap that swings off it. */}
                <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-border" />
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-1/2 origin-bottom border-b",
                    urgent ? "border-ring bg-primary/15" : "border-border bg-card/70",
                  )}
                  style={{
                    transform: `perspective(320px) rotateX(${tilt}deg)`,
                    opacity: Math.max(0, 1 - unit.fraction * 1.6),
                  }}
                />
              </div>

              <span className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                {unit.label}
              </span>
            </li>
          );
        })}
      </ol>

      {vm.headline ? (
        <h2 className="mt-8 text-balance text-center text-2xl font-semibold tracking-tight text-foreground">
          {vm.headline}
        </h2>
      ) : null}

      {vm.body ? (
        <p className="mx-auto mt-3 max-w-prose text-center text-sm text-muted-foreground">
          {vm.body}
        </p>
      ) : null}

      {vm.deadlineLabel ? (
        <p className="mt-4 text-center font-mono text-xs text-muted-foreground">
          {vm.deadlineLabel}
        </p>
      ) : null}

      {vm.cta ? (
        <div className="mt-6 text-center">
          <a
            href={vm.cta.href}
            onClick={vm.cta.onActivate}
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {vm.cta.label}
          </a>
        </div>
      ) : null}
    </section>
  );
}

export default CountdownFlipStack;
