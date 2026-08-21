/**
 * Baseline — a leaf on Aurora Headline / Canon.
 *
 * PURE PRESENTATION. Its props ARE AuroraHeadlineVM.
 *  - no useState / useEffect / useMemo / useCallback / useRef
 *  - no fetch, no server actions, no imports from any hook or client
 *  - no hardcoded colors and no `dark:` prefixes — semantic tokens only
 *  - no raw <img> — use next/image
 *  - honour `vm.reducedMotion`: when true, render the resting frame
 *
 * Deriving values from `vm.progress` inline is fine — that is presentation,
 * not business logic.
 */

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type { AuroraHeadlineVM } from "../../../aurora-headline.vm";

export const meta: LeafMeta = {
  label: "Baseline",
  description: "TODO: describe this leaf's look in one line.",
  sizeHint: "md",
  tags: [],
};

export function AuroraHeadlineBaseline(vm: AuroraHeadlineVM) {
  const drift = vm.reducedMotion ? 0 : Math.sin(vm.progress * Math.PI * 2) * 6;

  if (vm.state === "empty") {
    return (
      <section className="@container flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8">
        <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
      </section>
    );
  }

  return (
    <section
      data-state={vm.state}
      className="@container relative overflow-hidden rounded-xl border border-border bg-card p-8"
    >
      {vm.eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {vm.eyebrow}
        </p>
      ) : null}

      <h2
        className="mt-3 text-balance text-3xl font-semibold text-foreground transition-transform duration-500"
        style={{ transform: `translateY(${drift}px)` }}
      >
        {vm.headline}
      </h2>

      {vm.body ? <p className="mt-3 max-w-prose text-muted-foreground">{vm.body}</p> : null}

      <ul className="mt-6 flex flex-wrap gap-2">
        {vm.items.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              "rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-foreground",
              "transition-opacity duration-300",
            )}
            style={{
              opacity: vm.reducedMotion
                ? 1
                : 0.45 + 0.55 * Math.abs(Math.cos((vm.progress * Math.PI * 2) + index)),
            }}
          >
            <span className="font-medium">{item.label}</span>
            {item.detail ? (
              <span className="ml-2 text-muted-foreground">{item.detail}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {vm.cta ? (
        <a
          href={vm.cta.href}
          onClick={vm.cta.onActivate}
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {vm.cta.label}
        </a>
      ) : null}
    </section>
  );
}

export default AuroraHeadlineBaseline;
