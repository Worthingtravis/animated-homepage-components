import type { BranchMeta } from "@/lib/forest";

/**
 * Branch: Canon (on Clip Picker)
 *
 * All three keep the streamer's shelves and the search field on one surface and
 * put Send on the card. They differ only in which of the two ways in gets the
 * first screen: `one-column` gives it to the shelves and stacks everything
 * (phone-first), `shelf-rail` gives it to the shelves and spends horizontal room
 * on them (desktop-first), `quote-first` gives it to search and treats the
 * shelves as the fallback. That is a real product choice about who is arriving,
 * and it should be one prop.
 */
export const meta: BranchMeta = {
  label: "Canon",
  description:
    "Shelves and search on one surface, Send on the card. The three leaves differ only in which way in gets the first screen — and none of them ever asks you to look in two places.",
};

export default meta;
