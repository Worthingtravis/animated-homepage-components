/**
 * Stacked Rule — a leaf on Aurora Headline / Canon.
 *
 * PURE PRESENTATION. Its props ARE AuroraHeadlineVM.
 * Editorial take: type stacked against a rule that fills with transport.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { AuroraHeadlineVM } from "../../../aurora-headline.vm";

export const meta: LeafMeta = {
  label: "Stacked Rule",
  description: "Editorial stack — the rule under the eyebrow fills as transport advances.",
  sizeHint: "md",
  tags: ["editorial", "quiet"],
};

export function AuroraHeadlineStackedRule(vm: AuroraHeadlineVM) {
  // Reduced motion pins the rule full rather than freezing it mid-sweep.
  const fill = vm.reducedMotion ? 1 : vm.progress;

  if (vm.state === "empty") {
    return (
      <section className="rounded-none border-t border-border py-12">
        <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
      </section>
    );
  }

  return (
    <section data-state={vm.state} className="border-t border-border py-10">
      <div className="flex items-baseline gap-4">
        {vm.eyebrow ? (
          <p className="shrink-0 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {vm.eyebrow}
          </p>
        ) : null}
        <div className="h-px flex-1 bg-border">
          <div
            className="h-px bg-primary transition-[width] duration-200 ease-out"
            style={{ width: `${Math.round(fill * 100)}%` }}
          />
        </div>
      </div>

      <h2 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground">
        {vm.headline}
      </h2>

      {vm.body ? <p className="mt-4 max-w-prose text-muted-foreground">{vm.body}</p> : null}

      {vm.items.length > 0 ? (
        <ol className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
          {vm.items.map((item, index) => {
            const active = !vm.reducedMotion && Math.floor(fill * vm.items.length) === index;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-baseline gap-3 bg-card px-4 py-3 transition-colors duration-300",
                  active && "bg-muted",
                )}
              >
                {item.detail ? (
                  <span className="font-mono text-xs text-muted-foreground">{item.detail}</span>
                ) : null}
                <span className="text-sm text-foreground">{item.label}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {vm.cta ? (
        <a
          href={vm.cta.href}
          onClick={vm.cta.onActivate}
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {vm.cta.label} <span aria-hidden>→</span>
        </a>
      ) : null}
    </section>
  );
}

export default AuroraHeadlineStackedRule;
