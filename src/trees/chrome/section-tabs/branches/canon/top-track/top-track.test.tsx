import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../section-tabs.fixtures";
import { SectionTabsTopTrack } from "./top-track";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises.
 */
describe("SectionTabsTopTrack", () => {
  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<SectionTabsTopTrack {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("lays the tabs out in a single scrolling row rather than wrapping", () => {
    // The structural decision. A track that wraps looks fine at every width you
    // test and puts one lonely tab on a second row at the width people use.
    render(<SectionTabsTopTrack {...ALL_FIXTURES["Many tabs · overflowing"]!} />);
    const track = document.querySelector("[data-tabs-track]");
    expect(track?.className).toContain("overflow-x-auto");
    expect(track?.className).not.toContain("flex-wrap");
  });

  it("marks the track so the container can find and measure it", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(document.querySelector("[data-tabs-track='fixture']")).not.toBeNull();
  });

  it("shows edge affordances only when the VM says the track overflows", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES["Many tabs · overflowing"]!} />);
    expect(screen.getByLabelText("Scroll tabs left")).toBeTruthy();
    cleanup();
    render(<SectionTabsTopTrack {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(screen.queryByLabelText("Scroll tabs left")).toBeNull();
  });

  it("keeps both panels of a change in one grid cell so the page cannot jump", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES["Switching · halfway"]!} />);
    const panels = document.querySelectorAll("[data-phase]");
    expect(panels.length).toBe(2);
    for (const panel of panels) {
      expect(panel.className).toContain("col-start-1");
      expect(panel.className).toContain("row-start-1");
    }
  });

  it("hides the leaving panel from assistive tech and from the pointer", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES["Switching · halfway"]!} />);
    const leaving = document.querySelector("[data-phase='leaving']");
    expect(leaving?.getAttribute("aria-hidden")).toBe("true");
    expect(leaving?.className).toContain("pointer-events-none");
  });

  it("spreads the motion the VM resolved, and never invents its own", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES["Switching · 35% through a slide"]!} />);
    const entering = document.querySelector<HTMLElement>("[data-phase='entering']");
    expect(entering?.getAttribute("data-transition")).toBe("slide-x");
    expect(entering?.style.transform).toContain("translate3d");
  });

  it("renders a cut, not a slide, when the viewer asked for reduced motion", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES["Reduced motion · mid-change"]!} />);
    const entering = document.querySelector<HTMLElement>("[data-phase='entering']");
    expect(entering?.getAttribute("data-transition")).toBe("none");
    expect(entering?.style.transform).toBe("");
  });

  it("falls back to the tab's empty copy when a tab holds nothing", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES["A tab with no sections in it"]!} />);
    expect(screen.getByText("Drag a section here to fill this tab.")).toBeTruthy();
  });

  it("says so rather than rendering empty chrome when there are no tabs", () => {
    render(<SectionTabsTopTrack {...ALL_FIXTURES["Empty · no tabs at all"]!} />);
    expect(document.querySelector("[data-tabs-track]")).toBeNull();
    expect(screen.getByText(/No tabs yet/)).toBeTruthy();
  });
});
