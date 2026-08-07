/**
 * Page Nav — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * This is a *chrome* tree: furniture that persists while the page scrolls under
 * it. Its transport is **condensation** — `progress` runs 0..1 as the page
 * leaves the top, and a leaf reads it to shrink, tighten or detach. It is not
 * an entrance and it does not loop.
 *
 * ── Where the contract came from ───────────────────────────────────────────
 * laughingwhales.com's creator pages navigate with `PageTabBar` → `CreatorTabBar`
 * (`src/app/creators/[slug]/components/`): a horizontally scrollable segmented
 * track of page tabs, exactly one active, chevron affordances at the edges when
 * it overflows, and two visual styles (`default` glass, `pill` capsule). That
 * component takes raw props and owns its own scroll state, so it could not be
 * swapped for a different-looking nav without a rewrite.
 *
 * This tree is that nav's contract, generalised just far enough to also express
 * a marketing navbar — brand mark on the left, links in the middle, a call to
 * action on the right. Both are the same data:
 *
 *   items with exactly one active     → items[] + item.state
 *   chevrons when the track overflows → overflow
 *   a brand mark                      → brand   (null on the creator bar)
 *   a call to action                  → actions (empty on the creator bar)
 *   a mobile disclosure               → menu
 *
 * `adaptPageTabBar()` below lifts the creator bar's props into this contract in
 * one pure call, and the `Creator page tabs` fixture renders through every leaf
 * in the conformance suite — so "these are the same component" is a passing
 * test, not an opinion.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string. Badge counts arrive as
 *    "12", never as a number a leaf would have to render.
 *  - Every user action is a callback or an href. Never an id a leaf resolves.
 *  - Transport (progress) is a VM prop. The container owns the scroll listener.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

/** Explicit visual state. `empty` means there is nothing to navigate to. */
export type PageNavState = "idle" | "condensed" | "empty";

/** Resolved by the container. A leaf switches on this, never on an index. */
export type PageNavItemState = "active" | "idle";

/** Pre-resolved visual weight. A leaf never decides emphasis from position. */
export type PageNavEmphasis = "primary" | "quiet";

export type PageNavImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type PageNavItem = {
  id: string;
  label: string;
  /** Pre-formatted trailing badge — "12", "New". Never a number. */
  badge: string | null;
  state: PageNavItemState;
  /**
   * A destination, or `null` when the item is a control rather than a link —
   * which is how the creator tab bar works. Exactly one of `href` / `onSelect`
   * is meaningful; a leaf renders an anchor for the first and a button for the
   * second, and must not invent a handler when both are absent.
   */
  href: string | null;
  onSelect: (() => void) | null;
};

export type PageNavAction = {
  id: string;
  label: string;
  href: string;
  emphasis: PageNavEmphasis;
  /** Tooltip / aria text saying exactly where the action goes. */
  tooltip: string;
  external: boolean;
  onActivate?: () => void;
};

export type PageNavBrand = {
  /** Wordmark text — "Saasternity", a creator's display name. */
  label: string;
  href: string;
  /** Optional mark beside the wordmark. `null` renders `initial` instead. */
  image: PageNavImage | null;
  /** Pre-computed single character for the fallback mark. Never derived in a leaf. */
  initial: string;
};

/**
 * Edge affordances for a track that scrolls. `null` when the nav does not
 * overflow — a leaf must not render disabled chevrons to fill the space.
 */
export type PageNavOverflow = {
  canScrollBack: boolean;
  canScrollForward: boolean;
  onScrollBack: () => void;
  onScrollForward: () => void;
  backLabel: string;
  forwardLabel: string;
};

/**
 * ── On theming ─────────────────────────────────────────────────────────────
 * This tree used to carry a `theme` field holding a creator's accent, which
 * every leaf spread onto its root as `--nav-accent` / `--nav-track` /
 * `--nav-glow`. That was the wrong shape and it has been retired.
 *
 * On laughingwhales.com a creator's colours arrive as **ambient CSS variables**
 * on the creator-page wrapper — `--primary`, `--accent`, `--ring` — and that
 * page's own `CreatorTabBar` simply styles itself `bg-primary/20 text-primary
 * ring-primary/30` and inherits them. It sets no `--nav-*` variable anywhere.
 * Threading the accent through the VM therefore made this the only tree whose
 * leaves needed a container to build and pass a theme object before they would
 * wear a creator's brand, while every other leaf in the forest got it for free.
 *
 * Leaves here now do what upstream does: style in `primary` / `accent` / `ring`
 * and inherit. See `src/lib/editor-mode.ts` for the contract and
 * `src/lib/creator-surface.tsx` for the wrapper that supplies it.
 *
 * (`accentForDarkBg` — cited by the old field — is real, but it serves
 * `getCreatorNavAccent`, which has one call site: the *platform* nav on
 * custom-domain requests, outside the creator wrapper. It never themed the
 * creator's own tab bar.)
 */

/** Mobile disclosure. `null` when every item fits without one. */
export type PageNavMenu = {
  state: "open" | "closed";
  /** Pre-formatted trigger label — "Menu", "Close". */
  label: string;
  onToggle: () => void;
};

export type PageNavVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: PageNavState;

  /**
   * Condensation transport, normalized 0..1. The container drives it from
   * scroll position; fixtures pin it to a reproducible instant.
   */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** Accessible name for the surrounding `<nav>`. Never null. */
  ariaLabel: string;

  brand: PageNavBrand | null;
  items: PageNavItem[];
  actions: PageNavAction[];
  overflow: PageNavOverflow | null;
  menu: PageNavMenu | null;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER or in fixtures, never in a leaf.
 * ------------------------------------------------------------------ */

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Turn a raw scroll offset into condensation transport. One decision, made
 * once — a leaf that picked its own threshold would disagree with its siblings
 * about when the bar is "condensed".
 */
