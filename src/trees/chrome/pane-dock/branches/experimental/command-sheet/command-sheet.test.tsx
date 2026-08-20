import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../pane-dock.fixtures";
import { PaneDockCommandSheet } from "./command-sheet";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("PaneDockCommandSheet", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PaneDockCommandSheet {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PaneDockCommandSheet {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("costs the same header for five docked panes as for twelve", () => {
    const five = render(<PaneDockCommandSheet {...ALL_FIXTURES.Narrow} />);
    const fiveTriggers = five.container.querySelectorAll("[data-dock-trigger]").length;
    expect(fiveTriggers).toBe(1);
    cleanup();
    const many = render(<PaneDockCommandSheet {...ALL_FIXTURES["Many docked"]} />);
    expect(many.container.querySelectorAll("[data-dock-trigger]").length).toBe(fiveTriggers);
  });

  it("lists every door only once the VM says the sheet is open", () => {
    const closed = render(<PaneDockCommandSheet {...ALL_FIXTURES.Narrow} />);
    expect(closed.container.querySelectorAll("nav button")).toHaveLength(0);
    cleanup();
    const open = render(<PaneDockCommandSheet {...ALL_FIXTURES["Narrow — sheet open"]} />);
    expect(open.container.querySelectorAll("nav button")).toHaveLength(5);
  });

  it("falls back to inline doors when the container offered no disclosure", () => {
    const { container } = render(<PaneDockCommandSheet {...ALL_FIXTURES["Send page — five docked"]} />);
    expect(container.querySelectorAll("[data-dock-trigger]")).toHaveLength(0);
    expect(container.querySelectorAll("nav button")).toHaveLength(5);
  });

  it("renders no trigger and no sheet in `solo`", () => {
    const { container } = render(<PaneDockCommandSheet {...ALL_FIXTURES.Solo} />);
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelectorAll("[data-dock-trigger]")).toHaveLength(0);
  });
});
