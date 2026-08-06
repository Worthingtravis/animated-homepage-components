import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../step-reveal.fixtures";
import { StepRevealNumberedRail } from "./numbered-rail";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("StepRevealNumberedRail", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<StepRevealNumberedRail {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<StepRevealNumberedRail {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The rail's claim: every step stays readable, whatever the transport says.
  it("keeps every step's title and description in the DOM", () => {
    const vm = ALL_FIXTURES["Step 2"];
    const { container } = render(<StepRevealNumberedRail {...vm} />);
    for (const step of vm.steps) {
      expect(container.textContent).toContain(step.title);
      expect(container.textContent).toContain(step.description);
    }
  });

  it("renders read-only when the sequence is not steerable", () => {
    const { container } = render(<StepRevealNumberedRail {...ALL_FIXTURES["Passive — no steering"]} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("marks exactly one step as current when steerable", () => {
    const { container } = render(<StepRevealNumberedRail {...ALL_FIXTURES["Step 3"]} />);
    expect(container.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  });
});
