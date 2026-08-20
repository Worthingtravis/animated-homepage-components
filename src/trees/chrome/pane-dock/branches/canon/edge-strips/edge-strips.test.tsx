import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../pane-dock.fixtures";
import { PaneDockEdgeStrips } from "./edge-strips";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("PaneDockEdgeStrips", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PaneDockEdgeStrips {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PaneDockEdgeStrips {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("scatters the SAME five doors across four separate edges", () => {
    const { container } = render(<PaneDockEdgeStrips {...ALL_FIXTURES["Send page — five docked"]} />);
    const doors = container.querySelectorAll("[data-slot][aria-label^=\"Open\"]");
    expect(doors).toHaveLength(5);
    const edges = new Set(
      Array.from(doors, (el) => el.getAttribute("data-slot")),
    );
    // Three separate edges for five doors, plus the header — the finding, as
    // an assertion. `door-row` renders the identical five in ONE nav; the
    // difference between these two numbers is the whole argument of this tree.
    expect(edges.size).toBe(3);
  });

  it("turns vertical-edge labels sideways, which is the cost made visible", () => {
    const { container } = render(<PaneDockEdgeStrips {...ALL_FIXTURES["Send page — five docked"]} />);
    const rotated = Array.from(container.querySelectorAll("span")).filter(
      (el) => (el as HTMLElement).style.writingMode === "vertical-rl",
    );
    expect(rotated.length).toBeGreaterThan(0);
  });

  it("reserves no edge in `solo`", () => {
    const { container } = render(<PaneDockEdgeStrips {...ALL_FIXTURES.Solo} />);
    expect(container.querySelectorAll("[aria-label^=\"Open\"]")).toHaveLength(0);
  });
});
