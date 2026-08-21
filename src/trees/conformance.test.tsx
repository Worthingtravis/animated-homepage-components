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

import { CreatorSurface } from "@/lib/creator-surface";
import { editorModeVars } from "@/lib/editor-mode";
import { EDITOR_MODE_PRESETS } from "@/lib/editor-mode-presets";
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

/** Every source rule fans out over the same cases; build them once. */
const LEAF_CASES = LEAF_SOURCES.map((file) => [file.rel, file] as const);

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
    /*
     * Editor mode is INHERITED. A leaf that defines its own theming variable is
     * re-inventing the mechanism the creator-page wrapper already provides, and
     * becomes the one leaf a container has to thread a theme object into. This
     * rule is what retired `PageNavTheme`'s `--nav-accent` / `--nav-track` /
     * `--nav-glow`, and it is here so they cannot come back.
     */
    [
      /["']--(?!primary|primary-foreground|accent|ring|background|foreground)[a-z][a-z0-9-]*["']\s*:/,
      "bespoke CSS variable — theme by inheriting --primary/--accent/--ring, not by inventing a variable",
    ],
    [/["']#[0-9a-fA-F]{6}\b/, "hex colour literal — a creator's accent must be able to win"],
    /*
     * A filled surface whose fill a creator cannot move. `bg-foreground` and
     * `text-background` are the tell: both name tokens editor mode never
     * touches, so a call to action painted in them stays platform-coloured on
     * every creator page no matter what the creator picks. All three
     * channel-hero leaves shipped this — one in `bg-destructive`, one in
     * `bg-foreground` — and it looked deliberate rather than broken, which is
     * exactly why it needs a rule and not a review.
     *
     * A primary fill is `bg-primary` + `text-primary-foreground`, always.
     */
    [
      /\bbg-foreground\b/,
      "bg-foreground fill — editor mode cannot move it; use bg-primary",
    ],
    [
      /\btext-background\b/,
      "text-background on a fill — use text-primary-foreground, which is derived for contrast",
    ],
  ];

  it.each(LEAF_CASES)(
    "%s stays pure",
    (_rel, file) => {
      const violations = FORBIDDEN.filter(([pattern]) => pattern.test(file.source)).map(
        ([, reason]) => reason,
      );
      expect(violations, `${file.rel} violates extract-vm`).toEqual([]);
    },
  );

  /*
   * A leaf measures ITS OWN BOX, never the window. The rule and the house
   * viewport→container mapping live in README.md ("A leaf measures its own
   * box"); what follows is only its enforcement.
   *
   * Enforced by SHAPE, not by a list: any `sm|md|lg|xl|2xl` variant, with or
   * without the `max-`/`min-` prefix, plus any arbitrary width variant
   * (`min-[700px]:`). Every container form starts with `@`, so the test is
   * "this variant segment does not start with @" — which covers the variants
   * Tailwind has not shipped yet as well as the ones it has.
   *
   * The one exception is a viewport overlay: a `fixed` element really IS the
   * window, and nothing can query its own box. A class string that declares
   * `fixed` as a bare token may use viewport prefixes for its own sizing —
   * `bg-fixed` does not count, which is why the token is matched exactly.
   */
  const VIEWPORT_VARIANT = /^(?:(?:max|min)-)?(?:sm|md|lg|xl|2xl)$/;
  const ARBITRARY_WIDTH_VARIANT = /^(?:max|min)-\[/;
  /* Class strings appear as any of the three literal forms; scan all of them,
     so the first leaf to build a class in a template literal is not exempt. */
  const STRING_LITERAL = /"[^"\n]*"|'[^'\n]*'|`[^`]*`/g;

  function viewportVariants(classText: string): string[] {
    return classText.split(/\s+/).flatMap((token) => {
      const segments = token.split(":");
      segments.pop(); // the utility itself is never a variant
      return segments.filter(
        (segment) =>
          !segment.startsWith("@") &&
          (VIEWPORT_VARIANT.test(segment) || ARBITRARY_WIDTH_VARIANT.test(segment)),
      );
    });
  }

  it.each(LEAF_CASES)("%s measures its own box, not the window", (_rel, file) => {
    const offenders = (file.source.match(STRING_LITERAL) ?? [])
      .map((literal) => literal.slice(1, -1))
      .filter((text) => !text.split(/\s+/).includes("fixed"))
      .flatMap(viewportVariants);
    expect(
      offenders,
      `${file.rel} uses a viewport breakpoint — use the container form (@lg:, @2xl:, @4xl:)`,
    ).toEqual([]);
  });

  /*
   * Clipped-gradient text — `bg-clip-text` + `text-transparent` — paints the
   * letterform itself in the creator's RAW `--primary`/`--accent`. That is the
   * one direction editor mode does not guard. A FILL is safe because
   * `--primary-foreground` is derived against the creator's colour (the
   * #9CCB1A → 1.91:1 trap, pinned two describes down); text painted IN that
   * colour has no derived ground at all, and it is always the largest type on
   * the surface, which is why it looked deliberate on three channel-hero
   * leaves for as long as it did.
   *
   * The exception is the same shape as the `fixed` overlay exception above: a
   * leaf that draws a keyline around every letterform HAS given the gradient a
   * known ground at a known width, so it is guarded by construction rather
   * than by luck. `landing/channel-hero`'s `key-art/poster-wall` is that leaf,
   * and the stroke is the reason its wordmark survives being printed over
   * illustration in the first place.
   */
  it.each(LEAF_CASES)(
    "%s does not clip a gradient into text without a keyline",
    (_rel, file) => {
      const clipsAGradient = /\bbg-clip-text\b/.test(file.source);
      const drawsAKeyline = /WebkitTextStroke|text-stroke/.test(file.source);
      expect(
        !clipsAGradient || drawsAKeyline,
        `${file.rel} clips a gradient into text. The creator's raw accent becomes the ` +
          "reading colour with nothing derived behind it — use bg-primary + " +
          "text-primary-foreground for a fill, or move the colour to a non-text rule.",
      ).toBe(true);
    },
  );

  /*
   * Keyboard focus wears the creator's ring, or it wears the browser's.
   *
   * A leaf that omits `focus-visible` does not crash and does not look broken
   * — the UA outline still appears, which is exactly why thirty-nine leaves
   * grew the same explicit ring and the fortieth quietly did not. The cost only
   * shows up on harvest: the leaf lands on a creator page whose focus colour is
   * `--ring`, and this one control answers in the browser's blue.
   */
  it.each(LEAF_CASES)("%s themes its own focus ring", (_rel, file) => {
    const interactive = /<(?:button|a|input|select|textarea)\b/.test(file.source);
    expect(
      !interactive || /focus-visible:/.test(file.source),
      `${file.rel} renders an interactive element but never styles :focus-visible — ` +
        "keyboard focus will fall back to the UA outline instead of --ring.",
    ).toBe(true);
  });

  /*
   * Target size, pinned at the floor rather than at the ideal.
   *
   * WCAG 2.5.8 asks for 24×24 CSS px; the 44px figure everyone quotes is 2.5.5
   * (AAA) and Apple's HIG. Forty of this forest's leaves sit comfortably above
   * the first number and several deliberately sit below the second, because
   * `chrome/pane-dock` exists to argue that screen budget is real and a leaf
   * that inflates every chip to 44px has lost that argument. So this rule does
   * not enforce 44.
   *
   * What it enforces is the one combination that lands UNDER the floor: text
   * below `text-xs` on an interactive element with nothing establishing a
   * height. At 0.6rem the line box is ~11px, so even `py-1.5` totals ~23px —
   * which is how `landing/layered-poster`'s replay pill got there. Either give
   * the control a height (`min-h-*`, `h-*`, `size-*`) or carry the hit area
   * past the drawn box with a pseudo-element, as that leaf now does.
   */
  const TINY_TEXT = /text-\[0\.[0-6]\d*rem\]|text-\[(?:[0-9]|1[01])px\]/;
  const HAS_HEIGHT = /\b(?:min-h-|h-|size-|py-[3-9]|py-1[0-9])|after:h-1[1-9]|after:-inset/;

  it.each(LEAF_CASES)("%s keeps interactive targets above the size floor", (_rel, file) => {
    const offenders = (file.source.match(/<(?:button|a)\b[^>]*>/gs) ?? []).filter(
      (tag) => TINY_TEXT.test(tag) && !HAS_HEIGHT.test(tag),
    );
    expect(
      offenders.map((tag) => tag.slice(0, 80)),
      `${file.rel} draws an interactive target below the 24px floor — give it a ` +
        "height, or expand the hit area past the drawn box.",
    ).toEqual([]);
  });

  /*
   * The other half of the rule — every root a leaf can render carries
   * `@container` — is checked against the RENDERED root, in "every leaf
   * survives every fixture" below. A source-level grep for the string would
   * pass on a leaf that puts it on one root and forgets three others.
   */

  it.each(LEAF_CASES)(
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
      /*
       * Anchored on the call/generic syntax, exactly like the leaf rules above,
       * rather than on the bare word. A VM that *names* a hook is not a VM that
       * *uses* one — `narrative/forest-primer` carries the sentence "the first
       * useState in a leaf ends it" as copy, and a bare-word grep failed the
       * one file in the forest whose job is to quote the rule.
       */
      expect(
        /\buse(State|Effect|Ref|Memo|Callback)\s*[(<]/.test(file.source),
        file.rel,
      ).toBe(false);
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

/*
 * Editor mode — the single surface that decides how every variant looks.
 *
 * On a creator page the only things a creator can move are `--primary`,
 * `--primary-foreground`, `--accent`, `--ring`, `--background` and the font.
 * A component styled purely in neutrals (`card` / `border` / `muted` /
 * `foreground`) therefore renders identically no matter what the creator picks
 * — it is not "theme-neutral", it is *deaf to the creator*, and it fails
 * silently because nothing crashes.
 *
 * That failure is real and it is upstream right now: on laughingwhales.com,
 * every section title header plus all of support, FAQ, recommended and
 * screenshots contain zero accent references, so a creator's brand colour never
 * reaches them. These tests exist so no leaf in this forest joins them.
 */
describe("editor mode (creator-page hand-off)", () => {
  const ACCENT_TOKEN =
    /\b(?:text|bg|border|ring|from|via|to|fill|stroke|shadow|outline|decoration|divide|accent)-(?:primary|accent|ring)\b/;

  it.each(LEAF_CASES)(
    "%s reaches for the creator's accent",
    (_rel, file) => {
      expect(
        ACCENT_TOKEN.test(file.source),
        `${file.rel} styles itself only in neutral tokens, so a creator's accent can never reach it. ` +
          "Give it at least one primary/accent/ring token.",
      ).toBe(true);
    },
  );

  /**
   * The wrapper must actually put the creator's colours on the air. This is the
   * contract `CreatorSurface` shares with upstream's `creator-page-client.tsx`
   * — if the variable list here drifts, a leaf verified in this lab is being
   * verified against something the creator page does not do.
   */
  it("puts exactly the creator-page variables on the surface", () => {
    const vars = editorModeVars(EDITOR_MODE_PRESETS.Ink);
    expect(Object.keys(vars).sort()).toEqual(
      ["--accent", "--background", "--primary", "--primary-foreground", "--ring"].sort(),
    );
  });

  it("derives a legible foreground rather than assuming white", () => {
    // The documented trap: #9CCB1A with white text measured 1.91:1 upstream.
    expect(editorModeVars(EDITOR_MODE_PRESETS.Lime)["--primary-foreground"]).toBe("#000000");
    // A dark accent still takes white.
    expect(editorModeVars(EDITOR_MODE_PRESETS.Ocean)["--primary-foreground"]).toBe("#ffffff");
    // Worth pinning: the PLATFORM DEFAULT pink (#FF69B4) sits at luminance 0.62
    // — just over the line — so even a stock creator page needs black on its
    // primary fill. A leaf that hardcodes white breaks for every default page.
    expect(editorModeVars(EDITOR_MODE_PRESETS.Default)["--primary-foreground"]).toBe("#000000");
  });

  /**
   * Every leaf, every preset. A leaf renders inside the same wrapper it will
   * land in when harvested, so anything that breaks under a creator's palette
   * breaks here first.
   */
  const themed = trees.flatMap((tree) =>
    allLeaves(tree).flatMap((leaf) =>
      Object.entries(EDITOR_MODE_PRESETS).map(
        ([presetName, mode]) =>
          [
            `${leaf.ref} · ${presetName}`,
            leaf,
            tree.fixtures[tree.defaultFixture],
            presetName,
            mode,
          ] as const,
      ),
    ),
  );

  it.each(themed)("%s", (_label, leaf, vm, _presetName, mode) => {
    const { Component } = leaf;
    const { container } = render(
      <CreatorSurface mode={mode}>
        <Component {...(vm as object)} />
      </CreatorSurface>,
    );
    const surface = container.querySelector<HTMLElement>("[data-creator-surface]");
    expect(surface?.style.getPropertyValue("--primary")).toBe(mode.themeAccent);
    expect(container.innerHTML).not.toContain("NaN");
    expect(container.innerHTML).not.toContain("undefined");
  });
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
    /*
     * Every state a leaf can render — empty and loading included — is laid out
     * inside a container. Checking the RENDERED root rather than the source is
     * what catches the real mistake: an `@container` that sits on some inner
     * div while the state that actually needs measuring returns its own root
     * without one.
     */
    const roots = [...container.children];
    if (roots.length > 0) {
      expect(
        roots.some((root) => (root.getAttribute("class") ?? "").includes("@container")),
        "the leaf's rendered root must carry @container",
      ).toBe(true);
    }
  });
});
