import { ForestPrimerConnected } from "@/trees/narrative/forest-primer/forest-primer-connected";

import { ForestIndexSection, ForestStatsSection } from "./site-sections";

/**
 * The front page — the forest, by species.
 *
 * There is one shape for this page and it is derived: every species that exists
 * on disk, each with its trees. It used to be arrangeable, remembered per
 * browser; what that bought was the possibility of a visitor seeing a different
 * site from the one the repository describes.
 */
export default function ForestPage() {
  return (
    <div className="space-y-10">
      {/*
       * The paragraph that used to sit here said what chapter 1 of the primer
       * now draws — species, tree, branch, leaf, and why none of them own
       * state. Saying it twice is how the two copies start disagreeing. The
       * heading stays: a page needs an h1 whether or not the primer loaded.
       */}
      <h1 className="text-3xl font-semibold text-foreground">Animated homepage components</h1>

      <ForestPrimerConnected />

      <ForestStatsSection />
      <ForestIndexSection />
    </div>
  );
}
