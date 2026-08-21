/**
 * Stage Swap — a leaf on Step Reveal / Experimental.
 *
 * PURE PRESENTATION. Its props ARE StepRevealVM.
 * Structural answer: only the active step gets the stage. The others collapse
 * to ghost ordinals in a strip, so the sequence reads as one big claim at a
 * time instead of a list. Loud on purpose — that is why it is not on `canon`.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { StepRevealVM } from "../../../step-reveal.vm";

export const meta: LeafMeta = {
  label: "Stage Swap",
  description: "One step owns the stage; the rest collapse to ghost ordinals.",
  sizeHint: "lg",
  tags: ["loud", "one-at-a-time", "display-type"],
};

export function StepRevealStageSwap(vm: StepRevealVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container grid min-h-72 place-items-center rounded-3xl bg-muted">
        <p className="text-sm text-muted-foreground">No steps to walk through yet.</p>
      </section>
    );
  }

  const active = vm.steps[vm.activeIndex] ?? vm.steps[0];
  const settle = vm.reducedMotion ? 1 : Math.min(1, vm.stepProgress * 4);

  return (
    <section
      data-state={vm.state}
      className="@container relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-14"
    >
      {/* Oversized ordinal as a watermark — the only element tied to the raw index. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-10 select-none font-mono text-[12rem] font-bold leading-none text-muted opacity-60"
      >
        {active?.ordinal}
      </span>

      <div className="relative">
        {vm.eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {vm.eyebrow}
          </p>
        ) : null}
        <h2 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-[1.02] tracking-tight text-foreground">
          {vm.headline}
        </h2>

        {active ? (
          <div
            // Keyed on the step so the swap restarts the entrance every time.
            key={active.id}
            className="mt-12 max-w-2xl"
            style={{
              opacity: settle,
              transform: `translateY(${((1 - settle) * 12).toFixed(2)}px)`,
            }}
          >
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-sm text-primary">{active.ordinal}</span>
              {active.meta ? (
                <span className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
                  {active.meta}
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 text-balance text-3xl font-semibold text-foreground">
              {active.title}
            </h3>
            <p className="mt-4 text-lg text-muted-foreground">{active.description}</p>
          </div>
        ) : null}

        {vm.body ? <p className="mt-8 max-w-prose text-muted-foreground">{vm.body}</p> : null}

        {/* The strip: every other step reduced to a tappable ghost. */}
        <ol className="mt-12 flex flex-wrap items-center gap-2">
          {vm.steps.map((step, index) => {
            const isActive = step.position === "active";
            const label = (
              <>
                <span className="font-mono text-xs">{step.ordinal}</span>
                <span className={cn("ml-2 text-xs", isActive ? "inline" : "hidden @lg:inline")}>
                  {step.title}
                </span>
              </>
            );
            return (
              <li key={step.id} data-position={step.position}>
                {vm.onSelectStep ? (
                  <button
                    type="button"
                    onClick={() => vm.onSelectStep?.(index)}
                    aria-current={isActive}
                    className={cn(
                      "max-w-[16rem] truncate rounded-full border px-4 py-2 transition-colors duration-300",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      isActive
                        ? "border-ring bg-primary text-primary-foreground"
                        : step.position === "past"
                          ? "border-border bg-muted text-foreground"
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                ) : (
                  <span
                    className={cn(
                      "block max-w-[16rem] truncate rounded-full border px-4 py-2",
                      isActive
                        ? "border-ring bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {vm.positionLabel ? (
          <p className="mt-6 font-mono text-xs text-muted-foreground">{vm.positionLabel}</p>
        ) : null}

        {vm.cta ? (
          <a
            href={vm.cta.href}
            onClick={vm.cta.onActivate}
            className="mt-8 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {vm.cta.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export default StepRevealStageSwap;
