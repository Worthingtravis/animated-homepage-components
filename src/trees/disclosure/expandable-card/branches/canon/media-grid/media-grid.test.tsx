import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../expandable-card.fixtures";
import { ExpandableCardMediaGrid } from "./media-grid";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("ExpandableCardMediaGrid", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ExpandableCardMediaGrid {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ExpandableCardMediaGrid {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("opens into a modal dialog over a scrim", () => {
    const { container } = render(<ExpandableCardMediaGrid {...ALL_FIXTURES["Morph — t=0.5"]} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBe(
      ALL_FIXTURES["Morph — t=0.5"].panel?.titleId,
    );
  });

  it("keeps the source card's slot in the grid rather than removing it", () => {
    const vm = ALL_FIXTURES["Morph — t=0.5"];
    const { container } = render(<ExpandableCardMediaGrid {...vm} />);
    // Every card is still in the DOM — the open one is only made invisible, so
    // the grid behind the scrim does not reflow and then snap back on close.
    expect(container.querySelectorAll("[data-expandable-card]").length).toBe(vm.cards.length);
    const source = container.querySelector('[data-card-state="source"]');
    expect(source?.className).toContain("opacity-0");
  });
});
