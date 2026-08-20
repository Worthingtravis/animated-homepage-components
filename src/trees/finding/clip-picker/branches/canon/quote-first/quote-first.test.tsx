import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../clip-picker.fixtures";
import { ClipPickerQuoteFirst } from "./quote-first";

afterEach(cleanup);

describe("ClipPickerQuoteFirst", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ClipPickerQuoteFirst {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ClipPickerQuoteFirst {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("leads a result with the sentence and demotes the clip title under it", () => {
    // The inversion that IS this leaf: on its siblings the title is the
    // headline; here the transcript line is, and the title is a caption.
    const vm = ALL_FIXTURES["Search — results"];
    const { container } = render(<ClipPickerQuoteFirst {...vm} />);
    const first = container.querySelectorAll("li")[0];
    const text = first?.textContent ?? "";
    const quote = (vm.results[0].quote ?? []).map((segment) => segment.text).join("");
    expect(text.indexOf(quote)).toBeGreaterThanOrEqual(0);
    expect(text.indexOf(quote)).toBeLessThan(text.indexOf(vm.results[0].title));
  });

  it("still renders a row when a card has no quote at all", () => {
    // Curated cards carry no quote by contract. Falling back to the title is
    // what keeps `browse` from rendering a column of empty quotation marks.
    const { container } = render(<ClipPickerQuoteFirst {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.querySelectorAll("mark")).toHaveLength(0);
    expect(container.textContent).toContain("The fish incident");
  });

  it("marks exactly the runs the container matched", () => {
    const vm = ALL_FIXTURES["Search — results"];
    const { container } = render(<ClipPickerQuoteFirst {...vm} />);
    const marks = Array.from(container.querySelectorAll("mark"), (el) => el.textContent);
    const expected = vm.results.flatMap((card) =>
      (card.quote ?? []).filter((segment) => segment.match).map((segment) => segment.text),
    );
    expect(marks).toEqual(expected);
  });

  it("keeps the suggestions attached to the field, not to the empty state", () => {
    const vm = ALL_FIXTURES[DEFAULT_FIXTURE];
    const { container } = render(<ClipPickerQuoteFirst {...vm} />);
    const region = container.querySelector(`[aria-label="${vm.search.suggestionsLabel}"]`);
    expect(region?.querySelectorAll("button").length).toBe(vm.search.suggestions.length);
  });
});
