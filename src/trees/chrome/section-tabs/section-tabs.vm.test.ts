import { describe, expect, it } from "vitest";

import {
  buildTab,
  buildTabs,
  disambiguateInitials,
  tabInitial,
} from "./section-tabs.vm";

const noop = () => {};

describe("tabInitial", () => {
  it("is one uppercase character by default", () => {
    expect(tabInitial("Shop")).toBe("S");
    expect(tabInitial("  about ")).toBe("A");
  });

  it("grows without recasing what follows", () => {
    expect(tabInitial("Shop", 2)).toBe("Sh");
    expect(tabInitial("support", 2)).toBe("Su");
  });

  it("has something to draw for a label with no letters in it", () => {
    expect(tabInitial("   ")).toBe("•");
  });
});

describe("disambiguateInitials", () => {
  /*
   * The defect this exists for: in a collapsed dock, "Shop" and "Support" were
   * two identical circles, and in the side rail two identical avatars.
   */
  it("tells colliding labels apart", () => {
    expect(disambiguateInitials(["Home", "About", "Shop", "Support"])).toEqual([
      "H",
      "A",
      "Sh",
      "Su",
    ]);
  });

  it("leaves labels that do not collide exactly as they were", () => {
    // "Two"/"Three" DO collide, so both grow; "One" is untouched.
    expect(disambiguateInitials(["One", "Two", "Three"])).toEqual(["O", "Tw", "Th"]);
    expect(disambiguateInitials(["Home", "Videos", "Press"])).toEqual(["H", "V", "P"]);
  });

  it("stops at two characters — a marker cannot draw more than that", () => {
    // A collision this deep is not solvable in a circle; the label itself is,
    // and every leaf reveals it on hover, on focus or as an accessible name.
    expect(disambiguateInitials(["Shop", "Shorts"])).toEqual(["Sh", "Sh"]);
  });

  it("stops rather than spins on labels that are genuinely identical", () => {
    expect(disambiguateInitials(["Shop", "Shop"])).toEqual(["Sh", "Sh"]);
  });
});

describe("buildTabs", () => {
  const raw = (id: string, label: string) => ({ id, label, onSelect: noop });

  it("hands each tab its set-level initial", () => {
    const tabs = buildTabs(
      [raw("shop", "Shop"), raw("support", "Support")],
      "shop",
      "scope",
    );
    expect(tabs.map((tab) => tab.initial)).toEqual(["Sh", "Su"]);
    expect(tabs[0]?.state).toBe("active");
  });

  it("still lets a caller build one tab on its own", () => {
    expect(buildTab(raw("shop", "Shop"), "shop", "scope").initial).toBe("S");
  });
});
