import { afterEach, beforeEach, expect } from "vitest";
import "@testing-library/jest-dom/vitest";

/**
 * jsdom implements no media queries, and every connected container in this
 * forest asks for `prefers-reduced-motion` on mount. Without this, testing a
 * container is impossible and the reduced-motion path — the one a leaf must
 * honour — is the one thing that can never be exercised.
 *
 * It reports "no preference", which is the browser default. A test that needs
 * the other answer overrides this per-test.
 */
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

/**
 * React's warnings are findings, not noise.
 *
 * The conformance suite asserts on structure — `@container` on the rendered
 * root, no `NaN`, no `undefined` — and it stayed green for the whole life of a
 * real defect: `finding/clip-picker`'s deck flattened six shelves into one list
 * and kept keying by `card.id`, so a clip that legitimately sat in two shelves
 * produced duplicate keys and React was free to drop or double it. The warning
 * was printed on every run. Nothing read it.
 *
 * So the render suite fails on `console.error`. Every warning React emits here
 * — duplicate keys, invalid nesting, unknown props, act() violations — is a
 * statement that the DOM is not what the leaf thinks it is, and this forest's
 * whole argument is that a rule nobody can break accidentally is a test rather
 * than a habit.
 *
 * A test that MEANS to provoke one restores the spy itself.
 */
const consoleError = console.error;
let captured: string[] = [];

beforeEach(() => {
  captured = [];
  console.error = (...args: unknown[]) => {
    captured.push(args.map((arg) => String(arg)).join(" "));
    consoleError(...args);
  };
});

afterEach(() => {
  console.error = consoleError;
  const seen = captured;
  captured = [];
  expect(seen, `React logged ${seen.length} error(s):\n${seen.join("\n")}`).toEqual([]);
});
