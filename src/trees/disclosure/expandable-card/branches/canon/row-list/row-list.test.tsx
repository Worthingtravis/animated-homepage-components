import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../expandable-card.fixtures";
import { ExpandableCardRowList } from "./row-list";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("ExpandableCardRowList", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ExpandableCardRowList {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ExpandableCardRowList {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("keeps the row's action outside the row's trigger", () => {
    const vm = ALL_FIXTURES["Browsing"];
    const { container } = render(<ExpandableCardRowList {...vm} />);

    // The whole row opens the card, but the action is a peer of that trigger,
    // never nested inside it — a button inside a button is invalid HTML and the
    // play action would open the panel it was meant to bypass.
    const trigger = container.querySelector(`#${vm.cards[0].triggerId}`);
    expect(trigger).not.toBeNull();
    expect(trigger?.querySelector("button")).toBeNull();
    expect(container.querySelectorAll("[data-expandable-card] button").length).toBeGreaterThan(
      vm.cards.length,
    );
  });
});
