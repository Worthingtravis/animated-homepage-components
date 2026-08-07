/**
 * Page Nav — fixtures.
 *
 * Frozen instants (the buttons in the lab) plus `frameAt`, a pure function that
 * produces a *coherent* VM at any point on the condensation transport. The lab's
 * clock drives `frameAt` — overriding `progress` alone would let `state` claim
 * the bar is still at the top while it has visibly shrunk.
 *
 * Two shapes dominate here on purpose:
 *   • `Creator page tabs` — laughingwhales.com's creator nav, lifted through
 *     `adaptPageTabBar`. No brand, no actions, a scrolling track.
 *   • `Marketing bar` — brand mark, a few links, one loud call to action.
 * Every leaf has to answer both, which is the whole claim of this tree.
 */

import {
  adaptPageTabBar,
  buildAction,
  buildBrand,
  buildItem,
  clampProgress,
  formatBadge,
  resolvePageNavState,
  type PageNavImage,
  type PageNavOverflow,
  type PageNavVM,
  type PageTabBarPropsLike,
} from "./page-nav.vm";

const noop = () => {};

/**
 * The real Laughing Whales mark, vendored into this repo's `public/forest/`.
 * Vendored rather than linked: a fixture that reaches a CDN is a fixture that
 * can fail in CI for a reason that has nothing to do with the component.
 */
const BRAND_MARK: PageNavImage = {
  src: "/forest/laughingwhales.png",
  alt: "Laughing Whales",
  width: 256,
  height: 256,
};

const RAW_ITEMS = [
  { id: "features", label: "Features", href: "/features" },
  { id: "pricing", label: "Pricing", href: "/pricing" },
  { id: "blog", label: "Blog", href: "/blog" },
  { id: "docs", label: "Docs", href: "/docs" },
];

const BRAND = buildBrand({ label: "Laughing Whales", href: "/", image: BRAND_MARK });

const CTA = buildAction({
  id: "try",
  label: "Try for free",
  href: "/signup",
  emphasis: "primary",
  tooltip: "Start a free account",
  onActivate: noop,
});

/**
 * Creators' accents used to live here as fixture DATA, because this tree once
 * carried a `theme` field. It does not any more — a creator's colours arrive as
 * ambient CSS variables from the page wrapper, not through the VM.
 *
 * The accents themselves did not disappear; they moved to
 * `EDITOR_MODE_PRESETS` in `src/lib/editor-mode-presets.ts`, where they theme
 * every leaf in the forest rather than only this tree's. The conformance suite
 * renders each leaf inside a `CreatorSurface` wearing them.
 */

const OVERFLOW: PageNavOverflow = {
  canScrollBack: true,
  canScrollForward: true,
  onScrollBack: noop,
  onScrollForward: noop,
  backLabel: "Scroll tabs left",
  forwardLabel: "Scroll tabs right",
};

/**
 * The continuum. Everything below is a frozen sample of this function, so a
 * fixture can never describe a state the running component cannot reach.
 */
export function frameAt(progress: number, overrides: Partial<PageNavVM> = {}): PageNavVM {
  const clamped = clampProgress(progress);
  const items = RAW_ITEMS.map((raw) => buildItem(raw, "pricing"));
  return {
    state: resolvePageNavState(items.length, clamped),
    progress: clamped,
    reducedMotion: false,
    ariaLabel: "Main",
    brand: BRAND,
    items,
    actions: [CTA],
    overflow: null,
    menu: null,
    ...overrides,
  };
}

/** The bar at the top of the page — nothing condensed yet. */
export const AT_TOP = frameAt(0);

export const MID_CONDENSE = frameAt(0.5);

export const CONDENSED = frameAt(1);

/** The screenshot this tree was curated against: brand · links · one loud CTA. */
export const MARKETING_BAR = frameAt(0);

/** No brand mark — the wordmark has to carry the left edge on its own. */
export const NO_BRAND_IMAGE = frameAt(0, {
  brand: buildBrand({ label: "Laughing Whales", href: "/" }),
});

/** No brand at all. This is the shape the creator page nav arrives in. */
export const NO_BRAND = frameAt(0, { brand: null });

/** Links only — no call to action anywhere. */
export const NO_ACTIONS = frameAt(0, { actions: [] });

/** Two quiet actions plus the loud one. Emphasis is pre-resolved, not positional. */
export const MANY_ACTIONS = frameAt(0, {
  actions: [
    buildAction({ id: "login", label: "Log in", href: "/login", onActivate: noop }),
    buildAction({ id: "docs", label: "Docs", href: "/docs", onActivate: noop }),
    CTA,
  ],
});

export const WITH_BADGES = frameAt(0, {
  items: [
    buildItem({ ...RAW_ITEMS[0], badge: formatBadge(3) }, "pricing"),
    buildItem(RAW_ITEMS[1], "pricing"),
    buildItem({ ...RAW_ITEMS[2], badge: formatBadge(128) }, "pricing"),
    buildItem({ ...RAW_ITEMS[3], badge: "New" }, "pricing"),
  ],
});

