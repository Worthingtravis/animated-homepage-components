/**
 * Pane Dock — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * ── What this tree is for ──────────────────────────────────────────────────
 * A workspace is a set of panes, and at any moment most of them are not the
 * thing you came for. Something has to happen to the rest. This tree owns that
 * question and nothing else: **where do the closed panes go?**
 *
 * It exists because the obvious answer is wrong in a way that takes months to
 * see. Faced with "a person must be able to reach a pane this screen did not
 * open for them", the natural move is to leave a strip on the edge for each
 * one — the pane is right there, one click wide, holding its state. Each strip
 * is individually cheap and individually correct. Add the fifth one and the
 * screen is a frame around a picture nobody can find: on a surface whose whole
 * job is one action, forty per cent of the controls only move furniture.
 *
 * The correction this tree explores:
 *
 *   > Reachability is a DOOR, not a STRIP.
 *   > A posture's chrome budget is proportional to its job.
 *
 * A door can be one row, one menu, one keystroke, or four edges — that is the
 * leaf's call, and swapping between those answers must not cost the container a
 * line. Which is the whole reason this is a tree.
 *
 * ── The two axes, kept apart ───────────────────────────────────────────────
 *  1. WHICH panes are open and which are docked  → the caller's posture, an INPUT
 *  2. HOW the docked ones are offered            → a LEAF on this tree
 *
 * A posture is a preset: it says what you LAND on, never what you may reach.
 * That distinction lives on the input side, and this tree cannot see it — by
 * the time a VM is built, the argument is over and the answer is two arrays.
 *
 * ── Docked panes have no content, and that is load-bearing ─────────────────
 * `PaneDockDoor` has no `content` field. A docked pane is *not mounted* — the
 * door is a button that asks for it, not a wrapper around a hidden subtree. So
 * "collapsed" cannot quietly come to mean "rendered, then hidden with CSS",
 * which is the failure mode where putting a pane away stops buying anything and
 * the strips are pure loss. The contract makes the cheap thing the only
 * expressible thing.
 *
 * ── Purpose is not optional ────────────────────────────────────────────────
 * `purpose.title` is non-nullable. A workspace that cannot say in one line what
 * this screen is FOR has no way to justify any chrome on it, and the failure is
 * silent: every pane looks locally reasonable and the sentence that would have
 * ranked them was never written down. Making it a required string means the
 * ranking exists before the layout does.
 *
 * ── Transport ──────────────────────────────────────────────────────────────
 * `progress` runs 0..1 across ONE pane opening or closing, and settles at 1.
 * Not a loop, not a scroll. `frameAt(p)` in the fixtures samples the same
 * change through the same helpers, so the lab's clock scrubs a real dock/undock
 * rather than nudging an unrelated number.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string. Counts arrive as "3".
 *  - Every user action is a callback. Never an id a leaf resolves against state.
 *  - Transport (progress) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - Measurement belongs to the container. `density` is a measurement; a leaf
 *    that decided for itself whether the doors fit would be measuring, and two
 *    leaves measuring separately is how one of them ends up wrong.
 *  - No hooks, no fetches, no side effects in this file.
 */

import type { CSSProperties, ReactNode } from "react";

/**
 * Explicit visual state.
 *
 * `solo` is the one that earns its keep. It means: one pane open, nothing
 * docked — so there is nothing to offer and a leaf must draw NO dock chrome at
 * all. Without it, a leaf would have to ask `docked.length === 0`, which is
 * exactly the derived branch the contract exists to keep out, and the cost of
 * getting it wrong is a permanent empty rail: the bug this tree is about,
 * reintroduced one leaf at a time.
 */
export type PaneDockState = "settled" | "moving" | "solo" | "empty";

/**
 * WHERE an open pane draws. Slots are named for the ROLE the pane plays in the
 * job, not for a side of the screen — `left` is a fact about a monitor, and a
 * leaf that stacks on a phone has to translate it anyway.
 */
export type PaneDockSlot =
  /** Before the stage: where you go to FIND material. */
  | "lead"
  /** The thing you are looking at. Exactly one pane should hold this. */
  | "stage"
  /** Under the stage: what you DO with what you looked at. */
  | "support"
  /** After the stage: what you have KEPT. */
  | "aside";

/**
 * Structural size class. For the cases where narrow means a *different
 * element* — a row of doors that becomes a sheet — not a smaller one. Ordinary
 * responsive work stays plain Tailwind breakpoints inside the leaf.
 */
export type PaneDockDensity = "wide" | "narrow";

/** What a pane is doing on this frame. `resting` is the settled majority. */
export type PaneDockMovementKind = "opening" | "closing" | "resting";

export type PaneDockMotion = {
  kind: PaneDockMovementKind;
  /**
   * The fully-resolved inline style for this instant. A leaf SPREADS this onto
   * the pane wrapper. It never computes it and never overrides it — reduced
   * motion is already handled here, before the style was made.
   */
  style: CSSProperties;
};

/**
 * A DOOR — a pane that is not on screen and not mounted.
 *
 * Deliberately not a `PaneDockPane` with a flag. A door has no content, no
 * region id and no motion, because there is nothing to lay out; giving it those
 * fields would invite a leaf to render the pane behind the door "just for the
 * transition", and that is how docking stops being cheap.
 */
export type PaneDockDoor = {
  id: string;
  /** Pre-formatted, and a VERB wherever the pane is an action — "Find", "Send". */
  label: string;
  /** Pre-formatted one-liner, for docks with room for one. `null` when there is nothing worth saying — a leaf must not render an empty line to keep its rows even. */
  hint: string | null;
  /** Pre-formatted badge — "3", "New", "Live". Never a number, never null-as-zero. */
  badge: string | null;
  /** Pre-computed single character, for icon-only chrome. */
  initial: string;
  /** Where it WOULD open. A leaf may cluster doors by slot or ignore this entirely. */
  slot: PaneDockSlot;
  /** Pre-formatted accessible name — "Open Find". Resolved once so every leaf agrees. */
  ariaLabel: string;
  onOpen: () => void;
};

