#!/usr/bin/env node
/**
 * grow — the forest scaffolder.
 *
 *   pnpm plant   <species>/<tree>            plant a tree (new VM contract)
 *   pnpm branch  <species>/<tree>/<branch>   grow a branch (aesthetic direction)
 *   pnpm leaf    <species>/<tree>/<branch> <leaf>   open a leaf (one variant)
 *   pnpm species <species>                   start a new species (tree type)
 *   pnpm forest                              print the forest
 *   pnpm sync                                regenerate src/trees/generated.ts
 *
 * Everything it writes is extract-vm conformant on the first commit: the VM,
 * the fixtures and the container are physically outside the leaf folders, so a
 * leaf cannot own state even by accident.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertSlug,
  leafExportName,
  parseBranchRef,
  parseTreeRef,
  pascal,
  screaming,
  title,
} from "./naming.mjs";
import { sync } from "./sync.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const TEMPLATES = path.join(HERE, "templates");
const TREES = path.join(ROOT, "src", "trees");

const written = [];

function render(templateRelPath, tokens) {
  const raw = fs.readFileSync(path.join(TEMPLATES, templateRelPath), "utf8");
  return Object.entries(tokens).reduce(
    (acc, [key, value]) => acc.replaceAll(`__${key}__`, value),
    raw,
  );
}

function write(targetPath, contents, { force = false } = {}) {
  if (fs.existsSync(targetPath) && !force) {
    throw new Error(`Refusing to overwrite existing file: ${path.relative(ROOT, targetPath)}`);
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, contents);
  written.push(path.relative(ROOT, targetPath));
}

function tokensFor({ species, tree, branch, leaf }) {
  const tokens = {};
  if (species) {
    tokens.SPECIES = species;
    tokens.SPECIES_TITLE = title(species);
  }
  if (tree) {
    tokens.TREE = tree;
    tokens.TREE_PASCAL = pascal(tree);
    tokens.TREE_TITLE = title(tree);
    tokens.TREE_CONST = screaming(tree);
    tokens.VM_TYPE = `${pascal(tree)}VM`;
  }
  if (branch) {
    tokens.BRANCH = branch;
    tokens.BRANCH_PASCAL = pascal(branch);
    tokens.BRANCH_TITLE = title(branch);
  }
  if (leaf) {
    tokens.LEAF = leaf;
    tokens.LEAF_PASCAL = pascal(leaf);
    tokens.LEAF_TITLE = title(leaf);
    tokens.LEAF_EXPORT = leafExportName(tree, leaf);
  }
  return tokens;
}

/* ---------------------------------------------------------------- species */

function ensureSpecies(species) {
  const dir = path.join(TREES, species);
  const metaFile = path.join(dir, "species.meta.ts");
  if (fs.existsSync(metaFile)) return false;
  write(metaFile, render("species/species.meta.ts.tpl", tokensFor({ species })));
  return true;
}

function cmdSpecies(args) {
  const species = assertSlug("species", args[0]);
  if (!ensureSpecies(species)) {
    console.log(`Species "${species}" already exists.`);
    return;
  }
  console.log(`🌱 species "${species}" created.`);
}

/* ------------------------------------------------------------------ tree */

function cmdPlant(args) {
  const { species, tree } = parseTreeRef(args[0]);
  const bare = args.includes("--bare");
  const treeDir = path.join(TREES, species, tree);
  if (fs.existsSync(treeDir)) {
    throw new Error(`Tree "${species}/${tree}" is already planted.`);
  }

  ensureSpecies(species);
  const tokens = tokensFor({ species, tree });

  write(path.join(treeDir, "tree.meta.ts"), render("tree/tree.meta.ts.tpl", tokens));
  write(path.join(treeDir, `${tree}.vm.ts`), render("tree/vm.ts.tpl", tokens));
  write(path.join(treeDir, `${tree}.fixtures.ts`), render("tree/fixtures.ts.tpl", tokens));
  write(path.join(treeDir, `${tree}-connected.tsx`), render("tree/connected.tsx.tpl", tokens));

  if (!bare) {
    growBranch({ species, tree, branch: "canon" });
    openLeaf({ species, tree, branch: "canon", leaf: "baseline" });
  }

  console.log(`🌳 planted ${species}/${tree}`);
  report();
  console.log(`\nNext:\n  1. Shape the contract in src/trees/${species}/${tree}/${tree}.vm.ts`);
  console.log(`  2. Fill out the fixtures, then: pnpm leaf ${species}/${tree}/canon <leaf-name>`);
  console.log(`  3. See it: pnpm dev → /lab/${species}/${tree}`);
}

/* ---------------------------------------------------------------- branch */

