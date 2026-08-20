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

      <ForestStatsSection />
      <ForestIndexSection />
    </div>
  );
}
