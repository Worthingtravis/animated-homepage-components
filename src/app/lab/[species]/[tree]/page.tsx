import { notFound } from "next/navigation";

import { allTrees } from "@/lib/forest";
import { FOREST } from "@/trees/generated";

import { TreeLab } from "./tree-lab";

export function generateStaticParams() {
  return allTrees(FOREST).map((tree) => ({ species: tree.species, tree: tree.key }));
}

export default async function TreeLabPage({
  params,
}: {
  params: Promise<{ species: string; tree: string }>;
}) {
  const { species, tree } = await params;
  const exists = allTrees(FOREST).some((node) => node.species === species && node.key === tree);
  if (!exists) notFound();

  return <TreeLab species={species} treeKey={tree} />;
}
