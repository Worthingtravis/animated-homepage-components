/**
 * Section Tabs — fixtures.
 *
 * Hook-free, deterministic, and the input the conformance suite renders every
 * leaf against. If a state is not here, no leaf is checked against it.
 *
 * ── Why the content is `createElement` and not JSX ─────────────────────────
 * This file is `.ts`, as every fixture file in the forest is. Panel content is
 * the one opaque field on this contract, so it has to be a real React node —
 * `createElement` gives us one without turning the fixtures into a component
 * file. What it holds does not matter to any leaf; these stand-ins are shaped
 * like a real section (a heading and some prose) purely so the panel has
 * something with height in it.
 */

import { createElement, type ReactNode } from "react";

import { resolveMotion } from "./section-tabs.transitions";
import {
  buildPanel,
  buildTabs,
  clampProgress,
  formatSectionCount,
  resolveDirection,
  resolvePhase,
  resolveSectionTabsState,
  type SectionTabsLayout,
  type SectionTabsPreview,
  type SectionTabsVM,
} from "./section-tabs.vm";

const SCOPE = "fixture";
const noop = () => {};

/** A stand-in for a real section. Opaque to every leaf — see the note above. */
function section(title: string, body: string): ReactNode {
  return createElement(
    "div",
    { className: "space-y-2 rounded-xl border border-border bg-card p-6" },
    createElement("h3", { className: "text-lg font-semibold text-foreground" }, title),
    createElement("p", { className: "text-sm text-muted-foreground" }, body),
  );
}

type RawTab = {
  id: string;
  label: string;
  badge?: string | null;
  hint?: string | null;
  disabled?: boolean;
  preview?: SectionTabsPreview | null;
  content: ReactNode;
  emptyLabel?: string | null;
};

/**
 * Build a coherent VM from raw tabs and an instant.
 *
 * Every fixture goes through this, and so does `frameAt` — which is what makes
 * a frozen fixture a genuine *sample* of the live clock rather than a
 * hand-written guess at one. It mirrors what the container does, using the same
 * helpers, so the two cannot drift.
 */
function build(
  tabs: RawTab[],
  options: {
    activeId?: string;
    leavingId?: string | null;
    progress?: number;
    transition?: string;
    reducedMotion?: boolean;
    layout?: SectionTabsLayout;
    heading?: string | null;
    overlayOpen?: boolean;
    overflow?: boolean;
    ariaLabel?: string;
  } = {},
): SectionTabsVM {
  const progress = clampProgress(options.progress ?? 1);
  const activeId = options.activeId ?? tabs[0]?.id ?? null;
  const leavingId = options.leavingId ?? null;
  const reducedMotion = options.reducedMotion ?? false;
  const ids = tabs.map((tab) => tab.id);
  const direction = resolveDirection(ids, leavingId, activeId);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0] ?? null;

  return {
    state: resolveSectionTabsState(tabs.length, progress),
    progress,
    direction,
    reducedMotion,
    layout: options.layout ?? "wide",
    scopeId: SCOPE,
    ariaLabel: options.ariaLabel ?? "Page sections",
    heading: options.heading ?? null,
    tabs: buildTabs(
      tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        badge: tab.badge,
        hint: tab.hint,
        disabled: tab.disabled,
        onSelect: noop,
        onPreview: tab.preview ? noop : null,
        preview: tab.preview,
      })),
      activeId,
      SCOPE,
    ),
    panels: tabs.map((tab) => {
      const phase = resolvePhase(tab.id, activeId, leavingId, progress);
      return buildPanel(
        { tabId: tab.id, content: tab.content, emptyLabel: tab.emptyLabel },
        phase,
        resolveMotion(options.transition, { phase, progress, direction }, reducedMotion),
        SCOPE,
      );
    }),
    overlay: activeTab
      ? {
          state: options.overlayOpen ? "open" : "closed",
          side: "bottom",
          align: "start",
          triggerLabel: activeTab.label,
          triggerAriaLabel: `Choose a section — ${activeTab.label} selected`,
          onOpenChange: noop,
        }
      : null,
    overflow: options.overflow
      ? {
          canScrollBack: true,
          canScrollForward: true,
          onScrollBack: noop,
          onScrollForward: noop,
          backLabel: "Scroll tabs left",
          forwardLabel: "Scroll tabs right",
        }
      : null,
    emptyLabel: "No tabs yet — drag a section in to make one.",
  };
}

/* ------------------------------------------------------------ tab sets */

const preview = (title: string, summary: string, count: number): SectionTabsPreview => ({
  title,
  summary,
  meta: formatSectionCount(count),
});

/** The everyday case: a creator page split into four tabs. */
const CANONICAL: RawTab[] = [
  {
    id: "home",
    label: "Home",
    badge: null,
    hint: "Hero and highlights",
    preview: preview("Home", "The first screen — hero, live strip and start-anywhere grid.", 3),
    content: section(
      "Channel hero",
      "Identity, a live/offline strip, an action row and a start-anywhere grid.",
    ),
  },
  {
    id: "about",
    label: "About",
    badge: null,
    hint: "The long read",
    preview: preview("About", "Narrative sections that explain what the channel is.", 2),
    content: section("Step reveal", "A steerable how-it-works sequence with three positions."),
  },
  {
    id: "shop",
    label: "Shop",
    badge: "4",
    hint: "Merch and drops",
    preview: preview("Shop", "Products, drops and everything with a price on it.", 4),
    content: section("Product grid", "Four items, each with a price and an availability chip."),
  },
  {
    id: "support",
    label: "Support",
    badge: "New",
    hint: "Tips and FAQ",
    preview: preview("Support", "Tips, subscriptions and the questions people actually ask.", 2),
    content: section("Support", "Tip jar, subscription tiers and an FAQ accordion."),
  },
];

