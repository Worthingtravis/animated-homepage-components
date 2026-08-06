/**
 * Forest conformance — the guard that makes "ALWAYS conforms to extract-vm"
 * true by construction rather than by review.
 *
 * Every rule here maps to a phase of the extract-vm skill. If a leaf breaks one,
 * this file fails before the component ever reaches a page.
 */

import fs from "node:fs";
import path from "node:path";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { allLeaves, allTrees } from "@/lib/forest";

import { FOREST } from "./generated";

const TREES_DIR = path.join(process.cwd(), "src", "trees");

afterEach(cleanup);

type SourceFile = { rel: string; source: string };

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const ALL_FILES = fs.existsSync(TREES_DIR) ? walk(TREES_DIR) : [];

/**
 * Strip comments before scanning. The rules below are quoted verbatim in every
 * template's doc block — without this, a file would fail for *documenting* the
 * thing it must not do.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
}

function read(files: string[]): SourceFile[] {
  return files.map((file) => ({
    rel: path.relative(process.cwd(), file),
    source: stripComments(fs.readFileSync(file, "utf8")),
  }));
}

/** A leaf is any `.tsx` sitting inside `branches/<branch>/<leaf>/`, minus tests. */
const LEAF_SOURCES = read(
  ALL_FILES.filter(
    (file) =>
      file.includes(`${path.sep}branches${path.sep}`) &&
      file.endsWith(".tsx") &&
      !file.endsWith(".test.tsx"),
  ),
);

const trees = allTrees(FOREST);

describe("forest shape", () => {
  it("has at least one tree registered", () => {
    expect(trees.length).toBeGreaterThan(0);
  });

  it.each(trees.map((tree) => [tree.ref, tree] as const))(
    "%s has at least one leaf and a default fixture",
    (_ref, tree) => {
      expect(allLeaves(tree).length).toBeGreaterThan(0);
      expect(Object.keys(tree.fixtures).length).toBeGreaterThan(0);
      expect(tree.fixtures).toHaveProperty(tree.defaultFixture);
    },
  );

  it("has no duplicate leaf refs within a tree", () => {
    for (const tree of trees) {
      const refs = allLeaves(tree).map((leaf) => leaf.ref);
      expect(new Set(refs).size, `duplicate leaf ref in ${tree.ref}`).toBe(refs.length);
    }
  });
});

describe("leaf purity (extract-vm phase 4)", () => {
  it("finds leaf sources to check", () => {
    expect(LEAF_SOURCES.length).toBeGreaterThan(0);
  });

  const FORBIDDEN: Array<[RegExp, string]> = [
    [/\buseState\s*[(<]/, "useState — state belongs in the connected container"],
    [/\buseEffect\s*\(/, "useEffect — effects belong in the connected container"],
    [/\buseReducer\s*[(<]/, "useReducer — state belongs in the connected container"],
    [/\buseRef\s*[(<]/, "useRef — refs belong in the connected container"],
    [/\buseCallback\s*\(/, "useCallback — the VM supplies callbacks already"],
    [/\buseMemo\s*\(/, "useMemo — derive inline or pre-compute in the container"],
    [/\bfetch\s*\(/, "fetch — leaves never talk to the network"],
    [/\buse(SWR|Query|Mutation)\b/, "data hooks — leaves never fetch"],
    [/from\s+["']@\/hooks/, "hook import — leaves take everything through the VM"],
    [/<img\b/, "raw <img> — use next/image (LCP safety)"],
    [/\bdark:/, "`dark:` prefix — use semantic tokens that already theme"],
    [
      /\b(?:text|bg|border|ring|fill|stroke)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/,
      "hardcoded color — use semantic tokens (text-foreground, bg-card, …)",
    ],
    // Formatting the VM is banned; rounding a CSS transform is not. The rule
    // therefore targets values that came from the VM, not arithmetic in general.
    [
      /\bNumber\s*\(\s*vm\.|vm\.[A-Za-z0-9_.[\]]*\.to(?:Fixed|LocaleString)\s*\(/,
      "formatting a VM value — it must arrive pre-formatted from the container",
    ],
  ];

  it.each(LEAF_SOURCES.map((file) => [file.rel, file] as const))(
    "%s stays pure",
    (_rel, file) => {
      const violations = FORBIDDEN.filter(([pattern]) => pattern.test(file.source)).map(
        ([, reason]) => reason,
      );
      expect(violations, `${file.rel} violates extract-vm`).toEqual([]);
    },
  );

  it.each(LEAF_SOURCES.map((file) => [file.rel, file] as const))(
    "%s imports its VM type from the tree, not a sibling",
    (_rel, file) => {
      const importsVm = /import\s+type\s*\{[^}]*VM[^}]*\}\s*from\s*["']\.\.\/\.\.\/[^"']+\.vm["']/.test(
        file.source,
      );
      expect(importsVm, `${file.rel} must import its VM type from ../../<tree>.vm`).toBe(true);
    },
  );
});

describe("tree contracts (extract-vm phases 2, 3, 5)", () => {
  const vmFiles = read(ALL_FILES.filter((file) => file.endsWith(".vm.ts")));
  const fixtureFiles = read(ALL_FILES.filter((file) => file.endsWith(".fixtures.ts")));

  it.each(vmFiles.map((file) => [file.rel, file] as const))(
    "%s has no side effects",
    (_rel, file) => {
      expect(/\buse(State|Effect|Ref|Memo|Callback)\b/.test(file.source), file.rel).toBe(false);
      expect(/\bfetch\s*\(/.test(file.source), file.rel).toBe(false);
      expect(/\bwindow\./.test(file.source), file.rel).toBe(false);
    },
  );

  it.each(fixtureFiles.map((file) => [file.rel, file] as const))(
    "%s exports ALL_FIXTURES and DEFAULT_FIXTURE",
    (_rel, file) => {
      expect(/export const ALL_FIXTURES/.test(file.source), file.rel).toBe(true);
      expect(/export const DEFAULT_FIXTURE/.test(file.source), file.rel).toBe(true);
    },
  );
});

describe("every leaf survives every fixture", () => {
  const cases = trees.flatMap((tree) =>
    allLeaves(tree).flatMap((leaf) =>
      Object.entries(tree.fixtures).map(
        ([fixtureName, vm]) =>
          [`${tree.ref} · ${leaf.ref} · ${fixtureName}`, leaf, vm] as const,
      ),
    ),
  );

  it.each(cases)("%s", (_label, leaf, vm) => {
    const { Component } = leaf;
    const { container } = render(<Component {...(vm as object)} />);
    // A leaf may render nothing for a state, but it must never leak a broken
    // computed value into the DOM.
    expect(container.innerHTML).not.toContain("NaN");
    expect(container.innerHTML).not.toContain("undefined");
  });
});
