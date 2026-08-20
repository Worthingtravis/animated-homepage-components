/**
 * Product Card — fixture coherence.
 *
 * The conformance suite proves every leaf can RENDER every fixture. This file
 * proves the fixtures are worth rendering: that no card in the set says two
 * things at once — a struck price with no discount badge, a button reading
 * "Add to bag" in a state where it cannot be pressed, a settled commit that did
 * not settle.
 */

import { describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE, frameAt } from "./product-card.fixtures";
import { resolveAddLabel, type ProductCardVM } from "./product-card.vm";

const entries = Object.entries(ALL_FIXTURES) as Array<[string, ProductCardVM]>;

describe("every fixture", () => {
  it.each(entries)("%s keeps progress inside 0..1", (_name, vm) => {
    expect(vm.progress).toBeGreaterThanOrEqual(0);
    expect(vm.progress).toBeLessThanOrEqual(1);
  });

  it.each(entries)("%s says the same thing on the button as in the state", (_name, vm) => {
    expect(vm.add.label).toBe(resolveAddLabel(vm.state));
    expect(vm.add.disabled).toBe(vm.state !== "available");
  });

  it.each(entries)("%s only strikes a price when it also badges the discount", (_name, vm) => {
    expect(vm.price.compareAt === null).toBe(vm.price.discountLabel === null);
    expect(vm.price.savingLabel === null).toBe(vm.price.compareAt === null);
  });

  it.each(entries)("%s never shows a discount badge it cannot justify", (_name, vm) => {
    const promo = vm.badges.filter((badge) => badge.tone === "promo");
    // At most one loud badge, always — `normaliseBadges` is the only thing
    // standing between this card and three competing accents.
    expect(promo.length).toBeLessThanOrEqual(1);
    expect(vm.badges.every((badge) => badge.label.length > 0)).toBe(true);
  });

  it.each(entries)("%s pre-formats every number it shows", (_name, vm) => {
    for (const value of [
      vm.price.current,
      vm.price.compareAt,
      vm.price.discountLabel,
      vm.specLine,
      vm.rating?.value ?? null,
    ]) {
      if (value !== null) expect(typeof value).toBe("string");
    }
  });

  it.each(entries)("%s keeps the selected option resolved", (_name, vm) => {
    if (!vm.option) return;
    const selected = vm.option.choices.filter((choice) => choice.selected);
    expect(selected).toHaveLength(1);
    expect(vm.option.selectedLabel).toBe(selected[0].label);
    // The selected choice cannot be re-selected, and an unavailable one cannot
    // be selected at all — both arrive as a null callback, not as a leaf check.
    expect(selected[0].onSelect).toBeNull();
    for (const choice of vm.option.choices) {
      if (!choice.available) expect(choice.onSelect).toBeNull();
    }
  });
});

describe("specific fixtures", () => {
  it("prices the default card exactly as the design does", () => {
    const vm = ALL_FIXTURES[DEFAULT_FIXTURE];
    expect(vm.price.current).toBe("$199");
    expect(vm.price.compareAt).toBe("$399");
    expect(vm.price.discountLabel).toBe("− 50%");
    expect(vm.specLine).toBe("58 × 79 × 60 cm");
  });

  it("settles the commit at 1 once it has landed", () => {
    expect(ALL_FIXTURES["Added"].progress).toBe(1);
    expect(ALL_FIXTURES["Available"].progress).toBe(0);
  });

  it("keeps the sold-out card whole — picture, price and specs all still there", () => {
    const vm = ALL_FIXTURES["Unavailable"];
    expect(vm.state).toBe("unavailable");
    expect(vm.specs.length).toBeGreaterThan(0);
    expect(vm.price.current.length).toBeGreaterThan(0);
    expect(vm.note).not.toBeNull();
  });

  it("rounds the 33% fixture down, badge and saving line together", () => {
    const vm = ALL_FIXTURES["Rounding — 33% off"];
    // 199 off 299 is 33.44%. The badge says 33, and the saving line is the
    // actual money — the two are different views of one subtraction.
    expect(vm.price.discountLabel).toBe("− 33%");
    expect(vm.price.compareAt).toBe("$299");
    expect(vm.price.savingLabel).toBe("Save $100");
    expect(vm.badges.map((badge) => badge.label)).toContain("− 33%");
  });
});

describe("frameAt", () => {
  it("runs one whole add and comes back to rest", () => {
    expect(frameAt(0).state).toBe("available");
    expect(frameAt(0.3).state).toBe("adding");
    expect(frameAt(0.7).state).toBe("added");
    expect(frameAt(1).state).toBe("available");
  });

  it("moves the transport while adding and settles it after", () => {
    expect(frameAt(0.2).progress).toBeLessThan(frameAt(0.45).progress);
    expect(frameAt(0.7).progress).toBe(1);
  });

  it("is a pure sampler — the same instant twice is the same card", () => {
    expect(JSON.stringify(frameAt(0.33))).toBe(JSON.stringify(frameAt(0.33)));
  });
});
