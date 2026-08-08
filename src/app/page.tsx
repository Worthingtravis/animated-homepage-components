import { CuratedSurface } from "./curated-surface";
import { ForestIndexSection, ForestStatsSection } from "./site-sections";

/**
 * The front page — its own headline, and below it whatever shape the curator
 * left the `home` surface in. Uncurated, that is the stats row and the forest
 * index, rendered on the server exactly as they always were. Curated, the same
 * two sections come back behind tabs, alongside anything else that was dragged
 * in. Neither section knows which of those happened.
 */
export default function ForestPage() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-semibold text-foreground">Animated homepage components</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every component here is split the same way: a{" "}
          <strong className="text-foreground">tree</strong> owns the ViewModel contract, a{" "}
          <strong className="text-foreground">branch</strong> is an aesthetic direction, and a{" "}
          <strong className="text-foreground">leaf</strong> is one pure presentation component.
          Leaves on the same tree are drop-in interchangeable, because none of them own state.
        </p>
      </section>

      <CuratedSurface surface="home" heading="This page" ariaLabel="Home sections">
        <div className="space-y-10">
          <ForestStatsSection />
          <ForestIndexSection />
        </div>
      </CuratedSurface>
    </div>
  );
}
