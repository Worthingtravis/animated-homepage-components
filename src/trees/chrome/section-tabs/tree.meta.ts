import type { TreeMeta } from "@/lib/forest";

export const meta: TreeMeta = {
  label: "Section Tabs",
  description:
    "The organizing tree. It puts any other section behind a tab without that section learning anything — panel content is an opaque node, the chrome is a leaf, and the transition is a swappable pure function. Three axes that compose instead of one component with a style prop.",
  tags: ["tabs", "chrome", "layout", "organizer", "shadcn"],
};

export default meta;