/** A track wide enough to need its chevrons. Both edges scrollable. */
export const OVERFLOWING = frameAt(0, {
  ariaLabel: "Pages",
  brand: null,
  actions: [],
  overflow: OVERFLOW,
  items: Array.from({ length: 11 }, (_, index) =>
    buildItem(
      { id: `page-${index}`, label: `Page ${index + 1}`, onSelect: noop },
      "page-3",
    ),
  ),
});

/** Scrolled to the start — the back chevron must not offer a move that does nothing. */
export const OVERFLOW_AT_START = frameAt(0, {
  ...OVERFLOWING,
  overflow: { ...OVERFLOW, canScrollBack: false },
});

export const MENU_OPEN = frameAt(0, {
  menu: { state: "open", label: "Close", onToggle: noop },
});

export const MENU_CLOSED = frameAt(0, {
  menu: { state: "closed", label: "Menu", onToggle: noop },
});

export const LONG_LABELS = frameAt(0, {
  brand: buildBrand({ label: "Laughing Whales Creator Tools International", href: "/" }),
  items: [
    buildItem({ id: "a", label: "Everything the platform can do for you", href: "/a" }, "b"),
    buildItem({ id: "b", label: "Pricing, plans and enterprise agreements", href: "/b" }, "b"),
    buildItem({ id: "c", label: "Engineering blog and release notes", href: "/c" }, "b"),
  ],
  actions: [
    buildAction({
      id: "try",
      label: "Start your free fourteen day trial",
      href: "/signup",
      emphasis: "primary",
      onActivate: noop,
    }),
  ],
});

/** One item. Leaves must not rely on a row of them for balance. */
export const SINGLE_ITEM = frameAt(0, {
  items: [buildItem({ id: "docs", label: "Docs", href: "/docs" }, "docs")],
});

/** Nothing active — a nav on a route none of its items own. */
export const NOTHING_ACTIVE = frameAt(0, {
  items: RAW_ITEMS.map((raw) => buildItem(raw, "")),
});

/** Condensed and reduced-motion: the end state, arrived at without animating. */
export const REDUCED_MOTION = frameAt(1, { reducedMotion: true });

export const EMPTY = frameAt(0, {
  state: "empty",
  brand: null,
  items: [],
  actions: [],
  overflow: null,
  menu: null,
});

/* ------------------------------------------------------------------ *
 * The portability fixture.
 * ------------------------------------------------------------------ */

/**
 * Verbatim props from laughingwhales.com's creator `PageTabBar` — a creator
 * page with several tabs and one active. Kept in the shape that component
 * actually takes, so if its props drift this fixture is the alarm.
 */
export const CREATOR_TAB_BAR_PROPS: PageTabBarPropsLike = {
  pages: [
    { id: "home", label: "Home" },
    { id: "builds", label: "Builds" },
    { id: "clips", label: "Clips" },
    { id: "guides", label: "Guides" },
    { id: "about", label: "About" },
  ],
  activePage: "builds",
  onSetActivePage: noop,
};

/**
 * The creator nav, lifted. It is here to be *rendered*: the conformance suite
 * runs every leaf against it, so "the creator page nav and the marketing bar
 * are the same component" is a passing test rather than a claim.
 */
export const CREATOR_TABS = adaptPageTabBar(CREATOR_TAB_BAR_PROPS, {
  ariaLabel: "Pages",
  overflow: { ...OVERFLOW, canScrollBack: false },
});

/**
 * The same nav with a later tab active. Not a theme variant — the accent is no
 * longer fixture data — but it still earns its place: the active item is now
 * mid-track rather than second, which is where a leaf that positions its
 * active marker by index rather than by `item.state` gives itself away.
 */
export const CREATOR_TABS_MID = adaptPageTabBar(
  { ...CREATOR_TAB_BAR_PROPS, activePage: "clips" },
  { ariaLabel: "Pages" },
);

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Marketing bar": MARKETING_BAR,
  "Creator page tabs": CREATOR_TABS,
  "Creator tabs — mid-track active": CREATOR_TABS_MID,
  "At top": AT_TOP,
  "Mid condense": MID_CONDENSE,
  "Condensed": CONDENSED,
  "Reduced motion": REDUCED_MOTION,
  "No brand image": NO_BRAND_IMAGE,
  "No brand": NO_BRAND,
  "No actions": NO_ACTIONS,
  "Many actions": MANY_ACTIONS,
  "With badges": WITH_BADGES,
  "Overflowing": OVERFLOWING,
  "Overflow at start": OVERFLOW_AT_START,
  "Menu open": MENU_OPEN,
  "Menu closed": MENU_CLOSED,
  "Long labels": LONG_LABELS,
  "Single item": SINGLE_ITEM,
  "Nothing active": NOTHING_ACTIVE,
  "Empty": EMPTY,
} satisfies Record<string, PageNavVM>;

export type PageNavFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: PageNavFixtureName = "Marketing bar";
