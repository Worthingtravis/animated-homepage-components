/**
 * Ring Dial — a leaf on Countdown / Canon.
 *
 * PURE PRESENTATION. Its props ARE CountdownVM.
 * Structural answer: the window as a shape. One arc depletes across the whole
 * window while the digits sit inside it, so the glanceable signal and the exact
 * signal occupy the same spot instead of competing for the eye.
 *
 * The digits are always the source of truth. A dial can only be drawn when the
 * container knew where the window started — without that, `progress` stays 0
 * and this leaf shows an undrawn ring around a clock that still reads
 * correctly, rather than pretending to a fraction nobody measured.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { CountdownVM } from "../../../countdown.vm";

export const meta: LeafMeta = {
  label: "Ring Dial",
  description: "A depleting arc with the digits inside it — the glance and the detail in one place.",
  sizeHint: "md",
  tags: ["radial", "focal", "compact"],
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRingDial(vm: CountdownVM) {
  if (vm.state === "none") return null;

  const urgent = vm.state === "urgent";
  const expired = vm.state === "expired";
  const remaining = expired ? 0 : 1 - vm.progress;

  // The two coarsest units go inside the ring; anything finer sits under it,
  // because four numbers in a 120px circle is a texture, not a time.
  const primaryUnits = vm.units.slice(0, 2);
  const trailingUnits = vm.units.slice(2);

  return (
    <section
      data-state={vm.state}
      className="flex flex-col items-center gap-5 rounded-xl border border-border bg-card p-8 text-center"
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

      <div className="relative size-36">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            className="stroke-border"
          />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - remaining)}
            className={cn(
              "transition-[stroke-dashoffset] duration-700 ease-out",
              urgent || expired ? "stroke-primary" : "stroke-accent",
            )}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {expired ? (
            <span className="px-4 text-sm font-semibold tracking-tight text-primary">
              {vm.expiredLabel ?? "Time's up"}
            </span>
          ) : (
            <span
              className="flex items-baseline font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground"
              aria-label={vm.remainingLabel ?? undefined}
            >
              {primaryUnits.map((unit, index) => (
                <span key={unit.id} data-unit={unit.id} className="flex items-baseline">
                  {index > 0 ? (
                    <span
                      aria-hidden
                      className={cn(
                        "px-0.5 text-muted-foreground",
                        urgent && !vm.reducedMotion ? "animate-pulse" : null,
                      )}
                    >
                      :
                    </span>
                  ) : null}
                  <span className={urgent ? "text-primary" : undefined}>{unit.value}</span>
                </span>
              ))}
            </span>
          )}

          {trailingUnits.length > 0 ? (
            <span className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              {trailingUnits.map((unit) => (
                <span key={unit.id} data-unit={unit.id} className="ml-1.5">
                  {unit.value}
                  {unit.shortLabel}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </div>

      {vm.headline ? (
        <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground">
          {vm.headline}
        </h2>
      ) : null}

      {vm.body ? <p className="max-w-prose text-sm text-muted-foreground">{vm.body}</p> : null}

      {vm.deadlineLabel ? (
        <p className="font-mono text-xs text-muted-foreground">{vm.deadlineLabel}</p>
      ) : null}

      {vm.cta ? (
        <a
          href={vm.cta.href}
          onClick={vm.cta.onActivate}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {vm.cta.label}
        </a>
      ) : null}
    </section>
  );
}

export default CountdownRingDial;
