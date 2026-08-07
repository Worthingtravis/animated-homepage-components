/**
 * Section Tabs — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * ── What this tree is for ──────────────────────────────────────────────────
 * Every other tree in the forest owns *what a section looks like*. This one
 * owns *which section you are looking at*. It exists so that any section on a
 * page can be put behind a tab without the section learning anything — no
 * `isActive` prop, no tab registration, no context. A section is handed to this
 * tree as an opaque `content` node and this tree decides whether it is on
 * screen, how it arrives, and what chrome selects it.
 *
 * That is why `SectionTabsPanel.content` is a `ReactNode` rather than a string.
 * It is the one field in this forest that is deliberately opaque: the tree
 * never reads it, never measures it, never styles its inside. Everything a leaf
 * needs to lay a panel out — its phase, its motion, its accessible wiring —
 * arrives beside the node as resolved data.
 *
 * ── The three axes of modularity ───────────────────────────────────────────
 *  1. WHICH SECTIONS live behind which tab       → the caller's layout, an input
 *  2. HOW THE TABS LOOK  (track / rail / popover / hover dock)
 *                                                → a LEAF on this tree
 *  3. HOW PANELS CHANGE  (fade / slide / scale / lift / none)
 *                                                → a TRANSITION preset, resolved
 *                                                  in the container, delivered as
 *                                                  `panel.motion.style`
 *
 * Axes 2 and 3 are independent on purpose. A transition is a pure function of
 * (phase, progress, direction, reducedMotion) — see `section-tabs.transitions.ts`
 * — so every preset composes with every leaf, and neither has to know the other
 * exists. If motion lived inside a leaf, picking a slide would mean picking a
 * side rail too.
 *
 * ── Transport ──────────────────────────────────────────────────────────────
 * `progress` runs 0..1 across ONE tab change and settles at 1. It is not a loop
 * and not a scroll. `frameAt(p)` in the fixtures samples the same change, so the
 * lab's clock scrubs a real tab switch rather than nudging an unrelated number.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string. Counts arrive as "4".
 *  - Every user action is a callback. Never an id a leaf resolves against state.
 *  - Transport (progress) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - Overlay placement is DATA. Collision detection is a measurement and
 *    measurements belong to the container (or to Radix inside it), never to a
 *    leaf deciding for itself whether a popover fits.
 *  - No hooks, no fetches, no side effects in this file.
 */

import type { CSSProperties, ReactNode } from "react";

/** Explicit visual state. `empty` means there is nothing to tab between. */
export type SectionTabsState = "idle" | "switching" | "empty";

/** Resolved by the container. A leaf switches on this, never on an index. */
export type SectionTabsTabState = "active" | "idle" | "disabled";

/**
 * Where a panel is in the current change. `hidden` panels are still in the VM
 * so a leaf can choose to keep them mounted (a crossfade needs both); a leaf
 * that mounts only the active one is equally correct.
 */
export type SectionTabsPanelPhase = "entering" | "active" | "leaving" | "hidden";

/**
 * Structural hint for chrome that cannot adapt with CSS alone. Most responsive
 * behaviour in a leaf should still be plain Tailwind breakpoints — this is for
 * the cases where narrow means a *different element*, not a smaller one (a rail
 * that becomes a track, a track that becomes a popover).
 *
 * It is a measurement, so the container owns it.
 */
export type SectionTabsLayout = "wide" | "narrow";

/**
 * Rich hover / popover content for a tab. Optional: a leaf that has nowhere to
 * put it simply ignores it, and a container that has nothing to say leaves it
 * null rather than inventing filler.
 *
 * Every field is pre-formatted. `meta` is already "4 sections", never a count.
 */
export type SectionTabsPreview = {
  title: string;
  summary: string;
  meta: string | null;
};

