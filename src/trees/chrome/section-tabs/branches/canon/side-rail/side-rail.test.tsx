import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../section-tabs.fixtures";
import { SectionTabsSideRail } from "./side-rail";

afterEach(cleanup);

describe("SectionTabsSideRail", () => {
  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<SectionTabsSideRail {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("stands beside the panel when wide, and above it when narrow", () => {
    // The structural decision, and the reason `layout` is on the contract: a
    // rail is a wide-screen affordance and pretending otherwise eats a phone.
    const { container: wide } = render(<SectionTabsSideRail {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(wide.querySelector("[data-layout='wide']")?.className).toContain("md:grid-cols-");
    cleanup();
    const { container: narrow } = render(
      <SectionTabsSideRail {...ALL_FIXTURES["Narrow layout"]!} />,
    );
    expect(narrow.querySelector("[data-layout='narrow']")?.className).toContain("grid-cols-1");
  });

  it("shows the hint inline when wide — the rail's whole advantage", () => {
    render(<SectionTabsSideRail {...ALL_FIXTURES[DEFAULT_FIXTURE]!} />);
    expect(screen.getByText("Hero and highlights")).toBeTruthy();
  });

  it("drops the inline hint when narrow instead of squeezing it", () => {
    render(<SectionTabsSideRail {...ALL_FIXTURES["Narrow layout"]!} />);
    expect(screen.queryByText("Hero and highlights")).toBeNull();
  });

  it("keeps both panels of a change in one grid cell", () => {
    render(<SectionTabsSideRail {...ALL_FIXTURES["Switching · halfway"]!} />);
    const panels = document.querySelectorAll("[data-phase]");
    expect(panels.length).toBe(2);
    for (const panel of panels) expect(panel.className).toContain("col-start-1");
  });

  it("spreads the motion the VM resolved", () => {
    render(<SectionTabsSideRail {...ALL_FIXTURES["Switching · 35% through a slide"]!} />);
    const entering = document.querySelector<HTMLElement>("[data-phase='entering']");
    expect(entering?.style.transform).toContain("translate3d");
  });

  it("says so rather than rendering empty chrome when there are no tabs", () => {
    render(<SectionTabsSideRail {...ALL_FIXTURES["Empty · no tabs at all"]!} />);
    expect(screen.getByText(/No tabs yet/)).toBeTruthy();
  });
});
