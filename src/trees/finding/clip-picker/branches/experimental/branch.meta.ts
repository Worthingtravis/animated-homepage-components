import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Experimental (on Clip Picker)
 *
 * One clip at a time. Where Canon asks "which of these?", this asks "this one?"
 * — a different question with a different failure mode, and worth having on the
 * same VM so the trade is visible rather than argued about.
 */
export const meta: BranchMeta = {
  label: "Experimental",
  description:
    "Choosing without comparing. One card at a time, the whole screen, Send or next — for the visitor who will bounce before they finish reading a grid.",
};

export default meta;
