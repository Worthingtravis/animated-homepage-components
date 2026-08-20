/**
 * The paused streamer, across every leaf on the tree.
 *
 * `adaptSendPanel` deciding that a paused panel stays browsable is only half of
 * the fix — the other half is that no leaf may quietly render it as a dead end
 * anyway. So this asserts the same three things four times, once per leaf, and
 * it is deliberately a fixture-driven test rather than four separate ones: the
 * invariant is *any leaf can replace any other*, and a leaf that swallowed the
 * notice would still pass conformance while breaking the promise.
 */

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES } from "./clip-picker.fixtures";
import type { ClipPickerVM } from "./clip-picker.vm";
import ClipPickerOneColumn from "./branches/canon/one-column/one-column";
import ClipPickerQuoteFirst from "./branches/canon/quote-first/quote-first";
import ClipPickerShelfRail from "./branches/canon/shelf-rail/shelf-rail";
import ClipPickerDeck from "./branches/experimental/deck/deck";

afterEach(cleanup);

const LEAVES: Array<[string, (vm: ClipPickerVM) => React.ReactNode]> = [
  ["canon/one-column", ClipPickerOneColumn],
  ["canon/shelf-rail", ClipPickerShelfRail],
  ["canon/quote-first", ClipPickerQuoteFirst],
  ["experimental/deck", ClipPickerDeck],
];

const PORTED_CLOSED = ALL_FIXTURES["Ported — yapdrop, overlay closed"];
const PAUSED = ALL_FIXTURES["Paused — the shelves stay up"];

describe.each(LEAVES)("%s — sending paused", (_name, Leaf) => {
  it("still shows the streamer's picks", () => {
    render(<>{Leaf(PORTED_CLOSED)}</>);
    /*
     * The rows themselves, not the shelf heading — `deck` legitimately
     * flattens shelves away and shows one card at a time, which is a layout
     * decision this test has no business overruling. What every leaf owes the
     * viewer is the picks, all of them.
     */
    for (const name of ["Fails of the week", "Nurse highlights", "Chat moments"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: /Cannot send/ })).toHaveLength(3);
  });

  it("says why, once, at surface level", () => {
    render(<>{Leaf(PORTED_CLOSED)}</>);
    expect(screen.getByText("jagerzgoober has drops paused right now.")).toBeInTheDocument();
  });

  it("offers nothing pressable that would charge them", () => {
    const { container } = render(<>{Leaf(PAUSED)}</>);
    const sends = container.querySelectorAll("[data-send-state]");
    expect(sends.length).toBeGreaterThan(0);
    for (const send of sends) {
      expect(send.getAttribute("data-send-state")).toBe("blocked");
      expect(send).toBeDisabled();
      // The reason on the button matches the reason in the banner.
      expect(within(send as HTMLElement).getByText("Paused")).toBeInTheDocument();
    }
  });
});
