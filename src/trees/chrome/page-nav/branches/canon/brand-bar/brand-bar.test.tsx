import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../page-nav.fixtures";
import { PageNavBrandBar } from "./brand-bar";

afterEach(cleanup);

describe("PageNavBrandBar", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PageNavBrandBar {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PageNavBrandBar {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The screenshot's shape: brand, every link, and the CTA all present at once.
  it("renders the brand, every item and the call to action", () => {
    const vm = ALL_FIXTURES["Marketing bar"];
    const { container } = render(<PageNavBrandBar {...vm} />);
    expect(container.textContent).toContain(vm.brand?.label);
    for (const item of vm.items) expect(container.textContent).toContain(item.label);
    expect(container.querySelector('[data-emphasis="primary"]')?.textContent).toBe(
      vm.actions[0].label,
    );
  });

  // The underline exists for every item, so changing route cannot reflow the row.
  it("keeps an underline element for every item, active or not", () => {
    const vm = ALL_FIXTURES["Marketing bar"];
    const { container } = render(<PageNavBrandBar {...vm} />);
    const rules = container.querySelectorAll<HTMLElement>("[data-item-state] span[aria-hidden]");
    expect(rules).toHaveLength(vm.items.length);
    const scaled = [...rules].filter((rule) => rule.style.transform === "scaleX(1)");
    expect(scaled).toHaveLength(1);
  });

  it("carries no active underline when nothing is active", () => {
    const { container } = render(<PageNavBrandBar {...ALL_FIXTURES["Nothing active"]} />);
    const rules = container.querySelectorAll<HTMLElement>("[data-item-state] span[aria-hidden]");
    expect([...rules].filter((r) => r.style.transform === "scaleX(1)")).toHaveLength(0);
  });

  // The underline is the accent's only load-bearing use here, and it takes it
  // from the inherited token rather than an inline colour.
  it("draws the active underline in the inherited accent token", () => {
    const { container } = render(<PageNavBrandBar {...ALL_FIXTURES["Marketing bar"]} />);
    const rule = container.querySelector<HTMLElement>(
      '[data-item-state="active"] span[aria-hidden]',
    );
    expect(rule?.className).toContain("bg-primary");
    expect(rule?.style.backgroundColor).toBe("");
  });

  // Attached branch: the bar's box never leaves the edge, it only loses height.
  it("shortens but does not detach as the page condenses", () => {
    const pad = (name: keyof typeof ALL_FIXTURES) => {
      const { container } = render(<PageNavBrandBar {...ALL_FIXTURES[name]} />);
      const value = Number.parseFloat(
        container.querySelector<HTMLElement>("nav")?.style.paddingBlock ?? "0",
      );
      cleanup();
      return value;
    };
    expect(pad("Condensed")).toBeLessThan(pad("At top"));
  });
});
