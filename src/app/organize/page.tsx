import { Organizer } from "./organizer";

export const metadata = {
  title: "Organize · Animated Homepage Components",
  description:
    "Curate this site's shape. Drag any section in the forest — or one of this site's own — onto a tab, pick which page you are arranging, and that page rebuilds.",
};

export default function OrganizePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground">Organize</h1>
        <p className="max-w-3xl text-muted-foreground">
          This is where this site&rsquo;s shape lives. Pick a page, drag a section onto one of its
          tabs, and that page — <strong className="text-foreground">the real one</strong>, not a
          mock of it — comes back arranged that way. The section itself never changes, never
          learns it was tabularized, and never gains a prop.
        </p>
        <p className="max-w-3xl text-muted-foreground">
          The cards include this site&rsquo;s own parts as well as the forest&rsquo;s: the forest
          index, the stats row and the lab list are sections too, so arranging a page can never
          be a way to lose its navigation. Tab{" "}
          <strong className="text-foreground">chrome</strong> and panel{" "}
          <strong className="text-foreground">transition</strong> stay separate choices, per page.
          A page with nothing in any tab renders the design it shipped with.
        </p>
      </header>
      <Organizer />
    </div>
  );
}
