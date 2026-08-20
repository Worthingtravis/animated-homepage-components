import { Crumbs, SpeciesRail } from "../forest-nav";
import { ForestIndexSection } from "../site-sections";

/**
 * The lab's front door: every tree, grouped by the species it belongs to.
 *
 * The rail above is the forest's own top level, and it is the same rail on
 * every page below this one — so wherever you are in the lab, one press reaches
 * any species.
 */
export default function LabIndexPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Crumbs />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lab</h1>
          <p className="mt-2 text-muted-foreground">
            Pick a tree to drive every leaf on it through every fixture — no hooks, no network.
          </p>
        </div>
        <SpeciesRail />
      </header>

      <ForestIndexSection />
    </div>
  );
}
