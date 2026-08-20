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
import { measureProgress } from "./forest-primer-connected";

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

/* ------------------------------------------------------------------ *
 * Scroll transport.
 * ------------------------------------------------------------------ */

describe("measureProgress", () => {
  const VIEWPORT = 900;
  const LINE = VIEWPORT * 0.55;
  const HEIGHT = 4000;
  /** Where chapter `index` of six starts, as a fraction of the primer. */
  const chapterStart = (index: number) => index / PRIMER_CHAPTER_COUNT;

  it("is 0 until the primer's top reaches the reading line", () => {
    expect(measureProgress({ top: LINE, height: HEIGHT }, VIEWPORT)).toBe(0);
    expect(measureProgress({ top: VIEWPORT, height: HEIGHT }, VIEWPORT)).toBe(0);
  });

  /**
   * The bug this replaces. The primer sits near the top of `/`, so a reader who
   * has not scrolled is already looking at chapter 1 — it must be arriving, not
   * waiting, and it must not be some later chapter either.
   */
  it("opens inside chapter 1 for a primer at the top of the document", () => {
    const progress = measureProgress({ top: 96, height: HEIGHT }, VIEWPORT);
    expect(progress).toBeGreaterThan(0);
    expect(resolveChapterCursor(progress, PRIMER_CHAPTER_COUNT).activeIndex).toBe(0);
  });

  it("advances as the page scrolls", () => {
    const first = measureProgress({ top: 96 - 400, height: HEIGHT }, VIEWPORT);
    const later = measureProgress({ top: 96 - 1200, height: HEIGHT }, VIEWPORT);
    expect(first).toBeGreaterThan(0);
    expect(later).toBeGreaterThan(first);
  });

  /**
   * The whole point of the reading line: a chapter is active WHILE it is being
   * read, not a screen after. Put each chapter's own top on the line and the
   * cursor must name that chapter — which it cannot do if progress is measured
   * against the element entering and leaving the viewport instead.
   */
  it("makes the chapter under the reading line the active one", () => {
    for (let index = 0; index < PRIMER_CHAPTER_COUNT; index += 1) {
      // Sample just inside the chapter, so a boundary does not decide the test.
      const into = (chapterStart(index) + 0.5 / PRIMER_CHAPTER_COUNT) * HEIGHT;
      const progress = measureProgress({ top: LINE - into, height: HEIGHT }, VIEWPORT);
      expect(
        resolveChapterCursor(progress, PRIMER_CHAPTER_COUNT).activeIndex,
        `chapter ${index + 1} under the reading line`,
      ).toBe(index);
    }
  });

  /* ---------------------------------------------------------------- *
   * Measured against the chapters themselves.
   * ---------------------------------------------------------------- */

  /** Six chapters laid out as a column, the fifth as oversized as the real one. */
  const column = (offset: number, heights: number[]) => {
    let top = offset;
    return heights.map((height) => {
      const extent = { top, bottom: top + height };
      top += height;
      return extent;
    });
  };
  const HEIGHTS = [520, 550, 510, 490, 1400, 290];
  const HOST = { top: 0, height: HEIGHTS.reduce((a, b) => a + b, 0) };

  it("keeps a chapter active for the whole of its own height, not its share of the total", () => {
    // The drift this replaces: chapter 5 is nearly three times the average, so
    // a fraction-of-total cursor finished it and moved to 6 while the reader
    // was still in the middle of it.
    const chapters = column(-2000, HEIGHTS);
    const fifth = chapters[4];
    for (const line of [fifth.top + 20, (fifth.top + fifth.bottom) / 2, fifth.bottom - 20]) {
      const viewport = line / 0.55;
      const progress = measureProgress(HOST, viewport, chapters);
      expect(
        resolveChapterCursor(progress, PRIMER_CHAPTER_COUNT).activeIndex,
        `reading line at ${Math.round(line)}`,
      ).toBe(4);
    }
  });

  it("names whichever chapter the reading line is inside", () => {
    const chapters = column(-1500, HEIGHTS);
    chapters.forEach((chapter, index) => {
      const viewport = ((chapter.top + chapter.bottom) / 2) / 0.55;
      const progress = measureProgress(HOST, viewport, chapters);
      expect(
        resolveChapterCursor(progress, PRIMER_CHAPTER_COUNT).activeIndex,
        `chapter ${index + 1}`,
      ).toBe(index);
    });
  });

  it("runs a chapter's own progress from 0 to 1 across that chapter", () => {
    const chapters = column(-1500, HEIGHTS);
    const third = chapters[2];
    const at = (line: number) =>
      resolveChapterCursor(measureProgress(HOST, line / 0.55, chapters), PRIMER_CHAPTER_COUNT)
        .chapterProgress;
    expect(at(third.top + 1)).toBeLessThan(0.05);
    expect(at(third.bottom - 1)).toBeGreaterThan(0.95);
  });

  it("is 0 above the first chapter and 1 below the last", () => {
    const chapters = column(400, HEIGHTS);
    expect(measureProgress(HOST, 400 / 0.55, chapters)).toBe(0);
    const last = chapters[chapters.length - 1];
    expect(measureProgress(HOST, (last.bottom + 10) / 0.55, chapters)).toBe(1);
  });

  it("falls back to the whole-element fraction when the chapters cannot be read", () => {
    const line = LINE;
    expect(measureProgress({ top: line - 2000, height: 4000 }, VIEWPORT, null)).toBeCloseTo(0.5, 5);
    expect(measureProgress({ top: line - 2000, height: 4000 }, VIEWPORT, [])).toBeCloseTo(0.5, 5);
  });

  it("finishes while the last chapter is still on screen, not after it has left", () => {
    // The primer's bottom exactly on the line: settled, and still visible.
    const bottomOnLine = { top: LINE - HEIGHT, height: HEIGHT };
    expect(measureProgress(bottomOnLine, VIEWPORT)).toBe(1);
    expect(bottomOnLine.top + HEIGHT).toBeLessThan(VIEWPORT);
    expect(measureProgress({ top: -HEIGHT, height: HEIGHT }, VIEWPORT)).toBe(1);
  });
});
