import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Experimental (on Expandable Card)
 *
 * A branch is an aesthetic direction, not a data variation — every leaf here
 * still consumes ExpandableCardVM unchanged. If a "variant" needs different data,
 * it is a new TREE, not a new branch.
 */
export const meta: BranchMeta = {
  label: "Experimental",
  description:
    "Looks that bet on the media being good. Type rides on the picture and the panel takes the screen — more presence, less margin for a bad thumbnail.",
};

export default meta;
