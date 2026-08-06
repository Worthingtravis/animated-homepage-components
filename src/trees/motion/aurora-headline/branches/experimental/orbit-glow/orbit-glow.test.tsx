import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES } from "../../../aurora-headline.fixtures";
import { AuroraHeadlineOrbitGlow } from "./orbit-glow";

afterEach(cleanup);

describe("AuroraHeadlineOrbitGlow", () => {
  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<AuroraHeadlineOrbitGlow {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("shows the headline when there is content", () => {
    const vm = ALL_FIXTURES["Active — mid"];
    const { getByText } = render(<AuroraHeadlineOrbitGlow {...vm} />);
    expect(getByText(vm.headline)).toBeTruthy();
  });

  it("renders a resting frame under reduced motion", () => {
    const { container } = render(<AuroraHeadlineOrbitGlow {...ALL_FIXTURES["Reduced motion"]} />);
    expect(container.innerHTML).not.toContain("NaN");
  });
});
