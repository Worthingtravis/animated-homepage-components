import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../page-nav.fixtures";
import { PageNavPillTrack } from "./pill-track";

afterEach(cleanup);

describe("PageNavPillTrack", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PageNavPillTrack {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PageNavPillTrack {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("marks exactly one item as current", () => {
    const { container } = render(<PageNavPillTrack {...ALL_FIXTURES["Creator page tabs"]} />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  // The pill style's claim: capsule track, capsule triggers.
  it("renders a capsule track", () => {
    const { container } = render(<PageNavPillTrack {...ALL_FIXTURES["Creator page tabs"]} />);
    expect(container.querySelector("[data-nav-track]")?.className).toContain("rounded-full");
  });

  // The accent is inherited from the page wrapper, never pinned by the leaf.
  // `pill` marks the active item with a fill and NO ring — that is the whole
  // difference from `glass-track`, so it is worth asserting rather than assuming.
  it("marks the active item with an inherited accent fill and no ring", () => {
    const { container } = render(<PageNavPillTrack {...ALL_FIXTURES["Creator page tabs"]} />);
    const active = container.querySelector<HTMLElement>('[data-item-state="active"]');
    expect(active?.className).toContain("bg-primary/15");
    expect(active?.className).not.toContain("ring-");
    expect(active?.getAttribute("style")).toBeNull();
  });

  // Substitutability, tested directly: the same data, the same active item.
  it("agrees with its sibling about which item is active", () => {
    const vm = ALL_FIXTURES["Creator tabs — mid-track active"];
    const { container } = render(<PageNavPillTrack {...vm} />);
    const current = container.querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain(vm.items.find((i) => i.state === "active")?.label);
  });
});
