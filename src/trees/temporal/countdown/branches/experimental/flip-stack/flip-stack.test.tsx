import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../countdown.fixtures";
import { CountdownFlipStack } from "./flip-stack";

afterEach(cleanup);

describe("CountdownFlipStack", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<CountdownFlipStack {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<CountdownFlipStack {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("renders nothing when there is no deadline", () => {
    const { container } = render(<CountdownFlipStack {...ALL_FIXTURES["No deadline"]} />);
    expect(container.innerHTML).toBe("");
  });

  // The stack's claim: only the hinge moves. The digit underneath is readable
  // at every instant, which is what makes a screenshot of it honest.
  it("keeps every digit readable while the hinge is mid-swing", () => {
    const vm = ALL_FIXTURES["Final minute"];
    const { container } = render(<CountdownFlipStack {...vm} />);
    for (const unit of vm.units) {
      expect(container.querySelector(`[data-unit="${unit.id}"]`)?.textContent).toContain(
        unit.value,
      );
    }
  });

  it("holds every hinge flat under reduced motion", () => {
    const { container } = render(<CountdownFlipStack {...ALL_FIXTURES["Reduced motion — urgent"]} />);
    for (const flap of container.querySelectorAll('[style*="rotateX"]')) {
      expect(flap.getAttribute("style")).toContain("rotateX(0deg)");
    }
  });

  it("holds every hinge flat before the window opens", () => {
    const { container } = render(<CountdownFlipStack {...ALL_FIXTURES["Scheduled — not open yet"]} />);
    for (const flap of container.querySelectorAll('[style*="rotateX"]')) {
      expect(flap.getAttribute("style")).toContain("rotateX(0deg)");
    }
  });
});
