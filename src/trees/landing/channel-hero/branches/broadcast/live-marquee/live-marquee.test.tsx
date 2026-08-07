import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../channel-hero.fixtures";
import { ChannelHeroLiveMarquee } from "./live-marquee";

afterEach(cleanup);

describe("ChannelHeroLiveMarquee", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ChannelHeroLiveMarquee {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ChannelHeroLiveMarquee {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  // The marquee's claim: the tally bar tracks transport, and only transport.
  it("widens the tally bar as the entrance runs", () => {
    const width = (name: keyof typeof ALL_FIXTURES) => {
      const { container } = render(<ChannelHeroLiveMarquee {...ALL_FIXTURES[name]} />);
      const bar = container.querySelector<HTMLElement>("[data-state] > div > div");
      const value = Number.parseFloat(bar?.style.width ?? "0");
      cleanup();
      return value;
    };
    expect(width("Arriving")).toBeLessThan(width("Mid entrance"));
    expect(width("Mid entrance")).toBeLessThanOrEqual(width("Live"));
    expect(width("Live")).toBe(100);
  });

  it("shows a full tally bar immediately under reduced motion", () => {
    const { container } = render(<ChannelHeroLiveMarquee {...ALL_FIXTURES["Reduced motion"]} />);
    const bar = container.querySelector<HTMLElement>("[data-state] > div > div");
    expect(Number.parseFloat(bar?.style.width ?? "0")).toBe(100);
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  // Loud is fine; lying is not.
  it("never claims to be live when the channel is offline", () => {
    const vm = ALL_FIXTURES["Offline"];
    const { container } = render(<ChannelHeroLiveMarquee {...vm} />);
    expect(container.textContent).toContain(vm.status?.label);
    expect(container.textContent).not.toContain("LIVE");
  });

  it("keeps links on one horizontal rail", () => {
    const vm = ALL_FIXTURES["Many links"];
    const { container } = render(<ChannelHeroLiveMarquee {...vm} />);
    const rail = container.querySelector("ul");
    expect(rail?.className).toContain("overflow-x-auto");
    expect(rail?.querySelectorAll("li")).toHaveLength(vm.links.length);
  });
});
