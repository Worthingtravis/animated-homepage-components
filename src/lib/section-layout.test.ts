/**
 * The layout model. Pure in, pure out — so the cases worth testing are the ones
 * that are awkward to reach by dragging: a tab deleted while active, a stale
 * layout meeting a changed forest, a move onto the container a section is
 * already in.
 */

import { describe, expect, it } from "vitest";

import {
  SHELF,
  addTab,
  containerOf,
  emptyLayout,
  filledTabs,
  moveSection,
  parseContainerId,
  reconcile,
  removeTab,
  renameTab,
  reorderTabs,
  sectionsIn,
  tabContainerId,
  type SectionLayout,
} from "./section-layout";

function seed(): SectionLayout {
  const base = addTab(addTab(emptyLayout(), "Home", "home"), "Shop", "shop");
  return reconcile({ ...base, activeTabId: "home" }, ["a", "b", "c"]);
}

describe("reconcile", () => {
  it("shelves sections the layout has never seen", () => {
    const layout = reconcile(emptyLayout(), ["a", "b"]);
    expect(layout.shelf).toEqual(["a", "b"]);
  });

  it("drops sections that no longer exist", () => {
    const layout = moveSection(seed(), "a", tabContainerId("home"), 0);
    const next = reconcile(layout, ["b", "c"]);
    expect(sectionsIn(next, tabContainerId("home"))).toEqual([]);
    expect(next.shelf).toEqual(["b", "c"]);
  });

  it("never duplicates a section that is already placed", () => {
    const layout = moveSection(seed(), "a", tabContainerId("home"), 0);
    const next = reconcile(layout, ["a", "b", "c"]);
    const all = [...next.shelf, ...next.tabs.flatMap((tab) => tab.sectionIds)];
    expect(new Set(all).size).toBe(all.length);
  });

  it("repairs an active tab that points at a tab that is gone", () => {
    const layout = reconcile({ ...seed(), activeTabId: "ghost" }, ["a"]);
    expect(layout.activeTabId).toBe("home");
  });
});

describe("moveSection", () => {
  it("moves a section from the shelf into a tab", () => {
    const layout = moveSection(seed(), "b", tabContainerId("shop"), 0);
    expect(sectionsIn(layout, tabContainerId("shop"))).toEqual(["b"]);
    expect(layout.shelf).not.toContain("b");
  });

  it("reorders within one container using the index the caller saw", () => {
    // Remove-then-insert is why this works: an index read off the rendered
    // list stays correct even though the list changes underneath the move.
    const layout = moveSection(seed(), "c", SHELF, 0);
    expect(layout.shelf).toEqual(["c", "a", "b"]);
  });

  it("appends on a negative index", () => {
    const layout = moveSection(seed(), "a", SHELF, -1);
    expect(layout.shelf).toEqual(["b", "c", "a"]);
  });

  it("appends rather than throwing on an index past the end", () => {
    const layout = moveSection(seed(), "a", tabContainerId("home"), 99);
    expect(sectionsIn(layout, tabContainerId("home"))).toEqual(["a"]);
  });

  it("ignores a section it has never heard of", () => {
    const layout = seed();
    expect(moveSection(layout, "nope", SHELF, 0)).toBe(layout);
  });

  it("keeps the total number of sections constant", () => {
    const layout = moveSection(moveSection(seed(), "a", tabContainerId("home"), 0), "a", tabContainerId("shop"), 0);
    const all = [...layout.shelf, ...layout.tabs.flatMap((tab) => tab.sectionIds)];
    expect(all.sort()).toEqual(["a", "b", "c"]);
  });
});

describe("tabs", () => {
  it("returns a deleted tab's sections to the shelf instead of destroying them", () => {
    const layout = removeTab(moveSection(seed(), "a", tabContainerId("home"), 0), "home");
    expect(layout.shelf).toContain("a");
    expect(layout.tabs.map((tab) => tab.id)).toEqual(["shop"]);
  });

  it("moves the active tab when the active tab is the one deleted", () => {
    expect(removeTab(seed(), "home").activeTabId).toBe("shop");
  });

  it("leaves activeTabId null once the last tab is gone", () => {
    const layout = removeTab(removeTab(seed(), "home"), "shop");
    expect(layout.activeTabId).toBeNull();
  });

  it("gives a new tab a unique id even after deletions", () => {
    const layout = addTab(addTab(emptyLayout()));
    expect(new Set(layout.tabs.map((tab) => tab.id)).size).toBe(2);
  });

  it("renames without touching contents", () => {
    const layout = renameTab(moveSection(seed(), "a", tabContainerId("home"), 0), "home", "Landing");
    expect(layout.tabs[0]?.label).toBe("Landing");
    expect(layout.tabs[0]?.sectionIds).toEqual(["a"]);
  });

  it("reorders tabs", () => {
    expect(reorderTabs(seed(), 0, 1).tabs.map((tab) => tab.id)).toEqual(["shop", "home"]);
  });

  it("counts only tabs holding something as filled", () => {
    expect(filledTabs(moveSection(seed(), "a", tabContainerId("home"), 0))).toHaveLength(1);
  });
});

describe("container ids", () => {
  it("round-trips a tab id", () => {
    expect(parseContainerId(tabContainerId("home"))).toEqual({ kind: "tab", tabId: "home" });
  });

  it("recognises the shelf", () => {
    expect(parseContainerId(SHELF)).toEqual({ kind: "shelf" });
  });

  it("locates a section's container", () => {
    const layout = moveSection(seed(), "a", tabContainerId("shop"), 0);
    expect(containerOf(layout, "a")).toBe(tabContainerId("shop"));
    expect(containerOf(layout, "b")).toBe(SHELF);
    expect(containerOf(layout, "nope")).toBeNull();
  });
});
