import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Experimental (on Product Card)
 *
 * Looks that answer the same contract by rearranging what a card is, rather
 * than restyling it. Still ProductCardVM, unchanged.
 */
export const meta: BranchMeta = {
  label: "Experimental",
  description:
    "The photograph is the card. Type sits on top of it and the commit is the whole bottom edge.",
};

export default meta;
