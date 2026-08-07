import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../countdown.fixtures";
import { CountdownInlineStrip } from "./inline-strip";

afterEach(cleanup);

describe("CountdownInlineStrip", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<CountdownInlineStrip {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<CountdownInlineStrip {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("renders nothing when there is no deadline", () => {
    const { container } = render(<CountdownInlineStrip {...ALL_FIXTURES["No deadline"]} />);
    expect(container.innerHTML).toBe("");
  });

  // The strip's claim: it stays one line's worth of markup — short labels only,
  // so its width tracks the digits rather than the vocabulary.
  it("uses short unit labels, never the full ones", () => {
    const vm = ALL_FIXTURES["Under a day"];
    const { container } = render(<CountdownInlineStrip {...vm} />);
    for (const unit of vm.units) {
      expect(container.textContent).toContain(unit.shortLabel);
      expect(container.textContent).not.toContain(unit.label);
    }
  });

  it("keeps the long headline from setting the width", () => {
    const { container } = render(<CountdownInlineStrip {...ALL_FIXTURES["Long copy"]} />);
    expect(container.querySelector(".truncate")).not.toBeNull();
  });

  it("stops pulsing under reduced motion", () => {
    const { container } = render(<CountdownInlineStrip {...ALL_FIXTURES["Reduced motion — urgent"]} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0);
  });
});