export type SectionTabsTab = {
  id: string;
  label: string;
  /** Pre-formatted trailing badge — "4", "New". Never a number. */
  badge: string | null;
  /** Pre-formatted secondary line, for rails and menus with room for one. */
  hint: string | null;
  /** Pre-computed single character for collapsed / icon-only chrome. */
  initial: string;
  state: SectionTabsTabState;

  /**
   * Accessible wiring, resolved once in the container so that every leaf on
   * this tree agrees about it and no leaf has to synthesise ids from an index.
   */
  triggerId: string;
  panelId: string;

  onSelect: () => void;
  /**
   * Hover / focus intent. `null` when this tab has nothing to preview — a leaf
   * must not open an empty popover just because it has a popover.
   */
  onPreview: (() => void) | null;
  preview: SectionTabsPreview | null;
};

export type SectionTabsMotion = {
  phase: SectionTabsPanelPhase;
  /**
   * The fully-resolved inline style for this instant — opacity, transform,
   * filter, whatever the preset decided. A leaf SPREADS this onto the panel
   * wrapper. It never computes it and never overrides it.
   */
  style: CSSProperties;
  /** The preset that produced the style. Surfaced as `data-transition`. */
  transition: string;
};

export type SectionTabsPanel = {
  /** DOM id. Matches the controlling tab's `panelId`. */
  id: string;
  tabId: string;
  /** The controlling tab's `triggerId`, for `aria-labelledby`. */
  labelledBy: string;
  phase: SectionTabsPanelPhase;
  motion: SectionTabsMotion;
  /**
   * THE SECTION. Opaque by design — this is what lets any component in the
   * forest be tabularized without being modified. A leaf renders it and does
   * not look inside.
   */
  content: ReactNode;
  /** Pre-formatted copy for a tab holding nothing yet. `null` when it holds something. */
  emptyLabel: string | null;
};

/**
 * A disclosure that some leaves use as their whole chrome (popover-menu) and
 * others use only when narrow (side-rail's mobile sheet).
 *
 * `side` / `align` are resolved outside the leaf. A leaf that picked its own
 * placement would be measuring the viewport, and two leaves measuring
 * separately is how a popover ends up off screen on exactly one of them.
 */
export type SectionTabsOverlay = {
  state: "open" | "closed";
  side: "top" | "bottom" | "left" | "right";
  align: "start" | "center" | "end";
  /** Pre-formatted trigger text — usually the active tab's label. */
  triggerLabel: string;
  /** Pre-formatted accessible name for the trigger. */
  triggerAriaLabel: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * Edge affordances for a track that scrolls. `null` when the tabs fit — a leaf
 * must not render disabled chevrons to fill the space.
 */
export type SectionTabsOverflow = {
  canScrollBack: boolean;
  canScrollForward: boolean;
  onScrollBack: () => void;
  onScrollForward: () => void;
  backLabel: string;
  forwardLabel: string;
};

export type SectionTabsVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: SectionTabsState;

  /**
   * Transport, normalized 0..1 across one tab change. Settles at 1 at rest.
   * The container owns the clock; fixtures pin it to a reproducible instant.
   */
  progress: number;

  /**
   * Which way the change is travelling — `1` forward, `-1` back, `0` at rest.
   * Directional presets read it so a slide follows the tab you actually moved
   * to. Resolved here rather than in a leaf because index arithmetic is exactly
   * what the contract exists to keep out.
   */
  direction: -1 | 0 | 1;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** Structural size class. See `SectionTabsLayout`. */
  layout: SectionTabsLayout;

  /**
   * The id scope the container generated `triggerId` / `panelId` from. A leaf
   * stamps it on its scrolling track as `data-tabs-track` so the container can
   * find the element it must measure — whatever shape that leaf gave it.
   *
   * It is DOM wiring, in the same category as the two ids above: resolved once
   * in the container so two instances on one page cannot measure each other.
   */
  scopeId: string;

  /** Accessible name for the tablist. Never null. */
  ariaLabel: string;

  /** Optional pre-formatted heading above the chrome. */
  heading: string | null;

  tabs: SectionTabsTab[];
  panels: SectionTabsPanel[];

  overlay: SectionTabsOverlay | null;
  overflow: SectionTabsOverflow | null;

  /** Pre-formatted copy for `state === "empty"`. */
  emptyLabel: string;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER or in fixtures, never in a leaf.
 * ------------------------------------------------------------------ */

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Pre-format a badge count. Runs in the container — never in a leaf. */
export function formatBadge(count: number | null, max = 99): string | null {
  if (count === null || !Number.isFinite(count) || count <= 0) return null;
  return count > max ? `${max}+` : String(count);
}

/** Pre-format a tab's section count for a hover preview. */
export function formatSectionCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "Empty";
  return count === 1 ? "1 section" : `${count} sections`;
}

