import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../channel-hero.fixtures";
import { ChannelHeroStackedBillboard } from "./stacked-billboard";

afterEach(cleanup);

describe("ChannelHeroStackedBillboard", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ChannelHeroStackedBillboard {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(
        () => render(<ChannelHeroStackedBillboard {...vm} />),
        `fixture: ${name}`,
      ).not.toThrow();
      cleanup();
    }
  });

  // The billboard's claim: one axis. Links are a list, never a grid.
  it("renders links as a single divided list", () => {
    const vm = ALL_FIXTURES["Many links"];
    const { container } = render(<ChannelHeroStackedBillboard {...vm} />);
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(1);
    expect(lists[0]?.querySelectorAll("li")).toHaveLength(vm.links.length);
  });

  // With no status the handle takes the pill's place — the slot never goes blank.
  it("falls back to the handle when there is no live strip", () => {
    const vm = ALL_FIXTURES["No status"];
    const { container } = render(<ChannelHeroStackedBillboard {...vm} />);
    expect(container.textContent).toContain(vm.channelHandle);
  });

  it("renders the bare fixture without an empty links region", () => {
    const { container } = render(<ChannelHeroStackedBillboard {...ALL_FIXTURES["Bare — no optionals"]} />);
    expect(container.querySelectorAll("ul")).toHaveLength(0);
  });
});
