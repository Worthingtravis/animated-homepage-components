import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Chrome
 *
 * Furniture that persists while the page scrolls under it — navs, footers,
 * banners. Its transport is *condensation*: `progress` runs 0..1 as the page
 * leaves the top, and a leaf reads it to shrink, tighten or detach. Nothing
 * here loops, and nothing here decides what exists from transport — a nav that
 * hides its links because you scrolled is a nav that stopped working.
 */
export const meta: SpeciesMeta = {
  label: "Chrome",
  description:
    "Persistent page furniture. Transport is condensation on scroll; content never depends on it.",
};

export default meta;
