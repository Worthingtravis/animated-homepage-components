import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../countdown.fixtures";
import { CountdownRingDial } from "./ring-dial";

afterEach(cleanup);

describe("CountdownRingDial", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<CountdownRingDial {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<CountdownRingDial {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("renders nothing when there is no deadline", () => {
    const { container } = render(<CountdownRingDial {...ALL_FIXTURES["No deadline"]} />);
    expect(container.innerHTML).toBe("");
  });

  // The dial's claim: the arc is decoration, the digits are the answer. Every
  // unit the container handed over is still in the DOM, inside the ring or under it.
  it("keeps every unit's digits, however many there are", () => {
    for (const name of ["Fresh", "Under a day", "Long window — 124 days"] as const) {
      const vm = ALL_FIXTURES[name];
      const { container } = render(<CountdownRingDial {...vm} />);
      expect(container.querySelectorAll("[data-unit]"), name).toHaveLength(vm.units.length);
      cleanup();
    }
  });

  it("draws a full arc at the start of the window and an empty one once expired", () => {
    const fresh = render(<CountdownRingDial {...ALL_FIXTURES["Fresh"]} />);
    expect(fresh.container.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset")).toBe(
      "0",
    );
    cleanup();

    const expired = render(<CountdownRingDial {...ALL_FIXTURES["Expired"]} />);
    const circumference = Number(
      expired.container.querySelectorAll("circle")[1].getAttribute("stroke-dasharray"),
    );
    expect(
      Number(expired.container.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset")),
    ).toBeCloseTo(circumference);
  });

  it("never emits a NaN arc for an unmeasurable window", () => {
    const { container } = render(<CountdownRingDial {...ALL_FIXTURES["Unbounded — no fill"]} />);
    expect(container.innerHTML).not.toContain("NaN");
  });

  it("stops the separator pulsing under reduced motion", () => {
    const { container } = render(<CountdownRingDial {...ALL_FIXTURES["Reduced motion — urgent"]} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0);
  });
});
