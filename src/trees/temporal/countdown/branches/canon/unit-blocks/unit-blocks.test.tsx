import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../countdown.fixtures";
import { CountdownUnitBlocks } from "./unit-blocks";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises.
 */
describe("CountdownUnitBlocks", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<CountdownUnitBlocks {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<CountdownUnitBlocks {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The tree's thesis: no deadline means nothing, not a zeroed clock.
  it("renders nothing when there is no deadline", () => {
    const { container } = render(<CountdownUnitBlocks {...ALL_FIXTURES["No deadline"]} />);
    expect(container.innerHTML).toBe("");
  });

  // The rail's claim: one tile per unit the container handed over, no more.
  it("renders exactly one tile per unit", () => {
    const vm = ALL_FIXTURES["Under a day"];
    const { container } = render(<CountdownUnitBlocks {...vm} />);
    expect(container.querySelectorAll("[data-unit]")).toHaveLength(vm.units.length);
    for (const unit of vm.units) {
      expect(container.querySelector(`[data-unit="${unit.id}"]`)?.textContent).toContain(
        unit.value,
      );
    }
  });

  it("drops the digits and names the outcome once expired", () => {
    const vm = ALL_FIXTURES["Expired"];
    const { container } = render(<CountdownUnitBlocks {...vm} />);
    expect(container.querySelectorAll("[data-unit]")).toHaveLength(0);
    expect(container.textContent).toContain(vm.expiredLabel);
  });

  it("holds the seconds tile still under reduced motion", () => {
    const { container } = render(<CountdownUnitBlocks {...ALL_FIXTURES["Reduced motion — urgent"]} />);
    const seconds = container.querySelector('[data-unit="seconds"] > div');
    expect(seconds?.getAttribute("style") ?? "").not.toContain("opacity");
  });

  it("draws no depletion before the window opens", () => {
    const { container } = render(<CountdownUnitBlocks {...ALL_FIXTURES["Scheduled — not open yet"]} />);
    const fill = container.querySelector('[aria-hidden] > div[style*="width"]');
    expect(fill?.getAttribute("style")).toContain("width: 0%");
  });
});
