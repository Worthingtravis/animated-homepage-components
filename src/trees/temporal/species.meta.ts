import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Temporal
 *
 * Trees whose subject is time itself. Their transport is *depletion* — it runs
 * 0 → 1 toward a fixed instant and then stops, which is what separates them
 * from `motion` (a loop), `landing` (a one-shot entrance) and `narrative` (a
 * position in a sequence).
 *
 * The rule that makes these safe: **the container counts, the leaf reads.** A
 * leaf never sees a `Date`, an epoch or a millisecond remainder — it sees
 * padded strings that the container already split, and a `state` that already
 * decided whether the moment has passed. That is what keeps a browser clock
 * from ever disagreeing with the server instant that chose the deadline.
 */
export const meta: SpeciesMeta = {
  label: "Temporal",
  description:
    "Components whose subject is time. Transport is depletion toward a deadline; the container counts, the leaf reads.",
};

export default meta;
