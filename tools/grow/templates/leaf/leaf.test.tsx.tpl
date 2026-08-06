import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ALL_FIXTURES } from "../../../__TREE__.fixtures";
import { __LEAF_EXPORT__ } from "./__LEAF__";

afterEach(cleanup);

describe("__LEAF_EXPORT__", () => {
  it("renders every fixture without throwing", () => {
    for (const [name, vm] of Object.entries(ALL_FIXTURES)) {
      expect(() => render(<__LEAF_EXPORT__ {...vm} />), `fixture: ${name}`).not.toThrow();
      cleanup();
    }
  });

  it("shows the headline when there is content", () => {
    const vm = ALL_FIXTURES["Active — mid"];
    const { getByText } = render(<__LEAF_EXPORT__ {...vm} />);
    expect(getByText(vm.headline)).toBeTruthy();
  });

  it("renders a resting frame under reduced motion", () => {
    const { container } = render(<__LEAF_EXPORT__ {...ALL_FIXTURES["Reduced motion"]} />);
    expect(container.innerHTML).not.toContain("NaN");
  });
});
