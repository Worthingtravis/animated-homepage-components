/**
 * Navigation tests.
 *
 * The point of deriving the nav is that it cannot disagree with the forest. So
 * most of these run against the REAL registry: if a link here can go stale, the
 * derivation is not doing its job and no amount of testing a fixture would tell
 * us.
 */

import { describe, expect, it } from "vitest";

import { allTrees, type SpeciesNode } from "./forest";
import {
  HEADER_LINKS,
  LAB_HREF,
  crumbsFor,
  findSpeciesEntry,
  findTreeEntry,
  isActivePath,
  plural,
  speciesEntries,
  speciesHref,
  speciesNeighbours,
  treeEntries,
  treeHref,
  treeNeighbours,
} from "./site-nav";
import { FOREST } from "@/trees/generated";

describe("derivation from the real forest", () => {
  it("offers exactly the species that exist, in folder order", () => {
    expect(speciesEntries(FOREST).map((entry) => entry.key)).toEqual(
      FOREST.map((species) => species.key),
    );
  });

  it("offers exactly the trees that exist", () => {
    expect(treeEntries(FOREST).map((entry) => entry.ref)).toEqual(
      allTrees(FOREST).map((tree) => tree.ref),
    );
  });

  it("links every tree at a route that exists", () => {
    for (const tree of treeEntries(FOREST)) {
      expect(tree.href).toBe(`${LAB_HREF}/${tree.speciesKey}/${tree.key}`);
      expect(tree.href).toBe(treeHref(tree.speciesKey, tree.key));
    }
  });

  it("counts branches, leaves and fixtures so no page re-derives them", () => {
    const productCard = findTreeEntry(FOREST, "commerce", "product-card");
    expect(productCard).not.toBeNull();
    expect(productCard?.branchCount).toBeGreaterThan(0);
    expect(productCard?.leafCount).toBeGreaterThan(0);
    expect(productCard?.fixtureCount).toBeGreaterThan(0);
    expect(productCard?.path).toBe("src/trees/commerce/product-card/");
  });

  it("rolls each species' leaves up onto the species", () => {
    for (const species of speciesEntries(FOREST)) {
      expect(species.leafCount).toBe(
        species.trees.reduce((total, tree) => total + tree.leafCount, 0),
      );
      expect(species.href).toBe(speciesHref(species.key));
    }
  });
});

/** A forest small enough to reason about, for the order-sensitive parts. */
const TINY: SpeciesNode[] = [
  {
    key: "alpha",
    meta: { label: "Alpha", description: "first" },
    trees: [
      {
        key: "one",
        species: "alpha",
        ref: "alpha/one",
        meta: { label: "One", description: "" },
        fixtures: { a: {} },
        defaultFixture: "a",
        branches: [{ key: "canon", meta: { label: "Canon", description: "" }, leaves: [] }],
      },
      {
        key: "two",
        species: "alpha",
        ref: "alpha/two",
        meta: { label: "Two", description: "" },
        fixtures: {},
        defaultFixture: "",
        branches: [],
      },
    ],
  },
  {
    key: "beta",
    meta: { label: "Beta", description: "second" },
    trees: [
      {
        key: "three",
        species: "beta",
        ref: "beta/three",
        meta: { label: "Three", description: "" },
        fixtures: {},
        defaultFixture: "",
        branches: [],
      },
    ],
  },
];

describe("neighbours", () => {
  it("walks the whole forest, crossing from one species into the next", () => {
    // The point of flattening: following "next" end to end sees everything
    // once, instead of looping inside whichever species you landed in.
    expect(treeNeighbours(TINY, "alpha", "two").next?.ref).toBe("beta/three");
    expect(treeNeighbours(TINY, "beta", "three").previous?.ref).toBe("alpha/two");
  });

  it("does not wrap — an end looks like an end", () => {
    expect(treeNeighbours(TINY, "alpha", "one").previous).toBeNull();
    expect(treeNeighbours(TINY, "beta", "three").next).toBeNull();
  });

  it("returns nothing either side of a tree that does not exist", () => {
    expect(treeNeighbours(TINY, "alpha", "nope")).toEqual({ previous: null, next: null });
  });

  it("does the same for species", () => {
    expect(speciesNeighbours(TINY, "alpha").next?.key).toBe("beta");
    expect(speciesNeighbours(TINY, "beta").next).toBeNull();
    expect(speciesNeighbours(TINY, "alpha").previous).toBeNull();
  });
});

describe("crumbsFor", () => {
  it("builds the trail from what the page is", () => {
    expect(crumbsFor(TINY, { species: "alpha", tree: "one" }).map((crumb) => crumb.label)).toEqual([
      "the forest",
      "lab",
      "Alpha",
      "One",
    ]);
  });

  it("marks the page you are on and nothing else", () => {
    const trail = crumbsFor(TINY, { species: "alpha", tree: "one" });
    expect(trail.filter((crumb) => crumb.current).map((crumb) => crumb.label)).toEqual(["One"]);
    expect(crumbsFor(TINY, { species: "alpha" }).at(-1)).toMatchObject({
      label: "Alpha",
      current: true,
    });
    expect(crumbsFor(TINY).at(-1)).toMatchObject({ label: "lab", current: true });
  });

  it("stops rather than inventing a step for something that does not exist", () => {
    expect(crumbsFor(TINY, { species: "ghost" }).map((crumb) => crumb.label)).toEqual([
      "the forest",
      "lab",
    ]);
    expect(crumbsFor(TINY, { species: "alpha", tree: "ghost" }).map((crumb) => crumb.label)).toEqual(
      ["the forest", "lab", "Alpha"],
    );
  });

  it("agrees with the real forest", () => {
    const trail = crumbsFor(FOREST, { species: "commerce", tree: "product-card" });
    expect(trail.at(-1)?.href).toBe("/lab/commerce/product-card");
    expect(findSpeciesEntry(FOREST, "commerce")?.label).toBe(trail[2].label);
  });
});

describe("plural", () => {
  it("counts one thing correctly, which is the whole reason it exists", () => {
    expect(plural(1, "tree")).toBe("1 tree");
    expect(plural(8, "tree")).toBe("8 trees");
    expect(plural(0, "tree")).toBe("0 trees");
    expect(plural(1, "leaf", "leaves")).toBe("1 leaf");
    expect(plural(4, "leaf", "leaves")).toBe("4 leaves");
  });
});

describe("header", () => {
  it("does not grow a link per species", () => {
    // The header is on every page. Species arrive one level in, on the rail.
    expect(HEADER_LINKS.map((link) => link.label)).toEqual(["lab", "source"]);
  });

  it("keeps the lab lit from anywhere inside it", () => {
    expect(isActivePath("/lab/commerce/product-card", LAB_HREF)).toBe(true);
    expect(isActivePath("/lab", LAB_HREF)).toBe(true);
    expect(isActivePath("/", LAB_HREF)).toBe(false);
  });

  it("matches home exactly, or every page would claim to be it", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/lab", "/")).toBe(false);
  });
});
