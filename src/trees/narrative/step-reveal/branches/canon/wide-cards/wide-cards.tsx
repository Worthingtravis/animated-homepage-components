/**
 * Wide Cards — a leaf on Step Reveal / Canon.
 *
 * PURE PRESENTATION. Its props ARE StepRevealVM.
 * Structural answer: a horizontal band of cards where the active one takes the
 * space. Reads as a progress bar you can also read as content.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { StepRevealVM } from "../../../step-reveal.vm";

export const meta: LeafMeta = {
  label: "Wide Cards",
  description: "Horizontal band — the active card claims the width, the rest compress.",
  sizeHint: "md",
  tags: ["horizontal", "accordion"],
};

export function StepRevealWideCards(vm: StepRevealVM) {
  if (vm.state === "empty") {
    return (
      <section className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">No steps to walk through yet.</p>
      </section>
    );
  }

  return (
    <section data-state={vm.state} className="py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          {vm.eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {vm.eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground">
            {vm.headline}
          </h2>
          {vm.body ? <p className="mt-3 text-muted-foreground">{vm.body}</p> : null}
        </div>
        {vm.positionLabel ? (
          <p className="font-mono text-xs text-muted-foreground">{vm.positionLabel}</p>
        ) : null}
      </header>

      <ol className="mt-8 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        {vm.steps.map((step, index) => {
          const active = step.position === "active";
          const Wrapper = vm.onSelectStep ? "button" : "div";
          return (
            <li
              key={step.id}
              data-position={step.position}
              className={cn(
                "min-w-0 transition-[flex-grow] duration-500 ease-out",
                active ? "lg:grow-[3]" : "lg:grow",
              )}
              // Basis, not zero: below its basis the row wraps instead of crushing
              // every inactive card into a column of single words.
              style={{ flexBasis: active ? "20rem" : "11rem" }}
            >
              <Wrapper
                {...(vm.onSelectStep
                  ? {
                      type: "button" as const,
                      onClick: () => vm.onSelectStep?.(index),
                      "aria-current": active,
                    }
                  : {})}
                className={cn(
                  "flex h-full w-full flex-col rounded-xl border p-5 text-left transition-colors duration-300",
                  active ? "border-ring bg-card" : "border-border bg-card/60",
                  vm.onSelectStep &&
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={cn(
                      "font-mono text-xs",
                      step.position === "upcoming" ? "text-muted-foreground" : "text-primary",
                    )}
                  >
                    {step.ordinal}
                  </span>
                  {step.meta ? (
                    <span className="font-mono text-xs text-muted-foreground">{step.meta}</span>
                  ) : null}
                </div>

                <h3
                  className={cn(
                    "mt-3 text-base font-medium",
                    step.position === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.title}
                </h3>

                {/* Description belongs to the active card; the others stay a spine of titles. */}
                <p
                  className={cn(
                    "mt-2 text-sm text-muted-foreground transition-opacity duration-300",
                    active ? "opacity-100" : "opacity-0 lg:h-0 lg:overflow-hidden",
                  )}
                >
                  {step.description}
                </p>

                <div aria-hidden className="mt-auto pt-5">
                  <div className="h-0.5 w-full bg-border">
                    <div
                      className="h-0.5 bg-primary transition-[width] duration-200 ease-out"
                      style={{
                        width:
                          step.position === "past"
                            ? "100%"
                            : active
                              ? `${Math.round((vm.reducedMotion ? 1 : vm.stepProgress) * 100)}%`
                              : "0%",
                      }}
                    />
                  </div>
                </div>
              </Wrapper>
            </li>
          );
        })}
      </ol>

      {vm.cta ? (
        <a
          href={vm.cta.href}
          onClick={vm.cta.onActivate}
          className="mt-8 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {vm.cta.label}
        </a>
      ) : null}
    </section>
  );
}

export default StepRevealWideCards;
