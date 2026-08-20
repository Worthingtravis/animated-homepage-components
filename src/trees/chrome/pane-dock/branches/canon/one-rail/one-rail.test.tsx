import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../pane-dock.fixtures";
import { PaneDockOneRail } from "./one-rail";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("PaneDockOneRail", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PaneDockOneRail {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PaneDockOneRail {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("keeps every door in a single rail and every label the right way up", () => {
    const { container } = render(<PaneDockOneRail {...ALL_FIXTURES["Send page — five docked"]} />);
    expect(container.querySelectorAll("nav")).toHaveLength(1);
    const rotated = Array.from(container.querySelectorAll("span")).filter(
      (el) => (el as HTMLElement).style.writingMode?.startsWith("vertical"),
    );
    expect(rotated).toHaveLength(0);
  });

  it("is the only leaf that shows a door's hint without a hover", () => {
    const { container } = render(<PaneDockOneRail {...ALL_FIXTURES["Send page — five docked"]} />);
    expect(container.textContent).toContain("Search what they said");
  });

  it("renders no rail in `solo`", () => {
    const { container } = render(<PaneDockOneRail {...ALL_FIXTURES.Solo} />);
    expect(container.querySelector("nav")).toBeNull();
  });
});
