import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../pane-dock.fixtures";
import { PaneDockDoorRow } from "./door-row";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("PaneDockDoorRow", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<PaneDockDoorRow {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<PaneDockDoorRow {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("puts every docked pane in ONE nav, whatever slot it would open into", () => {
    const { container } = render(<PaneDockDoorRow {...ALL_FIXTURES["Send page — five docked"]} />);
    const navs = container.querySelectorAll("nav");
    expect(navs).toHaveLength(1);
    expect(navs[0]?.querySelectorAll("button")).toHaveLength(5);
  });

  it("renders NO dock chrome at all in `solo` — the state the contract exists for", () => {
    const { container } = render(<PaneDockDoorRow {...ALL_FIXTURES.Solo} />);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("orders doors in the layout's own reading order, not the VM's", () => {
    const { container } = render(<PaneDockDoorRow {...ALL_FIXTURES["Send page — five docked"]} />);
    const slots = Array.from(
      container.querySelectorAll("nav button"),
      (el) => el.getAttribute("data-slot"),
    );
    expect(slots).toEqual(["lead", "lead", "support", "support", "aside"]);
  });

  it("holds no gutter open for a column with no panes", () => {
    const { container } = render(<PaneDockDoorRow {...ALL_FIXTURES.Solo} />);
    expect(container.querySelectorAll("[data-slot=\"lead\"]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-slot=\"aside\"]")).toHaveLength(0);
  });
});
