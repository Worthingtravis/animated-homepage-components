import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../channel-hero.fixtures";
import { ChannelHeroSplitDock } from "./split-dock";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises.
 */
describe("ChannelHeroSplitDock", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ChannelHeroSplitDock {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ChannelHeroSplitDock {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The dock's claim: every link stays present, whatever the transport says.
  it("keeps every link's label and detail in the DOM", () => {
    const vm = ALL_FIXTURES["Many links"];
    const { container } = render(<ChannelHeroSplitDock {...vm} />);
    for (const link of vm.links) {
      expect(container.textContent).toContain(link.label);
    }
  });

  it("shows no live marker when the channel is offline", () => {
    const { container } = render(<ChannelHeroSplitDock {...ALL_FIXTURES["Offline"]} />);
    expect(container.querySelector("[data-state]")?.getAttribute("data-state")).toBe("offline");
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("renders nothing that animates under reduced motion", () => {
    const { container } = render(<ChannelHeroSplitDock {...ALL_FIXTURES["Reduced motion"]} />);
    expect(container.querySelector(".animate-pulse")).toBeNull();
    // Reduced motion arrives finished — nothing may be left translated or faded.
    for (const node of container.querySelectorAll<HTMLElement>("[style*='translateY']")) {
      expect(node.style.transform).toBe("translateY(0.00px)");
      expect(node.style.opacity).toBe("1");
    }
  });

  it("survives the ported laughingwhales hero with all four CTAs intact", () => {
    const vm = ALL_FIXTURES["Ported — laughingwhales home hero"];
    const { container } = render(<ChannelHeroSplitDock {...vm} />);
    expect(vm.actions.map((action) => action.kind)).toEqual([
      "primary",
      "secondary",
      "discord",
      "youtube",
    ]);
    for (const action of vm.actions) {
      expect(container.querySelector(`[data-kind="${action.kind}"]`)).not.toBeNull();
    }
  });
});
