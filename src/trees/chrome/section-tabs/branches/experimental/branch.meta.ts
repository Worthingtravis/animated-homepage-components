import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Experimental (on Section Tabs)
 *
 * Chrome that trades a guarantee for presence. Leaves here reduce the standing
 * footprint of the tabs to almost nothing and pay for it somewhere — usually in
 * how much the visitor has to discover. They are real and they ship, but the
 * trade is stated in each leaf's header rather than hidden in it.
 */
export const meta: BranchMeta = {
  label: "Experimental",
  description:
    "Chrome that recedes. Minimal standing footprint, with the cost of that choice written down in the leaf.",
};

export default meta;
