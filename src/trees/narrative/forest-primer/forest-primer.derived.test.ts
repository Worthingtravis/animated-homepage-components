/**
 * The primer's claims, checked against the repository it describes.
 *
 * This tree is the one component in the forest that is read as an assertion
 * ABOUT the forest, and every failure mode here is silent: a stale count, a
 * path that no longer exists, a transport row naming a tree somebody deleted.
 * Nothing crashes, the suite stays green, and the front page quietly lies. So
 * the claims are tests.
 */

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { EDITOR_MODE_PRESETS } from "@/lib/editor-mode-presets";
import { allLeaves, allTrees, forestStats } from "@/lib/forest";
import { FOREST } from "@/trees/generated";

import {
  buildChapters,
  resolveChapterCursor,
  summarizeForest,
  PRIMER_CHAPTER_COUNT,
  PRIMER_TRANSPORTS,
} from "./forest-primer.vm";

const summary = summarizeForest(FOREST, {
  preferred: { species: "narrative", tree: "forest-primer" },
  presetCount: Object.keys(EDITOR_MODE_PRESETS).length,
});

describe("the primer's numbers are the site's numbers", () => {
  it("counts what forestStats counts", () => {
    const stats = forestStats(FOREST);
    expect({
      species: summary.speciesCount,
      trees: summary.treeCount,
      branches: summary.branchCount,
      leaves: summary.leafCount,
    }).toEqual(stats);
  });

  /**
   * Chapter 5 claims a render count. That count is the conformance suite's own
   * first product, so it is derivable rather than quotable — and this is where
   * the two are pinned to each other.
   */
  it("claims the render count the conformance suite actually runs", () => {
    const cases = allTrees(FOREST).reduce(
      (total, tree) => total + allLeaves(tree).length * Object.keys(tree.fixtures).length,
      0,
    );
    expect(summary.bareRenderCount).toBe(cases);
  });

  it("claims the preset count editor mode actually ships", () => {
    expect(summary.presetCount).toBe(Object.keys(EDITOR_MODE_PRESETS).length);
  });
});

describe("the primer's example path is a real path", () => {
  it("points at a leaf folder that exists on disk", () => {
    expect(summary.example).not.toBeNull();
    const example = summary.example!;
    const dir = path.join(
      process.cwd(),
      "src",
      "trees",
      example.species,
      example.tree,
      "branches",
      example.branch,
      example.leaf,
    );
    expect(fs.existsSync(dir), dir).toBe(true);
  });
});

describe("chapter 3 names trees that exist", () => {
  const chapters = buildChapters(summary, resolveChapterCursor(1, PRIMER_CHAPTER_COUNT));
  const transport = chapters.find((chapter) => chapter.figure.kind === "transport")!;

  it("keeps every transport row it was given", () => {
    // A ref that stops resolving is dropped rather than rendered as a dead
    // link — which is the right behaviour and the wrong thing to discover in
    // production, so the list is asserted whole here.
    expect(transport.figure.kind).toBe("transport");
    if (transport.figure.kind !== "transport") return;
    expect(transport.figure.rows.map((row) => row.ref)).toEqual(
      PRIMER_TRANSPORTS.map((entry) => entry.ref),
    );
  });
});

describe("an empty forest", () => {
  const empty = summarizeForest([], { presetCount: 5 });
  const chapters = buildChapters(empty, resolveChapterCursor(0.5, PRIMER_CHAPTER_COUNT));

  it("still produces every chapter", () => {
    expect(chapters).toHaveLength(PRIMER_CHAPTER_COUNT);
  });

  it("falls back to a placeholder path rather than inventing one", () => {
    const nesting = chapters[0];
    expect(nesting.figure.kind).toBe("nesting");
    if (nesting.figure.kind !== "nesting") return;
    expect(nesting.figure.path).toBe("src/trees/<species>/<tree>/branches/<branch>/<leaf>/");
  });

  it("lists no transports it cannot resolve", () => {
    const transportChapter = chapters[2];
    if (transportChapter.figure.kind !== "transport") throw new Error("chapter 3 moved");
    expect(transportChapter.figure.rows).toEqual([]);
  });
});

describe("chapter position and progress are decided here, not in a leaf", () => {
  it("gives past chapters 1, upcoming chapters 0, and only the active one a fraction", () => {
    const cursor = resolveChapterCursor(0.42, PRIMER_CHAPTER_COUNT);
    const chapters = buildChapters(summary, cursor);
    expect(chapters.map((chapter) => chapter.position)).toEqual([
      "past",
      "past",
      "active",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(chapters.map((chapter) => chapter.progress).slice(0, 2)).toEqual([1, 1]);
    expect(chapters[2].progress).toBeGreaterThan(0);
    expect(chapters[2].progress).toBeLessThan(1);
    expect(chapters.slice(3).every((chapter) => chapter.progress === 0)).toBe(true);
  });
});
