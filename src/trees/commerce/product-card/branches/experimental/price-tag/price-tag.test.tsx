import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../product-card.fixtures";
import { ProductCardPriceTag } from "./price-tag";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("ProductCardPriceTag", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ProductCardPriceTag {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ProductCardPriceTag {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("puts the price on a tag over the photograph and drops the spec table", () => {
    const vm = ALL_FIXTURES["Available"];
    const { getByText, container } = render(<ProductCardPriceTag {...vm} />);
    expect(getByText(vm.price.current)).toBeTruthy();
    // A tag has no room for a table. The fields are still in the VM — this leaf
    // simply does not have the space, and its siblings do.
    expect(container.querySelectorAll("dt")).toHaveLength(0);
  });

  it("gives the commit the whole bottom edge", () => {
    const vm = ALL_FIXTURES["Available"];
    const { getByLabelText } = render(<ProductCardPriceTag {...vm} />);
    expect(getByLabelText(vm.add.a11yLabel).className).toContain("w-full");
  });

  it("holds the tag still under reduced motion", () => {
    const { container } = render(<ProductCardPriceTag {...ALL_FIXTURES["Reduced motion"]} />);
    const tag = container.querySelector("[style*=\"rotate\"]") as HTMLElement;
    expect(tag.style.transform).toBe("rotate(-3deg)");
  });
});
