import type { TreeMeta } from "@/lib/forest";

export const meta: TreeMeta = {
  label: "Countdown",
  description:
    "Time remaining until a fixed instant. The container owns the tick and splits the clock; leaves render padded strings and an explicit state — including the honest 'there is no deadline' one.",
  tags: ["countdown", "timer", "deadline", "clock"],
};

export default meta;
