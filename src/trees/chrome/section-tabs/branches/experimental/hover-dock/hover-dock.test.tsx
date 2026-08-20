import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../section-tabs.fixtures";
import { SectionTabsHoverDock } from "./hover-dock";

afterEach(cleanup);

describe("SectionTabsHoverDock", () => {
  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<SectionTabsHoverDock {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  /*
   * These are the price of the idea. A dock whose labels only exist on
   * hover is unusable with a finger or a keyboard, so the ways it stays legible
   * without a pointer are asserted rather than trusted.
   */
  it("gives every marker its full label — and its badge — as an accessible name", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    // The badge is drawn as a bare dot while collapsed, so the count has to be
    // in the name or it does not exist for a screen reader.
    for (const name of ["Home", "About", "Shop (4)", "Support (New)"]) {
      expect(screen.getByLabelText(name)).toBeTruthy();
    }
  });

  it("never drops a badge: an inactive marker keeps its text and wears a dot", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    // "Shop" is inactive in this fixture; its "4" used to vanish entirely.
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    const shop = screen.getByLabelText("Shop (4)");
    expect(shop.querySelector(".bg-accent")).toBeTruthy();
  });

  it("tells two markers with the same first letter apart", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    const shop = screen.getByLabelText("Shop (4)").textContent ?? "";
    const support = screen.getByLabelText("Support (New)").textContent ?? "";
    expect(shop.startsWith("Sh")).toBe(true);
    expect(support.startsWith("Su")).toBe(true);
  });

  it("cuts the reveal rather than sliding it when motion is reduced", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES["Reduced motion · mid-change"]!} />);
    const marker = document.querySelector("[data-tab-state='idle']");
    expect(marker?.className).toContain("transition-none");
  });

  it("keeps the label text in the DOM rather than swapping it in on hover", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(screen.getByText("Shop")).toBeTruthy();
  });

  it("always draws the active marker's label, so the dock is never mute", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    const active = document.querySelector("[data-tab-state='active']");
    expect(active?.textContent).toContain("Home");
  });

  it("abandons the dock entirely when narrow, where touch actually lives", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES["Narrow layout"]!} />);
    const track = document.querySelector("[data-tabs-track]");
    expect(track?.className).not.toContain("sticky");
    expect(track?.className).toContain("overflow-x-auto");
  });

  it("spreads the motion the VM resolved", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES["Switching · 35% through a slide"]!} />);
    const entering = document.querySelector<HTMLElement>("[data-phase='entering']");
    expect(entering?.style.transform).toContain("translate3d");
  });

  it("says so rather than rendering an empty dock when there are no tabs", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES["Empty · no tabs at all"]!} />);
    expect(screen.getByText(/No tabs yet/)).toBeTruthy();
  });
});
