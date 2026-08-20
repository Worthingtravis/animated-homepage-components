import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../product-card.fixtures";
import { ProductCardSpecShelf } from "./spec-shelf";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("ProductCardSpecShelf", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ProductCardSpecShelf {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ProductCardSpecShelf {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("shows the dimensions as a labelled block, not as the joined line", () => {
    const vm = ALL_FIXTURES["Available"];
    const { container } = render(<ProductCardSpecShelf {...vm} />);
    // W / H / D each get their own cell — the shape that lines two cards up in
    // a grid. The one-line form is `canon/detail-row`'s answer, not this one's.
    expect(container.querySelectorAll("dt")).toHaveLength(vm.specs.length);
    expect(container.querySelectorAll("dd")).toHaveLength(vm.specs.length);
  });

  it("prints the money exactly as the VM handed it over", () => {
    const vm = ALL_FIXTURES["Available"];
    const { getByText } = render(<ProductCardSpecShelf {...vm} />);
    expect(getByText(vm.price.current)).toBeTruthy();
    expect(getByText(vm.price.compareAt as string).className).toContain("line-through");
  });

  it("cannot be pressed twice mid-commit", () => {
    const { getByLabelText } = render(<ProductCardSpecShelf {...ALL_FIXTURES["Adding — t=0.45"]} />);
    const button = getByLabelText(ALL_FIXTURES["Adding — t=0.45"].add.a11yLabel);
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders the settled frame under reduced motion", () => {
    const vm = ALL_FIXTURES["Reduced motion"];
    const { container } = render(<ProductCardSpecShelf {...vm} />);
    const card = container.querySelector("article") as HTMLElement;
    // Mid-add, but nothing may be part-way anywhere.
    expect(card.style.transform).toBe("translateY(0px)");
  });
});
