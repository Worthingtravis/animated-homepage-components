import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../channel-hero.fixtures";
import { ChannelHeroPosterWall } from "./poster-wall";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. What is asserted here is only what *this* leaf promises.
 */
describe("ChannelHeroPosterWall", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ChannelHeroPosterWall {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ChannelHeroPosterWall {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  const wordmark = (name: keyof typeof ALL_FIXTURES) => {
    const { container } = render(<ChannelHeroPosterWall {...ALL_FIXTURES[name]} />);
    const slab = container.querySelector<HTMLElement>("[data-poster-wordmark]");
    const value = Number.parseFloat(slab?.style.clipPath?.match(/[\d.]+/)?.[0] ?? "0");
    cleanup();
    return value;
  };

  const cameraScale = (name: keyof typeof ALL_FIXTURES) => {
    const { container } = render(<ChannelHeroPosterWall {...ALL_FIXTURES[name]} />);
    const camera = container.querySelector<HTMLElement>("[data-poster-camera]");
    const value = Number.parseFloat(camera?.style.transform.match(/[\d.]+/)?.[0] ?? "0");
    cleanup();
    return value;
  };

  // The camera move: the poster starts overscanned and settles back to frame.
  it("pushes the whole poster back to frame as the entrance runs", () => {
    expect(cameraScale("Arriving")).toBeGreaterThan(cameraScale("Mid entrance"));
    expect(cameraScale("Mid entrance")).toBeGreaterThan(cameraScale("Live"));
    expect(cameraScale("Live")).toBe(1);
  });

  // The wordmark is signed last: still clipped while the mosaic is arriving.
  it("wipes the wordmark up out of its hole, after the panels", () => {
    expect(wordmark("Arriving")).toBe(100);
    expect(wordmark("Mid entrance")).toBeGreaterThan(wordmark("Live"));
    expect(wordmark("Live")).toBe(0);
  });

  it("renders the resting poster immediately under reduced motion", () => {
    expect(cameraScale("Reduced motion")).toBe(1);
    expect(wordmark("Reduced motion")).toBe(0);
    const { container } = render(<ChannelHeroPosterWall {...ALL_FIXTURES["Reduced motion"]} />);
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  /**
   * The structural decision. A poster's logo hole is a hole: the wordmark takes
   * a cell of the mosaic rather than floating over one, so no link is ever
   * printed underneath it.
   */
  it("gives the wordmark its own cell and keeps every panel readable", () => {
    const vm = ALL_FIXTURES["Many links"];
    const { container } = render(<ChannelHeroPosterWall {...vm} />);
    const slab = container.querySelector<HTMLElement>("[data-poster-wordmark]");
    expect(slab?.className).not.toContain("absolute");
    const panels = container.querySelectorAll("[data-poster-panel]");
    expect(panels).toHaveLength(vm.links.length);
    for (const link of vm.links) {
      expect(container.textContent).toContain(link.label);
    }
  });

  it("never claims to be live when the channel is offline", () => {
    const vm = ALL_FIXTURES["Offline"];
    const { container } = render(<ChannelHeroPosterWall {...vm} />);
    expect(container.textContent).toContain(vm.status?.label);
    expect(container.textContent).not.toContain("LIVE");
  });
});
