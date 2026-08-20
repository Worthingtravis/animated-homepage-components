import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE, frameAt } from "../../../layered-poster.fixtures";
import { LayeredPosterBaseline } from "./baseline";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("LayeredPosterBaseline", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<LayeredPosterBaseline {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<LayeredPosterBaseline {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  /*
   * The structural decision: depth is a STARTING scale that the camera spends,
   * not a parallax offset that persists. Mid-entrance the deep plates must be
   * drawn larger than the shallow ones; once settled every plate sits at 1, or
   * the sheet would never resolve into a flat printed object.
   */
  it("draws deep plates larger than shallow ones mid-entrance", () => {
    const { container } = render(<LayeredPosterBaseline {...frameAt(0.3)} />);
    const plates = [...container.querySelectorAll<HTMLElement>("[data-poster-sheet] img")];
    const scaleOf = (el: HTMLElement) =>
      Number(/scale\(([\d.]+)\)/.exec(el.style.transform)?.[1] ?? "1");

    // Plate 0 is the flattest in the fixture, plate 7 the deepest.
    expect(scaleOf(plates[7])).toBeGreaterThan(scaleOf(plates[0]));
  });

  it("puts every plate back at rest once the camera has settled", () => {
    const { container } = render(<LayeredPosterBaseline {...frameAt(1)} />);
    const plates = [...container.querySelectorAll<HTMLElement>("[data-poster-sheet] img")];
    for (const plate of plates) {
      expect(plate.style.transform).toBe("scale(1.0000)");
    }
  });

  /*
   * The plates are decorative and the sheet is not. Thirteen images each
   * announcing "Skyline", "Palms", "Car" is thirteen pieces of noise for one
   * picture — the composition gets ONE accessible name.
   */
  it("announces the sheet once and hides every plate", () => {
    const { container } = render(<LayeredPosterBaseline {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    const sheet = container.querySelector("[data-poster-sheet]");
    expect(sheet?.getAttribute("aria-label")).toBe(ALL_FIXTURES[DEFAULT_FIXTURE].title);
    for (const plate of container.querySelectorAll("[data-poster-sheet] img")) {
      expect(plate.getAttribute("aria-hidden")).toBe("true");
    }
  });

  /* Reduced motion is a resting frame, not a slower entrance. */
  it("renders reduced motion with no transform on any plate", () => {
    const { container } = render(<LayeredPosterBaseline {...ALL_FIXTURES["Reduced motion"]} />);
    for (const plate of container.querySelectorAll<HTMLElement>("[data-poster-sheet] img")) {
      expect(plate.style.transform).toBe("");
      expect(plate.style.filter).toBe("");
    }
  });
});
