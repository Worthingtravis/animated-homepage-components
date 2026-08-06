import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Motion
 *
 * Trees whose whole reason to exist is movement — the component would be a
 * different component standing still. Their VMs always carry transport
 * (`progress`) and a `reducedMotion` flag.
 */
export const meta: SpeciesMeta = {
  label: "Motion",
  description:
    "Components defined by their movement. Transport lives in the VM; the container owns the clock.",
};

export default meta;
