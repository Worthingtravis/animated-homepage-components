"use client";

/**
 * A live thumbnail of one catalog section.
 *
 * It renders the real leaf with its tree's real default fixture, scaled down
 * and made inert. Not a screenshot and not a name in a box: the organizer's
 * whole claim is that you are arranging the actual page, and a palette of
 * placeholder rectangles would quietly make that untrue.
 *
 * `pointer-events-none` matters more than it looks. A live component inside a
 * draggable card would otherwise eat the pointer-down that starts the drag, so
 * cards holding a button would be the ones you could not pick up.
 */

import { findLeaf, findTree } from "@/lib/forest";
import type { CatalogSection } from "@/lib/section-catalog";
import { cn } from "@/lib/utils";
import { FOREST } from "@/trees/generated";

export function SectionPreview({
  section,
  className,
  scale = 0.3,
}: {
  section: CatalogSection;
  className?: string;
  scale?: number;
}) {
  const tree = findTree(FOREST, section.species, section.tree);
  const leaf = tree ? findLeaf(tree, section.leafRef) : undefined;
  const vm = tree ? tree.fixtures[tree.defaultFixture] : undefined;

  if (!tree || !leaf || !vm) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border p-3", className)}>
        <p className="text-xs text-muted-foreground">Preview unavailable</p>
      </div>
    );
  }

  const Component = leaf.Component;
  const inversePercent = `${(100 / scale).toFixed(2)}%`;

  return (
    <div
      className={cn("pointer-events-none overflow-hidden rounded-lg bg-background/40", className)}
      aria-hidden
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: inversePercent,
        }}
      >
        <Component {...(vm as object)} />
      </div>
    </div>
  );
}

/** The same leaf at full size — what a tab's panel actually holds. */
export function SectionFull({ section }: { section: CatalogSection }) {
  const tree = findTree(FOREST, section.species, section.tree);
  const leaf = tree ? findLeaf(tree, section.leafRef) : undefined;
  const vm = tree ? tree.fixtures[tree.defaultFixture] : undefined;
  if (!tree || !leaf || !vm) return null;
  const Component = leaf.Component;
  return <Component {...(vm as object)} />;
}
