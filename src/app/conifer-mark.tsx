/**
 * The forest's mark.
 *
 * The same two-tier conifer the favicon draws (`src/app/icon.svg`), as an
 * inline glyph. It replaced two different tree emoji — 🌲 in the brand and 🌳
 * on every card — which were not one icon family but two, rendered by whatever
 * font the visitor's platform happened to supply, at a weight nobody chose.
 *
 * It is `currentColor` on purpose. A card is a hairline plate carrying exactly
 * one coloured element, and that element is its action; a mark painted in the
 * accent would be a second voice saying nothing. Inheriting the ink also means
 * the mark themes for free wherever the ink does.
 *
 * `align-[-0.15em]` is the icon-font trick and it is the reason this can drop
 * into a baseline-aligned row where the emoji used to sit, with nothing else
 * moving.
 */
export function ConiferMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M12 2 17.5 11 6.5 11Z" />
      <path d="M12 8 20.5 18 3.5 18Z" />
      <path d="M10.8 17h2.4v5h-2.4z" />
    </svg>
  );
}
