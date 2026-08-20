import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../product-card.fixtures";
import { ProductCardDetailRow } from "./detail-row";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("ProductCardDetailRow", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ProductCardDetailRow {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ProductCardDetailRow {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("takes the pre-joined spec line rather than building one", () => {
    const vm = ALL_FIXTURES["Available"];
    const { getByText, container } = render(<ProductCardDetailRow {...vm} />);
    expect(getByText(vm.specLine as string)).toBeTruthy();
    // No W/H/D table — a row has one line of horizontal space.
    expect(container.querySelectorAll("dt")).toHaveLength(0);
  });

  it("spells the commit out in a word, since a row has the width for one", () => {
    const vm = ALL_FIXTURES["Available"];
    const { getByLabelText } = render(<ProductCardDetailRow {...vm} />);
    expect(getByLabelText(vm.add.a11yLabel).textContent).toContain(vm.add.label);
  });

  it("offers the options as pressable pills, with the unavailable one kept", () => {
    const vm = ALL_FIXTURES["Many options — 8"];
    const { container } = render(<ProductCardDetailRow {...vm} />);
    const pills = container.querySelectorAll("button[aria-pressed]");
    // Every choice, plus the favourite toggle — nothing is dropped for being
    // sold out, because a swatch row that shrinks moves the layout.
    expect(pills.length).toBe((vm.option?.choices.length ?? 0) + 1);
  });
});
