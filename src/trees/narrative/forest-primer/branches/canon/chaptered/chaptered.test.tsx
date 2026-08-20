import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ALL_FIXTURES,
  DEFAULT_FIXTURE,
  frameAt,
  REDUCED_MOTION,
} from "../../../forest-primer.fixtures";
import { ForestPrimerChaptered } from "./chaptered";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises.
 */
describe("ForestPrimerChaptered", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<ForestPrimerChaptered {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<ForestPrimerChaptered {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  /**
   * The structural decision: one article per chapter, each carrying the
   * position the CONTAINER decided. If this leaf ever computed the position
   * itself, this is where it would start disagreeing with its siblings.
   */
  it("marks every chapter with the position it was handed", () => {
    const vm = frameAt(0.42);
    const { container } = render(<ForestPrimerChaptered {...vm} />);
    const articles = Array.from(container.querySelectorAll("[data-chapter]"));
    expect(articles).toHaveLength(vm.chapters.length);
    expect(articles.map((article) => article.getAttribute("data-position"))).toEqual(
      vm.chapters.map((chapter) => chapter.position),
    );
  });

  it("draws every figure kind the contract can carry", () => {
    const vm = frameAt(1);
    const { container } = render(<ForestPrimerChaptered {...vm} />);
    // One tell per figure: the nesting boxes, the transport knob's printed
    // value, the struck computation, the matrix ticks and the chain.
    expect(container.querySelectorAll("[data-level]").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[data-tone]").length).toBe(3);
    expect(container.querySelectorAll("[data-ticked]").length).toBeGreaterThan(0);
    expect(container.textContent).toContain("progress: number");
    expect(container.textContent).toContain("58 × 79 × 60 cm");
    expect(container.textContent).toContain("Nothing to keep in sync.");
  });

  it("prints no number it was not handed as a string", () => {
    const vm = frameAt(0.42);
    const knob = vm.chapters[2].figure;
    if (knob.kind !== "transport") throw new Error("chapter 3 is not the transport chapter");
    const { container } = render(<ForestPrimerChaptered {...vm} />);
    expect(container.textContent).toContain(knob.knobLabel);
  });

  /**
   * Reduced motion is not a slower primer. Nothing is offset, nothing is faded,
   * and every chapter is already here — which is a property of the rendered
   * output, not of a CSS class somebody could delete.
   */
  it("leaves nothing displaced under reduced motion", () => {
    const { container } = render(<ForestPrimerChaptered {...REDUCED_MOTION} />);
    for (const article of container.querySelectorAll<HTMLElement>("[data-chapter]")) {
      expect(article.style.transform).toBe("");
      expect(article.style.opacity).toBe("");
      expect(article.getAttribute("data-position")).toBe("active");
    }
  });

  it("renders no chapters at all when there are none", () => {
    const { container } = render(<ForestPrimerChaptered {...ALL_FIXTURES["Empty"]} />);
    expect(container.querySelectorAll("[data-chapter]")).toHaveLength(0);
  });
});
