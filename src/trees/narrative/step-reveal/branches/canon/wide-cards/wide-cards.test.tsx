import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../step-reveal.fixtures";
import { StepRevealWideCards } from "./wide-cards";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("StepRevealWideCards", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<StepRevealWideCards {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<StepRevealWideCards {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The band's claim: all titles stay, but the active card owns the description.
  it("keeps every step title visible", () => {
    const vm = ALL_FIXTURES["Step 2"];
    const { container } = render(<StepRevealWideCards {...vm} />);
    for (const step of vm.steps) {
      expect(container.textContent).toContain(step.title);
    }
  });

  it("gives the active card the growth class and the others none", () => {
    const { container } = render(<StepRevealWideCards {...ALL_FIXTURES["Step 2"]} />);
    const active = container.querySelectorAll('[data-position="active"]');
    expect(active).toHaveLength(1);
    expect(active[0].className).toContain("lg:grow-[3]");
  });

  it("renders read-only when the sequence is not steerable", () => {
    const { container } = render(<StepRevealWideCards {...ALL_FIXTURES["Passive — no steering"]} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
