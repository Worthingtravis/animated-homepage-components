import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES } from "../../../aurora-headline.fixtures";
import { AuroraHeadlineStackedRule } from "./stacked-rule";

afterEach(cleanup);

describe("AuroraHeadlineStackedRule", () => {
  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<AuroraHeadlineStackedRule {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("shows the headline when there is content", () => {
    const vm = ALL_FIXTURES["Active — mid"];
    const { getByText } = render(<AuroraHeadlineStackedRule {...vm} />);
    expect(getByText(vm.headline)).toBeTruthy();
  });

  it("renders a resting frame under reduced motion", () => {
    const { container } = render(<AuroraHeadlineStackedRule {...ALL_FIXTURES["Reduced motion"]} />);
    expect(container.innerHTML).not.toContain("NaN");
  });
});
