import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES, DEFAULT_FIXTURE } from "../../../aurora-headline.fixtures";
import { AuroraHeadlineBaseline } from "./baseline";

afterEach(cleanup);

/**
 * The forest-wide conformance suite already renders this leaf against every
 * fixture. This file is for what only *this* leaf promises — add assertions for
 * the structural decision that makes it different from its siblings.
 */
describe("AuroraHeadlineBaseline", () => {
  it("renders the default fixture with visible content", () => {
    const { container } = render(<AuroraHeadlineBaseline {...ALL_FIXTURES[DEFAULT_FIXTURE]} />);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<AuroraHeadlineBaseline {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it.todo("asserts the structural decision that distinguishes this leaf");
});
