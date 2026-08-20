/**
 * Orbit Glow — a leaf on Aurora Headline / Experimental.
 *
 * PURE PRESENTATION. Its props ARE AuroraHeadlineVM.
 * Loud take: an aurora blob orbits behind the type, chips ride the same angle.
 */

import type { LeafMeta } from "@/lib/forest";
import type { AuroraHeadlineVM } from "../../../aurora-headline.vm";

export const meta: LeafMeta = {
  label: "Orbit Glow",
  description: "An aurora blob orbits behind the type; chips ride the same angle.",
  sizeHint: "lg",
  tags: ["loud", "gradient"],
};

const TAU = Math.PI * 2;

export function AuroraHeadlineOrbitGlow(vm: AuroraHeadlineVM) {
  const angle = vm.reducedMotion ? 0 : vm.progress * TAU;
  const glowX = 50 + Math.cos(angle) * 24;
  const glowY = 50 + Math.sin(angle) * 18;

  if (vm.state === "empty") {
    return (
      <section className="@container grid min-h-64 place-items-center rounded-3xl bg-muted">
        <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
      </section>
    );
  }

  return (
    <section
      data-state={vm.state}
      className="@container relative isolate overflow-hidden rounded-3xl border border-border bg-card px-8 py-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 blur-2xl transition-[background] duration-300"
        style={{
          background: `radial-gradient(38rem 22rem at ${glowX}% ${glowY}%, var(--color-primary), transparent 65%),
                       radial-gradient(28rem 18rem at ${100 - glowX}% ${100 - glowY}%, var(--color-accent), transparent 70%)`,
        }}
      />

      {vm.eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {vm.eyebrow}
        </p>
      ) : null}

      <h2 className="mt-4 max-w-4xl text-balance text-5xl font-bold leading-[0.98] tracking-tight text-foreground">
        {vm.headline}
      </h2>

      {vm.body ? (
        <p className="mt-5 max-w-prose text-lg text-muted-foreground">{vm.body}</p>
      ) : null}

      {vm.items.length > 0 ? (
        <ul className="mt-10 flex flex-wrap gap-3">
          {vm.items.map((item, index) => {
            const phase = vm.reducedMotion ? 0 : Math.sin(angle + index * 0.6);
            return (
              <li
                key={item.id}
                className="rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-foreground backdrop-blur-sm"
                style={{ transform: `translateY(${(phase * 5).toFixed(2)}px)` }}
              >
                {item.detail ? (
                  <span className="mr-2 font-mono text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                ) : null}
                {item.label}
              </li>
            );
          })}
        </ul>
      ) : null}

      {vm.cta ? (
        <a
          href={vm.cta.href}
          onClick={vm.cta.onActivate}
          className="mt-10 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {vm.cta.label}
        </a>
      ) : null}
    </section>
  );
}

export default AuroraHeadlineOrbitGlow;
