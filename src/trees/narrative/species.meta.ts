import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Narrative
 *
 * Trees defined by *sequence* rather than by a loop. Their transport is a
 * position in a story — the container resolves it into an active index and a
 * within-step fraction, so leaves never do index arithmetic.
 */
export const meta: SpeciesMeta = {
  label: "Narrative",
  description:
    "Components defined by sequence. Transport is a position in a story, resolved by the container.",
};

export default meta;
