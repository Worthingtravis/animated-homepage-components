import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Canon (on Product Card)
 *
 * A branch is an aesthetic direction, not a data variation — every leaf here
 * still consumes ProductCardVM unchanged. If a "variant" needs different data,
 * it is a new TREE, not a new branch.
 */
export const meta: BranchMeta = {
  label: "Canon",
  description:
    "Soft retail. A pale inset panel for the photograph, rounded chips for the facts, and the price sitting on the same line as the name where a shopper's eye already is.",
};

export default meta;
