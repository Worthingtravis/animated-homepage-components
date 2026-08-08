import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../expandable-card.fixtures";
import { ExpandableCardFullBleed } from "./full-bleed";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("ExpandableCardFullBleed", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ExpandableCardFullBleed {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ExpandableCardFullBleed {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("puts the type on the media, not beside it", () => {
    const vm = ALL_FIXTURES["Browsing"];
    const { container } = render(<ExpandableCardFullBleed {...vm} />);

    // The bet this leaf makes: one element holds both the image and the title,
    // so the scrim between them is the only thing keeping the title legible.
    const card = container.querySelector<HTMLElement>(
      `[data-expandable-card="${vm.cards[0].id}"]`,
    );
    expect(card?.querySelector("img")).not.toBeNull();
    expect(card?.textContent).toContain(vm.cards[0].title);
    expect(card?.className).toContain("relative");
  });

  it("survives a card with no meta line", () => {
    const vm = ALL_FIXTURES["Missing optionals"];
    const { container } = render(<ExpandableCardFullBleed {...vm} />);
    expect(container.innerHTML).not.toContain("undefined");
    expect(container.querySelectorAll("[data-expandable-card]").length).toBe(vm.cards.length);
  });
});
