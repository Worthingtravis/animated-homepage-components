import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../section-tabs.fixtures";
import { SectionTabsPopoverMenu } from "./popover-menu";

afterEach(cleanup);

describe("SectionTabsPopoverMenu", () => {
  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<SectionTabsPopoverMenu {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("keeps every tab off the page until the menu is opened", () => {
    // The structural decision: this is the only leaf whose footprint does not
    // grow with the tab count.
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(screen.queryByText("Shop")).toBeNull();
    expect(screen.getByText("Home")).toBeTruthy();
  });

  it("names the current section on its trigger", () => {
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(screen.getByLabelText("Choose a section — Home selected")).toBeTruthy();
  });

  it("renders the whole menu when the VM says the overlay is open", () => {
    // Open state lives in the VM, which is why a static fixture can show it.
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES["Narrow · overlay open"]!} />);
    expect(screen.getByText("Shop")).toBeTruthy();
    expect(screen.getByText("Support")).toBeTruthy();
  });

  it("does not claim to be a tablist, because it has no visible tabs", () => {
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES["Narrow · overlay open"]!} />);
    expect(document.querySelector("[role='tablist']")).toBeNull();
  });

  it("uses the VM's ids, since no primitive is generating them here", () => {
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES["Narrow · overlay open"]!} />);
    const option = document.querySelector("#fixture-tab-shop");
    expect(option?.getAttribute("aria-controls")).toBe("fixture-panel-shop");
  });

  it("labels each panel region with the tab that owns it", () => {
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(screen.getByLabelText("Home").tagName).toBe("SECTION");
  });

  it("spreads the motion the VM resolved", () => {
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES["Switching · 35% through a slide"]!} />);
    const entering = document.querySelector<HTMLElement>("[data-phase='entering']");
    expect(entering?.style.transform).toContain("translate3d");
  });

  it("says so rather than rendering a trigger when there are no tabs", () => {
    render(<SectionTabsPopoverMenu {...ALL_FIXTURES["Empty · no tabs at all"]!} />);
    expect(screen.getByText(/No tabs yet/)).toBeTruthy();
  });
});
