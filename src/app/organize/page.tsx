import { Organizer } from "./organizer";

export const metadata = {
  title: "Organize · Animated Homepage Components",
  description:
    "Drag any section in the forest onto a tab. Swap the tab chrome and the transition independently, and watch the real page rebuild underneath.",
};

export default function OrganizePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground">Organize</h1>
        <p className="max-w-3xl text-muted-foreground">
          Every leaf in the forest is a card below. Drag one onto a tab and it moves behind that
          tab — the section itself never changes, never learns it was tabularized, and never gains
          a prop. Tab <strong className="text-foreground">chrome</strong> and panel{" "}
          <strong className="text-foreground">transition</strong> are separate choices, so you can
          change either one without touching the other or the sections.
        </p>
      </header>
      <Organizer />
    </div>
  );
}
