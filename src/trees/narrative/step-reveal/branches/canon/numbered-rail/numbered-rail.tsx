/**
 * Numbered Rail — a leaf on Step Reveal / Canon.
 *
 * PURE PRESENTATION. Its props ARE StepRevealVM.
 * Structural answer: a vertical rail. Every step stays legible at once; the
 * active one is marked by a travelling fill, not by hiding its neighbours.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { StepRevealVM } from "../../../step-reveal.vm";

export const meta: LeafMeta = {
  label: "Numbered Rail",
  description: "Vertical rail — all steps legible at once, a fill travels the spine.",
  sizeHint: "lg",
  tags: ["editorial", "quiet", "all-visible"],
};

export function StepRevealNumberedRail(vm: StepRevealVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">No steps to walk through yet.</p>
      </section>
    );
  }

  const railFill = vm.reducedMotion ? 1 : vm.progress;

  return (
    <section data-state={vm.state} className="@container py-8">
      <header className="max-w-2xl">
        {vm.eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {vm.eyebrow}
          </p>
        ) : null}
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground">
          {vm.headline}
        </h2>
        {vm.body ? <p className="mt-3 text-muted-foreground">{vm.body}</p> : null}
        {vm.positionLabel ? (
          <p className="mt-4 font-mono text-xs text-muted-foreground">{vm.positionLabel}</p>
        ) : null}
      </header>

      <div className="relative mt-10">
        {/* The spine. Its fill is the only thing that moves. */}
        <div aria-hidden className="absolute bottom-2 left-5 top-2 w-px bg-border">
          <div
            className="w-px bg-primary transition-[height] duration-300 ease-out"
            style={{ height: `${Math.round(railFill * 100)}%` }}
          />
        </div>

        <ol className="space-y-8 pl-16">
          {vm.steps.map((step, index) => {
            const marker = (
              <span
                aria-hidden
                className={cn(
                  // Sits in the gutter the list's pl-16 reserves, centred on the spine (left-5).
                  "absolute -left-16 top-0 flex size-10 items-center justify-center rounded-full border font-mono text-xs transition-colors duration-300",
                  step.position === "active" &&
                    "border-ring bg-primary text-primary-foreground",
                  step.position === "past" && "border-border bg-muted text-foreground",
                  step.position === "upcoming" &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {step.ordinal}
              </span>
            );

            const content = (
              <>
                <h3
                  className={cn(
                    "text-base font-medium transition-colors duration-300",
                    step.position === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.title}
                  {step.meta ? (
                    <span className="ml-3 font-mono text-xs font-normal text-muted-foreground">
                      {step.meta}
                    </span>
                  ) : null}
                </h3>
                <p
                  className={cn(
                    "mt-1 max-w-prose text-sm transition-opacity duration-300",
                    step.position === "active"
                      ? "text-muted-foreground opacity-100"
                      : "text-muted-foreground opacity-70",
                  )}
                >
                  {step.description}
                </p>
              </>
            );

            return (
              <li key={step.id} className="relative" data-position={step.position}>
                {vm.onSelectStep ? (
                  <button
                    type="button"
                    onClick={() => vm.onSelectStep?.(index)}
                    aria-current={step.position === "active"}
                    className="block w-full rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    {marker}
                    {content}
                  </button>
                ) : (
                  <div>
                    {marker}
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {vm.cta ? (
        <a
          href={vm.cta.href}
          onClick={vm.cta.onActivate}
          className="ml-16 mt-10 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {vm.cta.label} <span aria-hidden>→</span>
        </a>
      ) : null}
    </section>
  );
}

export default StepRevealNumberedRail;
