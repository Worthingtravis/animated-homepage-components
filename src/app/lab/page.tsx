import Link from "next/link";

import { allLeaves, allTrees } from "@/lib/forest";
import { FOREST } from "@/trees/generated";

export default function LabIndexPage() {
  const trees = allTrees(FOREST);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lab</h1>
        <p className="mt-2 text-muted-foreground">
          Pick a tree to drive every leaf on it through every fixture — no hooks, no network.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {trees.map((tree) => (
          <li key={tree.ref}>
            <Link
              href={`/lab/${tree.species}/${tree.key}`}
              className="block rounded-lg border border-border bg-card p-4 hover:border-ring"
            >
              <span className="font-medium text-foreground">{tree.meta.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">{tree.ref}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {allLeaves(tree).length} leaves · {Object.keys(tree.fixtures).length} fixtures
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