/** Pre-compute a tab's fallback initial. Runs in the container, not a leaf. */
export function tabInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || "•";
}

/** Stable, SSR-safe DOM ids. One rule, so every leaf agrees about them. */
export function triggerIdFor(scope: string, tabId: string): string {
  return `${scope}-tab-${tabId}`;
}

export function panelIdFor(scope: string, tabId: string): string {
  return `${scope}-panel-${tabId}`;
}

/**
 * Collapse transport and content to the discrete state. One decision, made
 * once — leaves that each picked a threshold would disagree about when a change
 * is over.
 */
export function resolveSectionTabsState(
  tabCount: number,
  progress: number,
): SectionTabsState {
  if (tabCount === 0) return "empty";
  return clampProgress(progress) < 1 ? "switching" : "idle";
}

/**
 * Which way a change is travelling. Index arithmetic lives here and nowhere
 * else; an unknown tab settles to `0` rather than guessing.
 */
export function resolveDirection(
  tabIds: readonly string[],
  fromId: string | null,
  toId: string | null,
): -1 | 0 | 1 {
  if (!fromId || !toId || fromId === toId) return 0;
  const from = tabIds.indexOf(fromId);
  const to = tabIds.indexOf(toId);
  if (from < 0 || to < 0) return 0;
  return to > from ? 1 : -1;
}

/**
 * The phase of one panel during a change. `progress === 1` is rest: the active
 * panel is `active` and everything else is `hidden`, with no leaving panel
 * lingering in the DOM to catch a click.
 */
export function resolvePhase(
  tabId: string,
  activeId: string | null,
  leavingId: string | null,
  progress: number,
): SectionTabsPanelPhase {
  const settled = clampProgress(progress) >= 1;
  if (tabId === activeId) return settled ? "active" : "entering";
  if (!settled && tabId === leavingId) return "leaving";
  return "hidden";
}

/**
 * The one place a raw tab becomes a VM tab. Fixtures, the container and the
 * organizer all go through it, so they cannot drift apart.
 */
export function buildTab(
  raw: {
    id: string;
    label: string;
    badge?: string | null;
    hint?: string | null;
    disabled?: boolean;
    onSelect: () => void;
    onPreview?: (() => void) | null;
    preview?: SectionTabsPreview | null;
  },
  activeId: string | null,
  scope: string,
): SectionTabsTab {
  return {
    id: raw.id,
    label: raw.label,
    badge: raw.badge ?? null,
    hint: raw.hint ?? null,
    initial: tabInitial(raw.label),
    state: raw.disabled ? "disabled" : raw.id === activeId ? "active" : "idle",
    triggerId: triggerIdFor(scope, raw.id),
    panelId: panelIdFor(scope, raw.id),
    onSelect: raw.onSelect,
    onPreview: raw.onPreview ?? null,
    preview: raw.preview ?? null,
  };
}

/** The one place a raw panel becomes a VM panel, motion already resolved. */
export function buildPanel(
  raw: { tabId: string; content: ReactNode; emptyLabel?: string | null },
  phase: SectionTabsPanelPhase,
  motion: SectionTabsMotion,
  scope: string,
): SectionTabsPanel {
  return {
    id: panelIdFor(scope, raw.tabId),
    tabId: raw.tabId,
    labelledBy: triggerIdFor(scope, raw.tabId),
    phase,
    motion,
    content: raw.content,
    emptyLabel: raw.emptyLabel ?? null,
  };
}

export const SECTION_TABS_EMPTY: SectionTabsVM = {
  state: "empty",
  progress: 1,
  direction: 0,
  reducedMotion: false,
  layout: "wide",
  scopeId: "section-tabs",
  ariaLabel: "Sections",
  heading: null,
  tabs: [],
  panels: [],
  overlay: null,
  overflow: null,
  emptyLabel: "No tabs yet — drag a section in to make one.",
};