function growBranch({ species, tree, branch }) {
  const treeDir = path.join(TREES, species, tree);
  if (!fs.existsSync(treeDir)) {
    throw new Error(`No such tree "${species}/${tree}". Plant it first: pnpm plant ${species}/${tree}`);
  }
  const branchDir = path.join(treeDir, "branches", branch);
  if (fs.existsSync(branchDir)) {
    throw new Error(`Branch "${species}/${tree}/${branch}" already exists.`);
  }
  write(
    path.join(branchDir, "branch.meta.ts"),
    render("branch/branch.meta.ts.tpl", tokensFor({ species, tree, branch })),
  );
}

function cmdBranch(args) {
  // Accept both `<species>/<tree>/<branch>` and `<species>/<tree> <branch>`.
  const ref = args[1] ? `${args[0]}/${args[1]}` : args[0];
  const parsed = parseBranchRef(ref);
  growBranch(parsed);
  console.log(`🌿 grew branch ${parsed.species}/${parsed.tree}/${parsed.branch}`);
  report();
  console.log(`\nNext: pnpm leaf ${parsed.species}/${parsed.tree}/${parsed.branch} <leaf-name>`);
}

/* ------------------------------------------------------------------ leaf */

function openLeaf({ species, tree, branch, leaf }) {
  const branchDir = path.join(TREES, species, tree, "branches", branch);
  if (!fs.existsSync(branchDir)) {
    throw new Error(
      `No such branch "${species}/${tree}/${branch}". Grow it first: pnpm branch ${species}/${tree}/${branch}`,
    );
  }
  const leafDir = path.join(branchDir, leaf);
  if (fs.existsSync(leafDir)) {
    throw new Error(`Leaf "${species}/${tree}/${branch}/${leaf}" already exists.`);
  }
  const tokens = tokensFor({ species, tree, branch, leaf });
  write(path.join(leafDir, `${leaf}.tsx`), render("leaf/leaf.tsx.tpl", tokens));
  write(path.join(leafDir, `${leaf}.test.tsx`), render("leaf/leaf.test.tsx.tpl", tokens));
}

function cmdLeaf(args) {
  if (args.length < 2) {
    throw new Error("Expected: pnpm leaf <species>/<tree>/<branch> <leaf>");
  }
  const parsed = parseBranchRef(args[0]);
  const leaf = assertSlug("leaf", args[1]);
  openLeaf({ ...parsed, leaf });
  console.log(`🍃 opened leaf ${parsed.species}/${parsed.tree}/${parsed.branch}/${leaf}`);
  report();
  console.log(
    `\nNext: style it in src/trees/${parsed.species}/${parsed.tree}/branches/${parsed.branch}/${leaf}/${leaf}.tsx`,
  );
  console.log(`      compare it at /lab/${parsed.species}/${parsed.tree}`);
}

/* ---------------------------------------------------------------- forest */

function cmdForest() {
  const { forest, problems } = sync(ROOT, { quiet: true });
  if (!forest.length) {
    console.log("The forest is empty. Plant something:  pnpm plant motion/aurora-headline");
    return;
  }
  for (const species of forest) {
    console.log(`\n${species.key}/`);
    for (const tree of species.trees) {
      console.log(`  🌳 ${tree.key}`);
      for (const branch of tree.branches) {
        console.log(`     🌿 ${branch.key}`);
        for (const leaf of branch.leaves) {
          console.log(`        🍃 ${leaf.key}  →  <${leaf.exportName} />`);
        }
      }
    }
  }
  if (problems.length) {
    console.log("\nProblems:");
    for (const problem of problems) console.log(`  ⚠ ${problem}`);
  }
}

function report() {
  sync(ROOT, { quiet: true });
  if (written.length) {
    console.log(written.map((file) => `   + ${file}`).join("\n"));
  }
}

/* ------------------------------------------------------------------ main */

const USAGE = `grow — scaffold extract-vm conformant components

  pnpm plant   <species>/<tree> [--bare]   plant a tree (VM + fixtures + container)
  pnpm branch  <species>/<tree>/<branch>   grow a branch (aesthetic direction)
  pnpm leaf    <species>/<tree>/<branch> <leaf>   open a leaf (one pure variant)
  pnpm species <species>                   start a new species
  pnpm forest                              print the forest
  pnpm sync                                regenerate src/trees/generated.ts
`;

const [command, ...args] = process.argv.slice(2);

try {
  switch (command) {
    case "plant":
      cmdPlant(args);
      break;
    case "branch":
      cmdBranch(args);
      break;
    case "leaf":
      cmdLeaf(args);
      break;
    case "species":
      cmdSpecies(args);
      break;
    case "forest":
      cmdForest();
      break;
    case "sync":
      sync(ROOT);
      break;
    default:
      console.log(USAGE);
      process.exit(command ? 1 : 0);
  }
} catch (error) {
  console.error(`\n✗ ${error.message}\n`);
  process.exit(1);
}