export function resolveCondensation(scrollY: number, overPx = 96): number {
  if (!Number.isFinite(scrollY) || overPx <= 0) return 0;
  return clampProgress(scrollY / overPx);
}

/** Collapse transport and content to the discrete state. */
export function resolvePageNavState(itemCount: number, progress: number): PageNavState {
  if (itemCount === 0) return "empty";
  // Half-condensed still reads as condensed — the bar has visibly committed.
  return clampProgress(progress) >= 0.5 ? "condensed" : "idle";
}

/** Pre-format a badge count. Runs in the container — never in a leaf. */
export function formatBadge(count: number | null, max = 99): string | null {
  if (count === null || !Number.isFinite(count) || count <= 0) return null;
  return count > max ? `${max}+` : String(count);
}

/** Pre-compute a brand's fallback initial. Runs in the container, not a leaf. */
export function brandInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || "•";
}

/**
 * The one place a raw item becomes a VM item. Fixtures, the container and
 * `adaptPageTabBar` all go through it, so they cannot drift apart.
 */
export function buildItem(
  raw: {
    id: string;
    label: string;
    badge?: string | null;
    href?: string | null;
    onSelect?: (() => void) | null;
  },
  activeId: string,
): PageNavItem {
  return {
    id: raw.id,
    label: raw.label,
    badge: raw.badge ?? null,
    state: raw.id === activeId ? "active" : "idle",
    href: raw.href ?? null,
    onSelect: raw.onSelect ?? null,
  };
}

export function buildAction(raw: {
  id: string;
  label: string;
  href: string;
  emphasis?: PageNavEmphasis;
  tooltip?: string;
  onActivate?: () => void;
}): PageNavAction {
  return {
    id: raw.id,
    label: raw.label,
    href: raw.href,
    emphasis: raw.emphasis ?? "quiet",
    tooltip: raw.tooltip ?? raw.label,
    external: /^https?:\/\//.test(raw.href),
    onActivate: raw.onActivate,
  };
}

export function buildBrand(raw: {
  label: string;
  href: string;
  image?: PageNavImage | null;
}): PageNavBrand {
  return {
    label: raw.label,
    href: raw.href,
    image: raw.image ?? null,
    initial: brandInitial(raw.label),
  };
}

/* ------------------------------------------------------------------ *
 * The port. Structural — this file never imports from laughingwhales, so any
 * object shaped like the creator tab bar's props satisfies it.
 * ------------------------------------------------------------------ */

/** Structural mirror of laughingwhales' `CreatorTabStyle`. */
export type CreatorTabStyleLike = "default" | "pill";

/** Structural mirror of laughingwhales' `PageTabBarProps`. */
export type PageTabBarPropsLike = {
  pages: Array<{ id: string; label: string }>;
  activePage: string;
  onSetActivePage: (id: string) => void;
  /** The creator's chosen chrome. Today the page builder offers exactly these two. */
  tabStyle?: CreatorTabStyleLike;
};

/**
 * The creator page builder's Tabs dropdown — `DEFAULT` / `PILL` — is already a
 * variant switch. It maps 1:1 onto leaf refs on this tree, so the setting a
 * creator has already saved picks a leaf without a migration.
 *
 * Every other leaf here is a *new* option that dropdown could offer.
 */
export const TAB_STYLE_LEAF: Record<CreatorTabStyleLike, string> = {
  default: "canon/glass-track",
  pill: "canon/pill-track",
};

export function leafForTabStyle(style: CreatorTabStyleLike | undefined): string {
  return TAB_STYLE_LEAF[style ?? "default"];
}

/**
 * Lift laughingwhales' creator `PageTabBar` props into this contract. Pure —
 * safe in a fixture, a server component, or a container.
 *
 * The creator bar has no brand and no actions, so both come out empty and every
 * leaf on this tree renders it as the segmented control it already was. Scroll
 * affordances are the caller's to supply, because whether the track overflows
 * is a measurement — and measurements belong to the container.
 */
export function adaptPageTabBar(
  props: PageTabBarPropsLike,
  extras: {
    ariaLabel?: string;
    progress?: number;
    reducedMotion?: boolean;
    overflow?: PageNavOverflow | null;
    brand?: PageNavBrand | null;
    actions?: PageNavAction[];
    menu?: PageNavMenu | null;
  } = {},
): PageNavVM {
  const items = props.pages.map((page) =>
    buildItem(
      {
        id: page.id,
        label: page.label,
        onSelect: () => props.onSetActivePage(page.id),
      },
      props.activePage,
    ),
  );

  const progress = clampProgress(extras.progress ?? 0);

  return {
    state: resolvePageNavState(items.length, progress),
    progress,
    reducedMotion: extras.reducedMotion ?? false,
    ariaLabel: extras.ariaLabel ?? "Pages",
    brand: extras.brand ?? null,
    items,
    actions: extras.actions ?? [],
    overflow: extras.overflow ?? null,
    menu: extras.menu ?? null,
  };
}

export const PAGE_NAV_EMPTY: PageNavVM = {
  state: "empty",
  progress: 0,
  reducedMotion: false,
  ariaLabel: "Pages",
  brand: null,
  items: [],
  actions: [],
  overflow: null,
  menu: null,
};