/** Nine tabs — enough that every leaf's overflow story has to be real. */
const MANY: RawTab[] = Array.from({ length: 9 }, (_, index) => ({
  id: `tab-${index + 1}`,
  label: ["Home", "About", "Shop", "Support", "Videos", "Clips", "Schedule", "Press", "Contact"][
    index
  ] as string,
  badge: index % 3 === 0 ? String(index + 1) : null,
  hint: null,
  preview: preview(`Section ${index + 1}`, "One of nine tabs competing for the same track.", 1),
  content: section(`Section ${index + 1}`, "One of nine. If this overflows, the chrome must say so."),
}));

/** The stress case: copy that no track can lay out comfortably. */
const LONG: RawTab[] = [
  {
    id: "long-1",
    label: "Everything you could possibly want to know about the channel",
    badge: "128",
    hint: "A hint that also refuses to be short, because real creators write like this",
    preview: preview(
      "Everything you could possibly want to know about the channel",
      "A summary long enough that a popover has to wrap it rather than clip it, which is exactly the case that looks fine in a mockup and breaks in production.",
      12,
    ),
    content: section(
      "A very long section title that wraps",
      "Long copy is the fixture that finds the leaf which assumed one line.",
    ),
  },
  {
    id: "long-2",
    label: "Frequently asked questions and answers",
    badge: null,
    hint: null,
    preview: null,
    content: section("FAQ", "Shorter, so the two tabs are visibly different widths."),
  },
];

/** Optionals absent: no badges, no hints, no previews, no heading. */
const BARE: RawTab[] = [
  { id: "one", label: "One", content: section("One", "No badge, no hint, no preview.") },
  { id: "two", label: "Two", content: section("Two", "Nothing optional is set on these tabs.") },
  { id: "three", label: "Three", content: section("Three", "A leaf must not leave a gap for them.") },
];

/** A tab that exists but holds nothing — the organizer creates these. */
const WITH_EMPTY: RawTab[] = [
  ...BARE.slice(0, 2),
  {
    id: "empty-tab",
    label: "Drops",
    badge: null,
    hint: "Nothing here yet",
    preview: preview("Drops", "A tab waiting for its first section.", 0),
    content: null,
    emptyLabel: "Drag a section here to fill this tab.",
  },
];

/** One disabled tab — the state a leaf is most likely to render as merely faint. */
const WITH_DISABLED: RawTab[] = [
  CANONICAL[0] as RawTab,
  { ...(CANONICAL[1] as RawTab), disabled: true, hint: "Coming soon" },
  CANONICAL[2] as RawTab,
];

/* ------------------------------------------------------------ the clock */

/**
 * The pure sampler. Given transport in 0..1 it returns a *coherent* VM for that
 * instant — phases, direction, motion and state all agreeing.
 *
 * It models one real change: Home → Shop, sliding forward. The lab's clock
 * drives it, and the frozen fixtures below are literally samples of it, so a
 * leaf cannot pass the frozen frames and disagree with the live one.
 */
export function frameAt(progress: number): SectionTabsVM {
  return build(CANONICAL, {
    activeId: "shop",
    leavingId: "home",
    progress: clampProgress(progress),
    transition: "slide-x",
    heading: "Creator page",
  });
}

/* ------------------------------------------------------------ fixtures */

export const ALL_FIXTURES: Record<string, SectionTabsVM> = {
  /** At rest on the first tab. The picture most reviews should start from. */
  "Four tabs · at rest": build(CANONICAL, { heading: "Creator page" }),

  /** Mid-change, frozen. Both panels are on screen and travelling. */
  "Switching · 35% through a slide": frameAt(0.35),

  /** The same change at its midpoint — the frame a crossfade is judged on. */
  "Switching · halfway": frameAt(0.5),

  /** Nearly settled. Catches a leaf that pops rather than arriving. */
  "Switching · 85% through": frameAt(0.85),

  /** Reduced motion. Every preset must collapse to a cut here. */
  "Reduced motion · mid-change": build(CANONICAL, {
    activeId: "shop",
    leavingId: "home",
    progress: 0.4,
    transition: "lift",
    reducedMotion: true,
    heading: "Creator page",
  }),

  /** Nine tabs with overflow affordances live. */
  "Many tabs · overflowing": build(MANY, {
    activeId: "tab-5",
    overflow: true,
    heading: "Nine sections",
  }),

  /** Long labels, long hints, a long preview. */
  "Long copy": build(LONG, { heading: "Long copy" }),

  /** Every optional field absent. */
  "Bare · no badges, hints or previews": build(BARE),

  /** A tab holding nothing — what the organizer makes before you drop into it. */
  "A tab with no sections in it": build(WITH_EMPTY, { activeId: "empty-tab" }),

  /** One tab disabled. */
  "One tab disabled": build(WITH_DISABLED, { heading: "Creator page" }),

  /** Narrow layout — the structural switch, not just a smaller track. */
  "Narrow layout": build(CANONICAL, { layout: "narrow", heading: "Creator page" }),

  /** Narrow, with the disclosure open. Popover chrome has to survive this. */
  "Narrow · overlay open": build(CANONICAL, {
    layout: "narrow",
    overlayOpen: true,
    activeId: "about",
    heading: "Creator page",
  }),

  /** Nothing to tab between. */
  "Empty · no tabs at all": build([]),
};

export const DEFAULT_FIXTURE = "Four tabs · at rest";
