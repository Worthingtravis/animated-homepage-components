import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Experimental (on Pane Dock)
 *
 * Where the Canon constraint is dropped: a docked pane does NOT have to be
 * visible to be reachable. Everything here trades a click for the screen back,
 * which is the right trade on a single-job surface and the wrong one in a
 * workspace someone lives in all day.
 */
export const meta: BranchMeta = {
  label: "Experimental",
  description:
    "Reachability without visibility. Docked panes live behind a disclosure, so the dock's footprint stops growing with its contents.",
};

export default meta;
