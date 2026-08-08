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
