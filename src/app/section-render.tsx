"use client";

/**
 * How a catalog section becomes pixels — the one place that resolves an id.
 *
 * Two renderers, one resolution. `SectionFull` is what a tab panel and an
 * uncurated page both use; `SectionPreview` is the same thing scaled down and
 * made inert for a drag card. Keeping them adjacent is deliberate: the
 * organizer's whole claim is that you are arranging the actual page, and that
 * claim only survives if the thumbnail and the result cannot drift apart.
 *
 * `pointer-events-none` on the preview matters more than it looks. A live
 * component inside a draggable card would otherwise eat the pointer-down that
 * starts the drag, so cards holding a button would be the ones you could not
 * pick up. `inert` is the same problem one input away: `aria-hidden` alone
 * still leaves every link and button inside a thumbnail in the tab order, so a
 * keyboard reaching the shelf would walk through several hundred controls that
 * are 22% of a pixel tall and announce nothing.
 */

import { findLeaf, findTree } from "@/lib/forest";
import type { CatalogSection } from "@/lib/section-catalog";
import { cn } from "@/lib/utils";
import { FOREST } from "@/trees/generated";

import { BUILTIN_SECTIONS } from "./site-sections";

/** The real thing at full size — what a tab's panel actually holds. */
export function SectionFull({ section }: { section: CatalogSection }) {
  if (section.kind === "builtin") {
    const Builtin = BUILTIN_SECTIONS[section.id];
    return Builtin ? <Builtin /> : null;
  }

  const tree = findTree(FOREST, section.species, section.tree);
  const leaf = tree ? findLeaf(tree, section.leafRef) : undefined;
  const vm = tree ? tree.fixtures[tree.defaultFixture] : undefined;
  if (!tree || !leaf || !vm) return null;
  const Component = leaf.Component;
  return <Component {...(vm as object)} />;
}

export function SectionPreview({
  section,
  className,
  scale = 0.3,
}: {
  section: CatalogSection;
  className?: string;
  scale?: number;
}) {
  const inversePercent = `${(100 / scale).toFixed(2)}%`;

  return (
    <div
      className={cn("pointer-events-none overflow-hidden rounded-lg bg-background/40", className)}
      aria-hidden
      inert
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: inversePercent,
        }}
      >
        <SectionFull section={section} />
      </div>
    </div>
  );
}
