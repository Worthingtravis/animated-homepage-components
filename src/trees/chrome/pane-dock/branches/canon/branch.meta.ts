import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Canon (on Pane Dock)
 *
 * The three answers a product would actually ship, ordered by how much screen
 * they spend to keep a docked pane visible: `edge-strips` spends the most and
 * hides nothing, `one-rail` spends a fixed column, `door-row` spends one line.
 * All three keep every door in standing chrome — that is what makes them Canon,
 * and it is the axis `experimental/command-sheet` breaks.
 */
export const meta: BranchMeta = {
  label: "Canon",
  description:
    "Docked panes stay visible. The three leaves differ only in how much screen that visibility is allowed to cost — four edges, one rail, or one row.",
};

export default meta;