export type PaneDockPane = {
  id: string;
  label: string;
  hint: string | null;
  badge: string | null;
  initial: string;
  slot: PaneDockSlot;

  /**
   * Accessible wiring, resolved once in the container so no leaf synthesises
   * ids from an index and two docks on one page cannot collide.
   */
  regionId: string;
  headerId: string;

  /**
   * THE PANE. Opaque by design — this is what lets any surface in the forest be
   * docked without being modified. A leaf renders it and does not look inside.
   */
  content: ReactNode;

  motion: PaneDockMotion;

  /**
   * Put this pane away. `null` when this pane may not be docked here.
   *
   * Nullable, and the default should almost always be a function. "Being the
   * point of the screen" is a reason to OPEN something, never a reason to bolt
   * it open — a preset says what you land on, not what you may change. `null`
   * is for the genuine case where there is nowhere for the pane to go, and a
   * leaf renders no control rather than a dead one.
   */
  onDock: (() => void) | null;
  /** Pre-formatted accessible name for the dock control. `null` iff `onDock` is. */
  dockAriaLabel: string | null;
};

/**
 * A single disclosure, for leaves whose whole dock is one trigger — and for
 * leaves that use standing chrome when wide and a sheet when narrow.
 *
 * `state` is owned outside the leaf so that a leaf cannot hold it, and so the
 * lab can render the open sheet as a fixture instead of requiring a click.
 */
export type PaneDockOverlay = {
  state: "open" | "closed";
  /** Pre-formatted trigger text — "3 more". */
  triggerLabel: string;
  /** Pre-formatted accessible name — "Show 3 docked panes". */
  triggerAriaLabel: string;
  onOpenChange: (open: boolean) => void;
};

export type PaneDockVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: PaneDockState;

  /** Transport, normalized 0..1 across ONE open/close. Settles at 1 at rest. */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** Structural size class. See `PaneDockDensity`. */
  density: PaneDockDensity;

  /** The id scope `regionId` / `headerId` were generated from. Leaves stamp it as `data-pane-dock` so two docks on a page stay distinguishable. */
  scopeId: string;

  /**
   * WHAT THIS SCREEN IS FOR, in the viewer's words. Never null — see the header.
   * `badge` carries a live status where there is one ("Live", "Overlay is up").
   */
  purpose: {
    title: string;
    subtitle: string | null;
    badge: string | null;
  };

  /** Panes drawn at full size, in the order the container decided. */
  open: PaneDockPane[];

  /** Panes that are away but reachable. The leaf decides how these are offered. */
  docked: PaneDockDoor[];

  /** Pre-formatted summary — "3 panes docked". `null` when nothing is docked. */
  dockedLabel: string | null;

  /** `null` for leaves that never need a disclosure at this density. */
  overlay: PaneDockOverlay | null;

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

/**
 * Collapse the situation into the one state string a leaf may branch on.
 *
 * `moving` outranks `solo`: a dock mid-close still has chrome on screen and a
 * leaf that dropped it at the first frame would pop. `solo` outranks `settled`
 * so the zero-chrome case is reachable at all.
 */
export function resolvePaneDockState(
  openCount: number,
  dockedCount: number,
  moving: boolean,
): PaneDockState {
  if (openCount === 0 && dockedCount === 0) return "empty";
  if (moving) return "moving";
  if (dockedCount === 0) return "solo";
  return "settled";
}

/** Pre-format a badge count. Runs in the container — never in a leaf. */
export function formatBadge(count: number | null, max = 99): string | null {
  if (count == null || count <= 0) return null;
  return count > max ? `${max}+` : String(count);
}

/**
 * Pre-format the dock summary. `null` at zero rather than "0 panes docked" —
 * a dock with nothing in it should say nothing, not say nothing loudly.
 */
export function formatDockedLabel(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? "1 pane docked" : `${count} panes docked`;
}

/** Pre-compute the icon-only character for a label. */
export function initialFor(label: string): string {
  return label.trim().slice(0, 1).toUpperCase() || "·";
}

/**
 * Resolve one pane's motion for this instant.
 *
 * REDUCED MOTION IS HANDLED HERE, before the style is made — not inside a
 * leaf, and not by a leaf choosing to ignore the style it was handed. A leaf
 * that has to remember to check a flag is a leaf that will forget on the
 * variant nobody screenshots.
 */
export function resolveMotion(
  kind: PaneDockMovementKind,
  progress: number,
  reducedMotion: boolean,
): PaneDockMotion {
  const p = clampProgress(progress);
  if (reducedMotion || kind === "resting") {
    return { kind, style: { opacity: 1 } };
  }
  const eased = p * p * (3 - 2 * p);
  const t = kind === "opening" ? eased : 1 - eased;
  return {
    kind,
    style: {
      opacity: 0.25 + 0.75 * t,
      transform: `scale(${(0.985 + 0.015 * t).toFixed(4)})`,
    },
  };
}

export const PANE_DOCK_EMPTY: PaneDockVM = {
  state: "empty",
  progress: 1,
  reducedMotion: false,
  density: "wide",
  scopeId: "pane-dock-empty",
  purpose: { title: "Nothing open", subtitle: null, badge: null },
  open: [],
  docked: [],
  dockedLabel: null,
  overlay: null,
  emptyLabel: "No panes to show.",
};
