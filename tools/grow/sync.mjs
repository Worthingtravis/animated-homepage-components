/**
 * Rebuild `src/trees/generated.ts` by walking the forest on disk.
 *
 * The filesystem is the source of truth — there is no hand-maintained registry
 * to drift. Any species/tree/branch/leaf that is laid out correctly is picked
 * up; anything malformed is reported instead of silently dropped.
 */

import fs from "node:fs";
import path from "node:path";

import { camel, leafExportName, pascal, title } from "./naming.mjs";

const IGNORED = new Set(["node_modules", ".next", "__snapshots__"]);

function dirs(target) {
  if (!fs.existsSync(target)) return [];
  return fs
    .readdirSync(target, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && !IGNORED.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}

/** Walk the forest. Returns `{ forest, problems }`. */
export function scanForest(root) {
  const treesRoot = path.join(root, "src", "trees");
  const problems = [];
  const forest = [];

  for (const species of dirs(treesRoot)) {
    const speciesDir = path.join(treesRoot, species);
    if (!fs.existsSync(path.join(speciesDir, "species.meta.ts"))) {
      problems.push(`species "${species}" is missing species.meta.ts`);
      continue;
    }

    const trees = [];
    for (const tree of dirs(speciesDir)) {
      const treeDir = path.join(speciesDir, tree);
      const required = [
        `${tree}.vm.ts`,
        `${tree}.fixtures.ts`,
        `${tree}-connected.tsx`,
        "tree.meta.ts",
      ];
      const missing = required.filter((file) => !fs.existsSync(path.join(treeDir, file)));
      if (missing.length) {
        problems.push(`tree "${species}/${tree}" is missing: ${missing.join(", ")}`);
        continue;
      }

      const branches = [];
      const branchesDir = path.join(treeDir, "branches");
      for (const branch of dirs(branchesDir)) {
        const branchDir = path.join(branchesDir, branch);
        if (!fs.existsSync(path.join(branchDir, "branch.meta.ts"))) {
          problems.push(`branch "${species}/${tree}/${branch}" is missing branch.meta.ts`);
          continue;
        }
        const leaves = [];
        for (const leaf of dirs(branchDir)) {
          if (!fs.existsSync(path.join(branchDir, leaf, `${leaf}.tsx`))) {
            problems.push(`leaf "${species}/${tree}/${branch}/${leaf}" is missing ${leaf}.tsx`);
            continue;
          }
          leaves.push({ key: leaf, exportName: leafExportName(tree, leaf) });
        }
        if (!leaves.length) {
          problems.push(`branch "${species}/${tree}/${branch}" has no leaves yet`);
        }
        branches.push({ key: branch, leaves });
      }

      if (!branches.length) {
        problems.push(`tree "${species}/${tree}" has no branches yet`);
      }
      trees.push({ key: tree, branches });
    }

    forest.push({ key: species, trees });
  }

  return { forest, problems };
}

function renderGenerated(forest) {
  const imports = [];
  const speciesEntries = [];

  for (const species of forest) {
    const sVar = `species_${camel(species.key)}`;
    imports.push(`import { meta as ${sVar}Meta } from "./${species.key}/species.meta";`);

    const treeEntries = [];
    for (const tree of species.trees) {
      const tVar = `${camel(species.key)}_${camel(tree.key)}`;
      const base = `./${species.key}/${tree.key}`;
      imports.push(`import { meta as ${tVar}Meta } from "${base}/tree.meta";`);
      imports.push(`import * as ${tVar}Fixtures from "${base}/${tree.key}.fixtures";`);

      const branchEntries = [];
      for (const branch of tree.branches) {
        const bVar = `${tVar}_${camel(branch.key)}`;
        imports.push(`import { meta as ${bVar}Meta } from "${base}/branches/${branch.key}/branch.meta";`);

        const leafEntries = [];
        for (const leaf of branch.leaves) {
          const lVar = `${bVar}_${camel(leaf.key)}`;
          const leafPath = `${base}/branches/${branch.key}/${leaf.key}/${leaf.key}`;
          imports.push(
            `import { ${leaf.exportName} as ${lVar}, meta as ${lVar}Meta } from "${leafPath}";`,
          );
          leafEntries.push(
            `        {
          key: ${JSON.stringify(leaf.key)},
          ref: ${JSON.stringify(`${branch.key}/${leaf.key}`)},
          meta: ${lVar}Meta,
          Component: ${lVar} as ForestComponent,
        },`,
          );
        }

        branchEntries.push(
          `      {
        key: ${JSON.stringify(branch.key)},
        meta: ${bVar}Meta,
        leaves: [
${leafEntries.join("\n")}
        ],
      },`,
        );
      }

      treeEntries.push(
        `    {
      key: ${JSON.stringify(tree.key)},
      species: ${JSON.stringify(species.key)},
      ref: ${JSON.stringify(`${species.key}/${tree.key}`)},
      meta: ${tVar}Meta,
      fixtures: ${tVar}Fixtures.ALL_FIXTURES as Record<string, unknown>,
      defaultFixture: ${tVar}Fixtures.DEFAULT_FIXTURE as string,
      branches: [
${branchEntries.join("\n")}
      ],
    },`,
      );
    }

    speciesEntries.push(
      `  {
    key: ${JSON.stringify(species.key)},
    meta: ${sVar}Meta,
    trees: [
${treeEntries.join("\n")}
    ],
  },`,
    );
  }

  return `// GENERATED BY \`pnpm sync\` — DO NOT EDIT.
// Source of truth is the folder layout under src/trees/.
// Regenerate with: pnpm sync

import type { ForestComponent, SpeciesNode } from "@/lib/forest";

${imports.join("\n")}

export const FOREST: SpeciesNode[] = [
${speciesEntries.join("\n")}
];

export default FOREST;
`;
}

const EMPTY_GENERATED = `// GENERATED BY \`pnpm sync\` — DO NOT EDIT.
// The forest is empty. Plant a tree:  pnpm plant <species>/<tree>

import type { SpeciesNode } from "@/lib/forest";

export const FOREST: SpeciesNode[] = [];

export default FOREST;
`;

export function sync(root, { quiet = false } = {}) {
  const { forest, problems } = scanForest(root);
  const planted = forest.flatMap((s) => s.trees);
  const contents = planted.length ? renderGenerated(forest) : EMPTY_GENERATED;
  const outFile = path.join(root, "src", "trees", "generated.ts");

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const previous = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : null;
  if (previous !== contents) fs.writeFileSync(outFile, contents);

  if (!quiet) {
    const leaves = planted.flatMap((t) => t.branches.flatMap((b) => b.leaves)).length;
    const branches = planted.flatMap((t) => t.branches).length;
    console.log(
      `🌲 synced ${forest.length} species · ${planted.length} trees · ${branches} branches · ${leaves} leaves`,
    );
    for (const problem of problems) console.warn(`   ⚠ ${problem}`);
  }

  return { forest, problems };
}

export { pascal, title };
