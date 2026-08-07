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
   * These four are the price of the idea. A dock whose labels only exist on
   * hover is unusable with a finger or a keyboard, so the ways it stays legible
   * without a pointer are asserted rather than trusted.
   */
  it("gives every marker its full label as an accessible name", () => {
    render(<SectionTabsHoverDock {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    for (const label of ["Home", "About", "Shop", "Support"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
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
