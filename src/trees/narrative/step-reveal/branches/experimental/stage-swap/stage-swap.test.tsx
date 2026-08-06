import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../step-reveal.fixtures";
import { StepRevealStageSwap } from "./stage-swap";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("StepRevealStageSwap", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<StepRevealStageSwap {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<StepRevealStageSwap {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The stage's claim: one step at a time. Only the active description exists.
  it("renders only the active step's description", () => {
    const vm = ALL_FIXTURES["Step 3"];
    const { container } = render(<StepRevealStageSwap {...vm} />);
    const active = vm.steps[vm.activeIndex];
    expect(container.textContent).toContain(active.description);
    for (const step of vm.steps) {
      if (step.id === active.id) continue;
      expect(container.textContent).not.toContain(step.description);
    }
  });

  it("still lists every step in the strip", () => {
    const vm = ALL_FIXTURES["Step 3"];
    const { container } = render(<StepRevealStageSwap {...vm} />);
    expect(container.querySelectorAll("li")).toHaveLength(vm.steps.length);
  });

  it("renders read-only when the sequence is not steerable", () => {
    const { container } = render(<StepRevealStageSwap {...ALL_FIXTURES["Passive — no steering"]} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
