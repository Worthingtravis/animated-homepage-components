import { notFound } from "next/navigation";

import { findTreeEntry, treeEntries } from "@/lib/site-nav";
import { FOREST } from "@/trees/generated";

import { Crumbs, SpeciesRail, TreeSteps } from "../../../forest-nav";
import { TreeLab } from "./tree-lab";

export function generateStaticParams() {
  return treeEntries(FOREST).map((tree) => ({ species: tree.speciesKey, tree: tree.key }));
}

/**
 * One tree.
 *
 * The lab itself is a client component — it drives fixtures and a clock. The
 * navigation around it is not: the trail, the species rail and the step links
 * are derived on the server from the forest, so the page knows where it is
 * before any JavaScript arrives.
 */
export default async function TreeLabPage({
  params,
}: {
  params: Promise<{ species: string; tree: string }>;
}) {
  const { species, tree } = await params;
  const entry = findTreeEntry(FOREST, species, tree);
  if (!entry) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Crumbs species={species} tree={tree} />
        <SpeciesRail current={species} />
      </div>

      <TreeLab species={species} treeKey={tree} />

      <TreeSteps species={species} tree={tree} />
    </div>
  );
}
