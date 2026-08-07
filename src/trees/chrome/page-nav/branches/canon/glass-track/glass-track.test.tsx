import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../page-nav.fixtures";
import { PageNavGlassTrack } from "./glass-track";

afterEach(cleanup);

describe("PageNavGlassTrack", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PageNavGlassTrack {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PageNavGlassTrack {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The contract's core promise: exactly one item is current, and the leaf is
  // told which — it never works it out from an index.
  it("marks exactly one item as current", () => {
    const { container } = render(<PageNavGlassTrack {...ALL_FIXTURES["Creator page tabs"]} />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it("marks nothing current when nothing is active", () => {
    const { container } = render(<PageNavGlassTrack {...ALL_FIXTURES["Nothing active"]} />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  /*
   * Theming is INHERITED, not passed. A creator's accent reaches this leaf as
   * ambient `--primary` from the page wrapper, so the only thing to assert here
   * is that the active item asks for that token — and that the leaf pins no
   * colour of its own that would win over it.
   *
   * That the accent then actually lands is checked across every leaf and every
   * preset in `conformance.test.tsx`.
   */
  it("marks the active item with the inherited accent token", () => {
    const { container } = render(<PageNavGlassTrack {...ALL_FIXTURES["Creator page tabs"]} />);
    const active = container.querySelector<HTMLElement>('[data-item-state="active"]');
    expect(active?.className).toContain("text-primary");
    expect(active?.getAttribute("style")).toBeNull();
  });

  it("pins no colour on the nav root", () => {
    const { container } = render(<PageNavGlassTrack {...ALL_FIXTURES["Marketing bar"]} />);
    const nav = container.querySelector<HTMLElement>("nav");
    // Condensation may set geometry here, but never a colour.
    expect(nav?.style.color).toBe("");
    expect(nav?.style.backgroundColor).toBe("");
  });

  it("offers no back chevron when the track is already at the start", () => {
    const { container } = render(<PageNavGlassTrack {...ALL_FIXTURES["Overflow at start"]} />);
    expect(container.querySelector('[aria-label="Scroll tabs left"]')).toBeNull();
    expect(container.querySelector('[aria-label="Scroll tabs right"]')).not.toBeNull();
  });

  it("renders items as links when they carry an href and buttons when they do not", () => {
    const { container: links } = render(<PageNavGlassTrack {...ALL_FIXTURES["Marketing bar"]} />);
    expect(links.querySelectorAll("[data-nav-track] a").length).toBeGreaterThan(0);
    cleanup();
    const { container: buttons } = render(<PageNavGlassTrack {...ALL_FIXTURES["Creator page tabs"]} />);
    expect(buttons.querySelectorAll("[data-nav-track] button").length).toBeGreaterThan(0);
  });
});
