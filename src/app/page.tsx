import Link from "next/link";

import { allLeaves, forestStats } from "@/lib/forest";
import { FOREST } from "@/trees/generated";

export default function ForestPage() {
  const stats = forestStats(FOREST);

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
        <dl className="mt-6 flex flex-wrap gap-6 text-sm">
          {(
            [
              ["species", stats.species],
              ["trees", stats.trees],
              ["branches", stats.branches],
              ["leaves", stats.leaves],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {FOREST.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          The forest is empty. Plant a tree: <code>pnpm plant motion/aurora-headline</code>
        </p>
      ) : null}

      {FOREST.map((species) => (
        <section key={species.key} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{species.meta.label}</h2>
            <p className="text-sm text-muted-foreground">{species.meta.description}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {species.trees.map((tree) => (
              <li key={tree.ref} className="rounded-xl border border-border bg-card p-5">
                <Link href={`/lab/${tree.species}/${tree.key}`} className="group">
                  <h3 className="font-medium text-foreground group-hover:text-primary">
                    🌳 {tree.meta.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tree.meta.description}</p>
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  {tree.branches.length} branches · {allLeaves(tree).length} leaves ·{" "}
                  {Object.keys(tree.fixtures).length} fixtures
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
