import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Canon (on Expandable Card)
 *
 * A branch is an aesthetic direction, not a data variation — every leaf here
 * still consumes ExpandableCardVM unchanged. If a "variant" needs different data,
 * it is a new TREE, not a new branch.
 */
export const meta: BranchMeta = {
  label: "Canon",
  description:
    "Legible defaults. Media and type keep separate rooms, the card is a bordered surface, and the detail is readable before it is impressive.",
};

export default meta;
