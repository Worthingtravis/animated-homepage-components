import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Disclosure
 *
 * Surfaces where one thing in a collection opens into more of itself, without
 * becoming a different page. The transport is an *opening*: `progress` runs
 * 0..1 across one expansion and settles at 1. It does not loop, it does not
 * follow the scroll, and it never decides what exists — a card that stops being
 * in the list because something opened is a list that broke.
 *
 * The rule that makes this species its own family: **the thing that opens and
 * the thing it opened from are the same data.** Two components showing the same
 * record is how the summary and the detail drift apart; here the panel is
 * handed the card, not a copy of it.
 */
export const meta: SpeciesMeta = {
  label: "Disclosure",
  description:
    "One item in a collection opens into more of itself. Transport is a single expansion, and the detail is the same record as the summary.",
};

export default meta;
