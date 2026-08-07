import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Experimental (on Page Nav)
 *
 * Navs that detach. They leave the top edge as the page scrolls and become an
 * object floating over the content — more expressive, and more likely to
 * collide with whatever the page puts near its top.
 */
export const meta: BranchMeta = {
  label: "Experimental",
  description: "Detached navs. The bar leaves the edge and floats over the content.",
};

export default meta;
