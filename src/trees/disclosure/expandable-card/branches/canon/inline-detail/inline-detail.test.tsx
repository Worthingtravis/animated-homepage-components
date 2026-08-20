import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../expandable-card.fixtures";
import { ExpandableCardInlineDetail } from "./inline-detail";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("ExpandableCardInlineDetail", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ExpandableCardInlineDetail {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ExpandableCardInlineDetail {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("opens in the flow — no dialog, no scrim, nothing covered", () => {
    const vm = ALL_FIXTURES["Morph — t=0.5"];
    const { container } = render(<ExpandableCardInlineDetail {...vm} />);

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector(`#${vm.panel?.id}`)?.getAttribute("role")).toBe("region");
    // It is handed a backdrop style like every leaf, and renders no backdrop.
    expect(vm.panel?.motion.backdrop).not.toEqual({});
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("keeps the source card visible, because nothing is covering it", () => {
    const { container } = render(<ExpandableCardInlineDetail {...ALL_FIXTURES["Morph — t=0.5"]} />);
    const source = container.querySelector('[data-card-state="source"]');
    expect(source).not.toBeNull();
    expect(source?.className).not.toContain("opacity-0");
    expect(source?.className).toContain("ring-ring");
  });
});
