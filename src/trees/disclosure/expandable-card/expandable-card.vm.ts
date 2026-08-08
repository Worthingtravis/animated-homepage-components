/**
 * Expandable Card — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * ── What this tree is for ──────────────────────────────────────────────────
 * A grid or list of cards where pressing one opens it into its own detail, in
 * place, without a route change. The move everyone recognises is the shared
 * element: the card you pressed appears to *become* the panel.
 *
 * That effect is normally bought with a layout-animation library, and the price
 * is that the animation lives inside the component. Every card grid that wants
 * it re-implements the open/close state, the escape key, the outside click, the
 * scroll lock and the measurement — and every one of them owns state, which
 * ends a leaf. So this tree splits the effect into the three things it actually
 * is:
 *
 *  1. WHICH CARD IS OPEN            → the container's state, arriving as data
 *  2. WHAT THE CARDS AND PANEL LOOK LIKE → a LEAF
 *  3. HOW THE PANEL ARRIVES         → a TRANSITION preset (a pure function),
 *                                     resolved in the container and delivered
 *                                     as `panel.motion.*`
 *
 * A leaf therefore never measures anything, never listens to the document and
 * never animates. It spreads finished styles. The morph works identically in
 * all four leaves because none of them implements it.
 *
 * ── The measurement handle ─────────────────────────────────────────────────
 * A shared-element morph needs two rectangles: where the card is, and where the
 * panel lands. Both are measurements, and measurements belong to the container
 * — but the container does not render the card, the leaf does. So the contract
 * carries the handle:
 *
 *   - `card.anchor` — a pre-built props object a leaf SPREADS onto the card's
 *     outermost element. That is the whole obligation. The container finds the
 *     rect through it.
 *   - `panel.id` — the same idea for the panel that lands.
 *
 * `anchor` is data, not behaviour. A leaf that spreads it gets the morph; a
 * leaf that also spreads `panel.motion.surface` gets it correctly. Nothing else
 * about a leaf's structure is constrained, which is why `canon/inline-detail`
 * can answer this contract with no overlay at all.
 *
 * ── Transport ──────────────────────────────────────────────────────────────
 * `progress` runs 0..1 across ONE opening (or one closing) and settles at 1. It
 * is not a loop and not a scroll position. `frameAt(p)` in the fixtures samples
 * the same opening, so the lab's clock scrubs a real expansion.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string. "6 min" arrives finished.
 *  - Every user action is a callback. Never an id a leaf resolves against state.
 *  - Transport (`progress`) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

import type { CSSProperties } from "react";

/**
 * Explicit visual state. Leaves switch on this — never on `panel !== null` and
 * never on `cards.length`.
 *
 *  - `empty`    nothing to show. Render the empty line, not an empty grid.
 *  - `browsing` the collection, nothing open. The default, and the state that
 *               has to be good.
 *  - `open`     one card is open. Covers the whole life of the panel including
 *               its exit, because a panel that unmounts the instant you press
 *               close cannot animate out.
 */
export type ExpandableCardState = "empty" | "browsing" | "open";

/**
 * A card's role in the current instant, resolved by the container.
 *
 *  - `resting` nothing is open, or this card is unrelated to what is.
 *  - `source`  this is the card the open panel came out of. A leaf usually
 *              hides or empties it so the panel is not visibly duplicated
 *              mid-morph.
 *  - `dimmed`  something else is open. Recede — do not disappear.
 */
export type ExpandableCardItemState = "resting" | "source" | "dimmed";

/** Where the panel is in the current change. */
export type ExpandableCardPhase = "entering" | "open" | "leaving";

/** A rectangle in viewport coordinates. The container measures it; nothing else does. */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Ready for `next/image`. Dimensions travel with the source because a leaf may
 * not measure and must not guess — an intrinsic size is the difference between
 * a grid that settles and a grid that reflows on every load.
 */
export type ExpandableCardMedia = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * One action. `href` and `onActivate` are both nullable and both may be set —
 * a link that also reports is normal. When both are null the action is
 * unavailable, and it arrives with `disabled: true` rather than being dropped,
 * so a leaf renders the same row it always renders.
 */
export type ExpandableCardAction = {
  label: string;
  href: string | null;
  onActivate: (() => void) | null;
  disabled: boolean;
  /** `primary` earns the creator's accent fill. At most one per surface. */
  tone: "primary" | "quiet";
};

export type ExpandableCardItem = {
  id: string;
  title: string;
  subtitle: string;
  /** Pre-formatted trailing detail — `"6 min"`, `"Mar 4"`. Never a number, never a Date. */
  meta: string | null;
  media: ExpandableCardMedia;
  state: ExpandableCardItemState;

  /**
   * Accessible wiring, resolved once in the container so every leaf agrees and
   * no leaf synthesises an id from an index.
   */
  triggerId: string;
  /** The panel this card would open. Matches `panel.id` while it is open. */
  panelId: string;

  /**
   * THE MEASUREMENT HANDLE. Spread this onto the card's outermost element:
   *
   *     <article {...card.anchor}>
   *
   * It is a plain props object — a `data-*` attribute and nothing else. It is
   * how the container finds the rect the morph starts from, and it is the only
   * structural thing this contract asks of a leaf.
   */
  anchor: { "data-expandable-card": string };

  /** Open this card. Never `onExpand(id)` — the id is already bound. */
  onExpand: () => void;

  /**
   * The card-level action (the play button in the canonical design). `null`
   * when this collection has none — a leaf must not invent one to fill a slot.
   */
  action: ExpandableCardAction | null;
};

