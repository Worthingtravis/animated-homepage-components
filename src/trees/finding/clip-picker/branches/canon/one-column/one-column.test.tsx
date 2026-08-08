import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../clip-picker.fixtures";
import { ClipPickerOneColumn } from "./one-column";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises.
 */
describe("ClipPickerOneColumn", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ClipPickerOneColumn {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ClipPickerOneColumn {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("puts a Send on every card — there is no selection step", () => {
    const vm = ALL_FIXTURES[DEFAULT_FIXTURE];
    const { container } = render(<ClipPickerOneColumn {...vm} />);
    const cards = vm.shelves.flatMap((shelf) => shelf.items);
    expect(container.querySelectorAll("[data-send-state]")).toHaveLength(cards.length);
  });

  it("disables Send exactly when the VM removed the callback", () => {
    const { container } = render(<ClipPickerOneColumn {...ALL_FIXTURES["Sent — confirmation on the card"]} />);
    const sent = container.querySelector('[data-send-state="sent"]');
    expect(sent).not.toBeNull();
    expect((sent as HTMLButtonElement).disabled).toBe(true);
  });

  it("offers the curated suggestions in `browse` AND in the dead end", () => {
    // The empty state is the only place a viewer can get stuck, so the way out
    // has to be present there too — this is the assertion that keeps it there.
    for (const name of ["Browse — the streamer's shelves", "Search — nothing matched"]) {
      const vm = ALL_FIXTURES[name];
      const { container } = render(<ClipPickerOneColumn {...vm} />);
      const region = container.querySelector(`[aria-label="${vm.search.suggestionsLabel}"]`);
      expect(region, `fixture: ${name}`).not.toBeNull();
      expect(region?.querySelectorAll("button").length).toBe(vm.search.suggestions.length);
      cleanup();
    }
  });

  it("marks only the runs the container matched, and never re-splits the text", () => {
    const vm = ALL_FIXTURES["Search — results"];
    const { container } = render(<ClipPickerOneColumn {...vm} />);
    const marks = Array.from(container.querySelectorAll("mark"), (el) => el.textContent);
    const expected = vm.results.flatMap((card) =>
      (card.quote ?? []).filter((segment) => segment.match).map((segment) => segment.text),
    );
    expect(marks).toEqual(expected);
  });

  it("shows no shelves once a query has results — one body, not two", () => {
    const { container } = render(<ClipPickerOneColumn {...ALL_FIXTURES["Search — results"]} />);
    expect(container.querySelectorAll("[id^='clip-picker-shelf-']")).toHaveLength(0);
  });

  it("controls the field off the VM instead of holding a value", () => {
    const vm = ALL_FIXTURES["Search — results"];
    const { container } = render(<ClipPickerOneColumn {...vm} />);
    const input = container.querySelector("input[type='search']") as HTMLInputElement;
    expect(input.value).toBe(vm.search.query);
  });
});
