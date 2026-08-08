import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../clip-picker.fixtures";
import { ClipPickerDeck } from "./deck";

afterEach(cleanup);

describe("ClipPickerDeck", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ClipPickerDeck {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ClipPickerDeck {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("flattens every shelf into ONE pager — the deck is the whole surface", () => {
    const vm = ALL_FIXTURES["Many shelves"];
    const { container } = render(<ClipPickerDeck {...vm} />);
    const decks = container.querySelectorAll("[data-deck]");
    expect(decks).toHaveLength(1);
    const total = vm.shelves.reduce((sum, shelf) => sum + shelf.items.length, 0);
    expect(decks[0].querySelectorAll("[data-send-state]")).toHaveLength(total);
  });

  it("puts a featured shelf's clips first, whatever order the VM listed them in", () => {
    // The bet this leaf makes: the first card decides whether anyone swipes.
    // So the curator's `featured` mark is the one thing it reorders on.
    const vm = ALL_FIXTURES["Many shelves"];
    const featuredFirst = vm.shelves.find((shelf) => shelf.featured)?.items[0];
    const { container } = render(<ClipPickerDeck {...vm} />);
    const firstCard = container.querySelector("[data-deck] > li");
    expect(firstCard?.textContent).toContain(featuredFirst?.title ?? "###");
  });

  it("swaps the deck's content for results while keeping one pager", () => {
    const vm = ALL_FIXTURES["Search — results"];
    const { container } = render(<ClipPickerDeck {...vm} />);
    expect(container.querySelectorAll("[data-deck]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-deck] > li")).toHaveLength(vm.results.length);
  });

  it("renders no pager at all when there is nothing to page through", () => {
    for (const name of ["Search — nothing matched", "Offline — nothing indexed"]) {
      const { container } = render(<ClipPickerDeck {...ALL_FIXTURES[name]} />);
      expect(container.querySelector("[data-deck]"), `fixture: ${name}`).toBeNull();
      cleanup();
    }
  });
});
