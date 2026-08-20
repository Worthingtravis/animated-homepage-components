import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Commerce
 *
 * Surfaces where something can be bought. What separates them from every other
 * card in this forest is not the layout — it is that **most of what they
 * display is the result of arithmetic that must not happen in presentation**.
 * A price is minor units, a currency and a locale; a discount is two amounts
 * and a rounding rule; a rating is a mean and a decimal count. Get any of them
 * wrong in one variant and you have shipped two different claims about the
 * same product.
 *
 * So the rule that makes this species its own family: **no number crosses into
 * a leaf.** Money, percentages, counts and measurements arrive finished, from
 * one calculation, and a leaf's whole job is where to put them.
 *
 * Transport is a commit: `progress` runs 0..1 across one add-to-bag and settles
 * at 1. It does not loop.
 */
export const meta: SpeciesMeta = {
  label: "Commerce",
  description:
    "Something that can be bought. Every price, percentage and measurement arrives pre-formatted from one calculation — a leaf places money, it never computes it.",
};

export default meta;
