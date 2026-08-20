import { notFound } from "next/navigation";

import { findSpeciesEntry, plural, speciesEntries } from "@/lib/site-nav";
import { FOREST } from "@/trees/generated";

import { Crumbs, SpeciesSteps, TreeGrid } from "../../forest-nav";
import { LabShell } from "../../page-shell";

/**
 * One species.
 *
 * The level that had no page. Species were already a real level of the
 * construct — a folder, a `species.meta.ts`, a sentence explaining what kind of
 * problem belongs to it — and were reachable only as a heading inside a longer
 * list. Now every level of the forest is addressable, which is what makes the
 * trail on a tree page true rather than decorative.
 */
export function generateStaticParams() {
  return speciesEntries(FOREST).map((species) => ({ species: species.key }));
}

export default async function SpeciesPage({ params }: { params: Promise<{ species: string }> }) {
  const { species } = await params;
  const entry = findSpeciesEntry(FOREST, species);
  if (!entry) notFound();

  return (
    <LabShell species={entry.key}>
      <div className="space-y-8">
        <header className="space-y-3">
          <Crumbs species={entry.key} />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{entry.label}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{entry.description}</p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              src/trees/{entry.key}/ · {plural(entry.treeCount, "tree")} ·{" "}
              {plural(entry.leafCount, "leaf", "leaves")}
            </p>
          </div>
        </header>

        <TreeGrid trees={entry.trees} />

        <SpeciesSteps species={entry.key} />
      </div>
    </LabShell>
  );
}
