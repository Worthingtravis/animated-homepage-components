import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../page-nav.fixtures";
import { PageNavFloatingCapsule } from "./floating-capsule";

afterEach(cleanup);

describe("PageNavFloatingCapsule", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PageNavFloatingCapsule {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PageNavFloatingCapsule {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // This branch's whole identity: the box detaches as transport advances.
  it("rounds off and insets as the page scrolls", () => {
    const shape = (name: keyof typeof ALL_FIXTURES) => {
      const { container } = render(<PageNavFloatingCapsule {...ALL_FIXTURES[name]} />);
      const nav = container.querySelector<HTMLElement>("nav");
      const wrap = container.firstElementChild as HTMLElement;
      const value = {
        radius: Number.parseFloat(nav?.style.borderRadius ?? "0"),
        inset: Number.parseFloat(wrap?.style.paddingInline ?? "0"),
      };
      cleanup();
      return value;
    };
    const top = shape("At top");
    const mid = shape("Mid condense");
    const done = shape("Condensed");
    expect(top.radius).toBe(0);
    expect(top.inset).toBe(0);
    expect(mid.radius).toBeGreaterThan(top.radius);
    expect(done.radius).toBeGreaterThan(mid.radius);
    expect(done.inset).toBeGreaterThan(mid.inset);
  });

  // Reduced motion means arrived, not mid-flight — and no shadow animation.
  it("renders the settled capsule immediately under reduced motion", () => {
    const { container } = render(<PageNavFloatingCapsule {...ALL_FIXTURES["Reduced motion"]} />);
    expect(Number.parseFloat(container.querySelector<HTMLElement>("nav")?.style.borderRadius ?? "0"))
      .toBe(999);
  });

  // Content never depends on transport — that is the species rule.
  it("keeps every item at both ends of the transport", () => {
    for (const name of ["At top", "Condensed"] as const) {
      const vm = ALL_FIXTURES[name];
      const { container } = render(<PageNavFloatingCapsule {...vm} />);
      for (const item of vm.items) expect(container.textContent).toContain(item.label);
      cleanup();
    }
  });

  it("marks exactly one item as current", () => {
    const { container } = render(
      <PageNavFloatingCapsule {...ALL_FIXTURES["Creator tabs — mid-track active"]} />,
    );
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  // Detaching is geometry, not colour — the inline style carries radius and
  // shadow, and the accent still arrives through the inherited token.
  it("marks the active item with the inherited accent token", () => {
    const { container } = render(<PageNavFloatingCapsule {...ALL_FIXTURES["Creator page tabs"]} />);
    const active = container.querySelector<HTMLElement>('[data-item-state="active"]');
    expect(active?.className).toContain("text-primary");
    expect(active?.getAttribute("style")).toBeNull();
  });
});
