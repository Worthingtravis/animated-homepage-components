import type { TreeMeta } from "@/lib/forest";

export const meta: TreeMeta = {
  label: "Expandable Card",
  description:
    "A collection where pressing a card opens it into its own detail — the shared-element morph, without a layout library. The open state, the two measurements, escape, outside-click and the scroll lock all live in the container; the motion is a pure function of two rectangles; the leaf spreads finished styles and owns nothing.",
  tags: ["cards", "morph", "shared-element", "dialog", "disclosure", "flip"],
};

export default meta;
