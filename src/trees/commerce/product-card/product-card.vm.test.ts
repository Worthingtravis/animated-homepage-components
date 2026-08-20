/**
 * Product Card — contract tests.
 *
 * These are the arithmetic tests. Everything here is a calculation a leaf is
 * forbidden from doing, which means this file is the only place it is checked
 * — and a rounding rule that is only correct in one variant is the exact bug
 * this tree exists to prevent.
 */

import { describe, expect, it } from "vitest";

import {
  clampProgress,
  compareAtPrice,
  DEFAULT_ADD_LABELS,
  formatMoney,
  normaliseBadges,
  percentOffLabel,
  resolveAdd,
  resolveAddLabel,
  resolveFavorite,
  resolveProductCardState,
  specLine,
} from "./product-card.vm";

describe("formatMoney", () => {
  it("drops the decimals on a whole amount", () => {
    expect(formatMoney(19_900, "USD")).toBe("$199");
  });

  it("keeps both decimals when there are cents", () => {
    expect(formatMoney(129_950, "USD")).toBe("$1,299.50");
  });

  it("takes amounts in MINOR units, so cent arithmetic never touches a float", () => {
    // 19.99 + 0.01 is not 20 in binary floating point. In cents it is.
    expect(formatMoney(1_999 + 1, "USD")).toBe("$20");
  });

  it("honours the currency and the locale", () => {
    expect(formatMoney(4_500, "EUR", "de-DE")).toContain("45");
    expect(formatMoney(4_500, "EUR", "de-DE")).toContain("€");
  });
});

describe("percentOffLabel", () => {
  it("labels a real discount", () => {
    expect(percentOffLabel(19_900, 39_900)).toBe("− 50%");
  });

  it("rounds DOWN — the shop may not round its way up to the next number", () => {
    // 33.44% off. A designer would write 33; Math.round would too. 49.6% is the
    // case that matters: it must be 49, not 50.
    expect(percentOffLabel(19_900, 29_900)).toBe("− 33%");
    expect(percentOffLabel(50_400, 100_000)).toBe("− 49%");
  });

  it("is null when there is nothing off", () => {
    expect(percentOffLabel(19_900, null)).toBeNull();
    expect(percentOffLabel(19_900, 19_900)).toBeNull();
    expect(percentOffLabel(19_900, 9_900)).toBeNull();
  });

  it("is null rather than '− 0%' for a discount too small to name", () => {
    expect(percentOffLabel(9_999, 10_000)).toBeNull();
  });
});

describe("compareAtPrice", () => {
  it("returns a struck price only when it is genuinely higher", () => {
    expect(compareAtPrice(19_900, 39_900, "USD")).toBe("$399");
    expect(compareAtPrice(19_900, 19_900, "USD")).toBeNull();
    expect(compareAtPrice(19_900, null, "USD")).toBeNull();
  });

  it("agrees with percentOffLabel on every input — one decision, two views", () => {
    const cases: Array<[number, number | null]> = [
      [19_900, 39_900],
      [19_900, null],
      [19_900, 19_900],
      [9_999, 10_000],
    ];
    for (const [current, compareAt] of cases) {
      const struck = compareAtPrice(current, compareAt, "USD") !== null;
      const badged = percentOffLabel(current, compareAt) !== null;
      // A struck price with no badge (or the reverse) is the card contradicting
      // itself. They may only disagree on a discount too small to name.
      if (compareAt !== 10_000) expect(struck).toBe(badged);
    }
  });
});

describe("specLine", () => {
  it("joins the same rows a leaf shows as a block", () => {
    expect(
      specLine(
        [
          { id: "w", label: "W", value: "58" },
          { id: "h", label: "H", value: "79" },
          { id: "d", label: "D", value: "60" },
        ],
        "cm",
      ),
    ).toBe("58 × 79 × 60 cm");
  });

  it("omits the unit when there is not one, and is null when there are no specs", () => {
    expect(specLine([{ id: "w", label: "W", value: "58" }], null)).toBe("58");
    expect(specLine([], "cm")).toBeNull();
  });
});

describe("resolveProductCardState", () => {
  it("lets stock beat the commit", () => {
    expect(resolveProductCardState(false, "adding")).toBe("unavailable");
    expect(resolveProductCardState(false, "added")).toBe("unavailable");
  });

  it("maps the commit when there is stock", () => {
    expect(resolveProductCardState(true, "idle")).toBe("available");
    expect(resolveProductCardState(true, "adding")).toBe("adding");
    expect(resolveProductCardState(true, "added")).toBe("added");
  });
});

describe("resolveAdd", () => {
  it("takes the shop's copy from the state, so no leaf writes 'Adding…'", () => {
    expect(resolveAddLabel("adding")).toBe(DEFAULT_ADD_LABELS.adding);
    expect(resolveAdd("added", "Merano Chair", () => {}).label).toBe(DEFAULT_ADD_LABELS.added);
  });

  it("disables for all three reasons and drops the callback with it", () => {
    for (const state of ["adding", "added", "unavailable"] as const) {
      const add = resolveAdd(state, "Merano Chair", () => {});
      expect(add.disabled, state).toBe(true);
      expect(add.onActivate, state).toBeNull();
    }
    const missingHandler = resolveAdd("available", "Merano Chair", null);
    expect(missingHandler.disabled).toBe(true);
  });

  it("names the product in the accessible label", () => {
    expect(resolveAdd("available", "Merano Chair", () => {}).a11yLabel).toContain("Merano Chair");
  });
});

describe("resolveFavorite", () => {
  it("flips the word with the state", () => {
    expect(resolveFavorite(false, () => {}).label).toBe("Save");
    expect(resolveFavorite(true, () => {}).label).toBe("Saved");
  });
});

describe("normaliseBadges", () => {
  it("keeps exactly one loud badge and demotes the rest", () => {
    const out = normaliseBadges([
      { id: "sale", label: "− 50%", tone: "promo" },
      { id: "new", label: "New", tone: "promo" },
      { id: "oak", label: "Oak", tone: "quiet" },
    ]);
    expect(out.map((badge) => badge.tone)).toEqual(["promo", "quiet", "quiet"]);
  });

  it("demotes rather than drops — the second fact still reaches the card", () => {
    expect(normaliseBadges([
      { id: "a", label: "A", tone: "promo" },
      { id: "b", label: "B", tone: "promo" },
    ])).toHaveLength(2);
  });
});

describe("clampProgress", () => {
  it("survives garbage transport", () => {
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(-3)).toBe(0);
    expect(clampProgress(4)).toBe(1);
    expect(clampProgress(0.42)).toBe(0.42);
  });
});
