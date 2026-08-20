/**
 * Inline Strip — a leaf on Countdown / Canon.
 *
 * PURE PRESENTATION. Its props ARE CountdownVM.
 * Structural answer: one line. This is the leaf for a banner, a sticky bar or a
 * slot inside `chrome/section-tabs`, where the countdown is a fact the page
 * carries rather than the thing the page is about. It uses `shortLabel`, so its
 * width tracks the digits and not the vocabulary, and the depletion is the
 * strip's own underline — the only geometry a full-bleed bar has spare.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { CountdownVM } from "../../../countdown.vm";

export const meta: LeafMeta = {
  label: "Inline Strip",
  description: "A single dense line for banners and bars — short labels, underline as the window.",
  sizeHint: "sm",
  tags: ["banner", "dense", "chrome"],
};

export function CountdownInlineStrip(vm: CountdownVM) {
  if (vm.state === "none") return null;

  const urgent = vm.state === "urgent";
  const expired = vm.state === "expired";

  return (
    <section
      data-state={vm.state}
      className={cn(
        "@container",
        "relative flex w-full flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden rounded-lg border px-4 py-2.5 transition-colors duration-500",
        urgent ? "border-ring bg-primary/10" : "border-border bg-card",
      )}
    >
      {/* A dot that only exists while something is actually running out. */}
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          expired ? "bg-muted-foreground" : "bg-primary",
          urgent && !vm.reducedMotion ? "animate-pulse" : null,
        )}
      />

      {vm.eyebrow ? (
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {vm.eyebrow}
        </span>
      ) : null}

      {expired ? (
        <span className="font-mono text-sm font-semibold text-primary">
          {vm.expiredLabel ?? "Time's up"}
        </span>
      ) : (
        <span
          className="flex items-baseline gap-1.5 font-mono text-sm tabular-nums"
          aria-label={vm.remainingLabel ?? undefined}
        >
          {vm.units.map((unit) => (
            <span key={unit.id} data-unit={unit.id} className="flex items-baseline">
              <span
                className={cn(
                  "text-base font-semibold tracking-tight",
                  urgent ? "text-primary" : "text-foreground",
                )}
              >
                {unit.value}
              </span>
              <span className="text-[0.7rem] text-muted-foreground">{unit.shortLabel}</span>
            </span>
          ))}
        </span>
      )}

      {vm.headline ? (
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{vm.headline}</span>
      ) : (
        <span className="flex-1" />
      )}

      {vm.deadlineLabel ? (
        <span className="hidden text-xs text-muted-foreground @lg:inline">{vm.deadlineLabel}</span>
      ) : null}

      {vm.cta ? (
        <a
          href={vm.cta.href}
          onClick={vm.cta.onActivate}
          className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {vm.cta.label}
        </a>
      ) : null}

      {/* The window, as the strip's own underline. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 transition-[width] duration-700 ease-out",
          urgent || expired ? "bg-primary" : "bg-accent",
        )}
        style={{
          width: `${Math.round((vm.state === "scheduled" ? 0 : expired ? 1 : vm.progress) * 100)}%`,
        }}
      />
    </section>
  );
}

export default CountdownInlineStrip;
