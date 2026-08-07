import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Landing
 *
 * Trees that own the first screen. Their transport is an *entrance* — it runs
 * once, 0 → 1, and never loops, because a hero that keeps moving keeps pulling
 * the eye back after the visitor has already moved on. Leaves read `progress`
 * to stagger their arrival; they never read it to decide what exists.
 */
export const meta: SpeciesMeta = {
  label: "Landing",
  description:
    "Components that own the first screen. Transport is a one-shot entrance, not a loop.",
};

export default meta;
