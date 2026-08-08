import { CuratedSurface } from "../curated-surface";
import { LabIndexSection } from "../site-sections";

/**
 * The lab's front door. Same arrangement as the home page: the heading is the
 * page's, the body is the `lab` surface — the tree list when nobody has touched
 * it, and whatever was arranged when somebody has. The tree list stays on the
 * shelf either way, so curating this page can never be a way to lose the only
 * route into a lab.
 */
export default function LabIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lab</h1>
        <p className="mt-2 text-muted-foreground">
          Pick a tree to drive every leaf on it through every fixture — no hooks, no network.
        </p>
      </div>

      <CuratedSurface surface="lab" heading="This page" ariaLabel="Lab sections">
        <LabIndexSection />
      </CuratedSurface>
    </div>
  );
}