/**
 * The fully-resolved inline styles for one instant of the change. A leaf
 * SPREADS these. It never computes them, never overrides them, and never reads
 * `progress` to decide them — that is what makes every preset compose with
 * every leaf.
 */
export type ExpandableCardMotion = {
  phase: ExpandableCardPhase;
  /** The morphing surface — the panel's outermost box. */
  surface: CSSProperties;
  /**
   * The shared media inside it. Separate from `surface` because the picture and
   * the box do not travel at the same rate in any morph worth shipping.
   */
  media: CSSProperties;
  /** Everything that exists only once open — body copy, actions, close. */
  content: CSSProperties;
  /** The scrim. A leaf that renders no scrim ignores it; nothing breaks. */
  backdrop: CSSProperties;
  /** The preset that produced these. Surfaced as `data-transition`. */
  transition: string;
};

export type ExpandableCardPanel = {
  /**
   * DOM id — put it on the panel's outermost element. The container measures
   * through it, and the card that opened it carries the same string as
   * `card.panelId`.
   */
  id: string;
  titleId: string;
  /** The opening card's `triggerId`, for `aria-labelledby` on the close affordance. */
  labelledBy: string;

  /**
   * THE SAME CARD, not a copy of it. The panel is the card plus more, so the
   * title, subtitle and media a leaf renders here are literally the ones it
   * rendered in the grid — which is why they cannot drift.
   */
  card: ExpandableCardItem;

  /** Detail copy, pre-split into paragraphs. Empty when there is no detail. */
  body: string[];
  /** Pre-formatted facts — `[{ label: "Length", value: "6 min" }]`. */
  facts: Array<{ label: string; value: string }>;
  action: ExpandableCardAction | null;
  close: { label: string; onClose: () => void };

  phase: ExpandableCardPhase;
  motion: ExpandableCardMotion;
};

export type ExpandableCardVM = {
  /** Explicit visual state. Leaves switch on this. */
  state: ExpandableCardState;

  /** 0..1 across the current opening or closing. Settles at 1. */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** Collection chrome. Pre-formatted; any of them may be null. */
  eyebrow: string | null;
  headline: string | null;
  body: string | null;

  /**
   * Every card, always — including the open one. A leaf never filters this
   * list, because a grid that loses a card while one is open is a grid that
   * reflows behind the panel, and the reflow is visible the moment it closes.
   */
  cards: ExpandableCardItem[];

  /** The open panel, or `null`. Present through the whole exit. */
  panel: ExpandableCardPanel | null;

  /** What to say in `"empty"`. */
  emptyLabel: string | null;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER (or in fixtures), never in a leaf.
 * ------------------------------------------------------------------ */

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Collapse "is anything open" into a state string.
 *
 * `empty` beats everything: a collection with no cards has nothing to open, and
 * an open id pointing at a card that no longer exists is a stale id, not a
 * panel. Leaves get one answer instead of three booleans.
 */
export function resolveExpandableCardState(
  cardCount: number,
  openId: string | null,
): ExpandableCardState {
  if (cardCount === 0) return "empty";
  return openId === null ? "browsing" : "open";
}

/**
 * A card's role. Exported because fixtures and the container must agree — the
 * fixture that says "one open, the rest dimmed" is only trustworthy if it was
 * built by the same function the running component uses.
 */
export function resolveItemState(
  cardId: string,
  openId: string | null,
): ExpandableCardItemState {
  if (openId === null) return "resting";
  return cardId === openId ? "source" : "dimmed";
}

/** Stable, collision-free ids from one seed. Never derived from an index in a leaf. */
export function cardIds(scope: string, cardId: string) {
  return {
    triggerId: `${scope}-trigger-${cardId}`,
    panelId: `${scope}-panel-${cardId}`,
    titleId: `${scope}-title-${cardId}`,
  };
}

/** The measurement handle, built in one place so the selector below cannot drift. */
export function cardAnchor(cardId: string): ExpandableCardItem["anchor"] {
  return { "data-expandable-card": cardId };
}

/**
 * The selector that finds a card's element. The container's only way in, and
 * the reason `cardAnchor` exists rather than a hand-written attribute at each
 * call site: one string, one place to change it.
 */
export function cardAnchorSelector(cardId: string): string {
  return `[data-expandable-card="${CSS_ESCAPE(cardId)}"]`;
}

/**
 * Minimal attribute-value escaping. `CSS.escape` is not in jsdom and this runs
 * in tests as well as the browser; ids in this forest are slugs, so quoting the
 * two characters that would end the attribute string is enough.
 */
function CSS_ESCAPE(value: string): string {
  return value.replace(/(["\\])/g, "\\$1");
}

/**
 * An unavailable action, kept rather than dropped.
 *
 * The failure this prevents is specific: an action that vanishes when it cannot
 * be taken makes the card change height between states, and the person who was
 * about to press it watches the layout move instead. `disabled` keeps the row.
 */
export function unavailableAction(label: string): ExpandableCardAction {
  return { label, href: null, onActivate: null, disabled: true, tone: "quiet" };
}

/** The honest empty. A collection with nothing in it renders this, not a skeleton. */
export const EXPANDABLE_CARD_EMPTY: ExpandableCardVM = {
  state: "empty",
  progress: 1,
  reducedMotion: false,
  eyebrow: null,
  headline: null,
  body: null,
  cards: [],
  panel: null,
  emptyLabel: "Nothing here yet",
};
