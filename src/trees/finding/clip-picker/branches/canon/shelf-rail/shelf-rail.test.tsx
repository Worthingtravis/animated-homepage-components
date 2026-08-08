import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../clip-picker.fixtures";
import { ClipPickerShelfRail } from "./shelf-rail";

afterEach(cleanup);

describe("ClipPickerShelfRail", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ClipPickerShelfRail {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ClipPickerShelfRail {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("gives each shelf its own rail — one scroller per shelf, never one for the page", () => {
    const vm = ALL_FIXTURES["Many shelves"];
    const { container } = render(<ClipPickerShelfRail {...vm} />);
    expect(container.querySelectorAll("[data-rail]")).toHaveLength(vm.shelves.length);
  });

  it("does NOT make search results a rail — a ranked list must not scroll sideways", () => {
    // The finding this leaf exists to record: the layout follows the state, and
    // ranked results are the state where a rail buries its own best answer.
    const { container } = render(<ClipPickerShelfRail {...ALL_FIXTURES["Search — results"]} />);
    expect(container.querySelectorAll("[data-rail]")).toHaveLength(0);
  });

  it("keeps Send on every rail card, same as its siblings", () => {
    const vm = ALL_FIXTURES[DEFAULT_FIXTURE];
    const { container } = render(<ClipPickerShelfRail {...vm} />);
    const cards = vm.shelves.flatMap((shelf) => shelf.items);
    expect(container.querySelectorAll("[data-send-state]")).toHaveLength(cards.length);
  });

  it("labels every rail by its shelf heading", () => {
    const vm = ALL_FIXTURES[DEFAULT_FIXTURE];
    const { container } = render(<ClipPickerShelfRail {...vm} />);
    for (const shelf of vm.shelves) {
      expect(container.querySelector(`#${shelf.headingId}`)?.textContent).toBe(shelf.label);
    }
  });
});
