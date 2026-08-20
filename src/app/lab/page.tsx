import { Crumbs } from "../forest-nav";
import { LabShell } from "../page-shell";
import { ForestIndexSection } from "../site-sections";

/**
 * The lab's front door: every tree, grouped by the species it belongs to.
 *
 * The rail beside it is the forest's own two top levels, and it is the same
 * rail on every page below this one — so wherever you are in the lab, one press
 * reaches any tree.
 */
export default function LabIndexPage() {
  return (
    <LabShell>
      <div className="space-y-8">
        <header className="space-y-3">
          <Crumbs />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lab</h1>
            <p className="mt-2 text-muted-foreground">
              Pick a tree to drive every leaf on it through every fixture — no hooks, no network.
            </p>
          </div>
        </header>

        <ForestIndexSection />
      </div>
    </LabShell>
  );
}
