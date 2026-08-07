import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Canon (on Page Nav)
 *
 * Navs that stay attached to the page. They condense in place — the bar's box
 * never leaves the top edge, so nothing below it shifts as you scroll.
 */
export const meta: BranchMeta = {
  label: "Canon",
  description: "Attached navs. They condense in place; the layout underneath never moves.",
};

export default meta;
