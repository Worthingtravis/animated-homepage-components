import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Canon (on Section Tabs)
 *
 * Chrome you can point at. Every leaf here shows its tabs as persistent,
 * labelled controls that work with a pointer, a keyboard or a finger, with no
 * affordance that only exists on hover. These are the leaves a production page
 * can adopt without an accessibility conversation.
 */
export const meta: BranchMeta = {
  label: "Canon",
  description:
    "Persistent, labelled tab chrome — a track, a rail, a disclosure. Nothing here depends on hover to be usable.",
};

export default meta;
