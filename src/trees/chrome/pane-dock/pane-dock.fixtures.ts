/**
 * Pane Dock — fixtures.
 *
 * Hook-free, deterministic, and the input the conformance suite renders every
 * leaf against. If a state is not here, no leaf is checked against it.
 *
 * ── Why the content is `createElement` and not JSX ─────────────────────────
 * This file is `.ts`, as every fixture file in the forest is. Pane content is
 * the one opaque field on this contract, so it has to be a real React node —
 * `createElement` gives us one without turning the fixtures into a component
 * file. What it holds does not matter to any leaf; these stand-ins are shaped
 * like the real panes (a player, a send box, a result list) purely so a pane
 * has something with plausible height in it.
 *
 * ── The fixtures are an argument, not a sample ─────────────────────────────
 * Four of them are the same workspace at four chrome budgets — `Send page —
 * five docked` is the surface as shipped today, and `Send page — the job` is
 * the same panes with the doors ranked against `purpose`. They are meant to be
 * flipped between in the lab on one leaf, because the finding this tree exists
 * for is only visible as a difference: every individual door in the first
 * fixture is defensible, and the screen is still wrong.
 */

import { createElement, type ReactNode } from "react";

import {
  clampProgress,
  formatDockedLabel,
  initialFor,
  resolveMotion,
  resolvePaneDockState,
  type PaneDockDoor,
  type PaneDockPane,
  type PaneDockSlot,
  type PaneDockVM,
} from "./pane-dock.vm";

const SCOPE = "fixture";
const noop = () => {};

/** A stand-in for a real pane. Opaque to every leaf — see the note above. */
function stub(title: string, body: string, tall = false): ReactNode {
  return createElement(
    "div",
    {
      className: [
        "flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4",
        tall ? "min-h-48" : "min-h-24",
      ].join(" "),
    },
    createElement(
      "p",
      { className: "text-sm font-semibold text-foreground" },
      title,
    ),
    createElement("p", { className: "text-sm text-muted-foreground" }, body),
  );
}

type RawPane = {
  id: string;
  label: string;
  slot: PaneDockSlot;
  hint?: string | null;
  badge?: string | null;
  content: ReactNode;
  /** `false` for the rare pane with nowhere to go. Defaults to dockable. */
  dockable?: boolean;
};

type RawDoor = {
  id: string;
  label: string;
  slot: PaneDockSlot;
  hint?: string | null;
  badge?: string | null;
};

function buildPane(
  raw: RawPane,
  movingId: string | null,
  kind: "opening" | "closing",
  progress: number,
  reducedMotion: boolean,
): PaneDockPane {
  const dockable = raw.dockable ?? true;
  return {
    id: raw.id,
    label: raw.label,
    hint: raw.hint ?? null,
    badge: raw.badge ?? null,
    initial: initialFor(raw.label),
    slot: raw.slot,
    regionId: `${SCOPE}-${raw.id}-region`,
    headerId: `${SCOPE}-${raw.id}-header`,
    content: raw.content,
    motion: resolveMotion(
      raw.id === movingId ? kind : "resting",
      progress,
      reducedMotion,
    ),
    onDock: dockable ? noop : null,
    dockAriaLabel: dockable ? `Put ${raw.label} away` : null,
  };
}

function buildDoor(raw: RawDoor): PaneDockDoor {
  return {
    id: raw.id,
    label: raw.label,
    hint: raw.hint ?? null,
    badge: raw.badge ?? null,
    initial: initialFor(raw.label),
    slot: raw.slot,
    ariaLabel: `Open ${raw.label}`,
    onOpen: noop,
  };
}

/**
 * Build a coherent VM from raw panes and an instant.
 *
 * Every fixture goes through this, and so does `frameAt` — which is what makes
 * a frozen fixture a genuine *sample* of the live clock rather than a
 * hand-written guess at one. It mirrors what the container does, using the same
 * helpers, so the two cannot drift.
 */
function build(
  purpose: PaneDockVM["purpose"],
  open: RawPane[],
  docked: RawDoor[],
  options: {
    progress?: number;
    movingId?: string | null;
    kind?: "opening" | "closing";
    reducedMotion?: boolean;
    density?: PaneDockVM["density"];
    overlayOpen?: boolean | null;
    emptyLabel?: string;
  } = {},
): PaneDockVM {
  const progress = clampProgress(options.progress ?? 1);
  const movingId = options.movingId ?? null;
  const kind = options.kind ?? "opening";
  const reducedMotion = options.reducedMotion ?? false;
  const moving = movingId !== null && progress < 1;
  const doors = docked.map(buildDoor);

  return {
    state: resolvePaneDockState(open.length, doors.length, moving),
    progress,
    reducedMotion,
    density: options.density ?? "wide",
    scopeId: SCOPE,
    purpose,
    open: open.map((raw) =>
      buildPane(raw, movingId, kind, progress, reducedMotion),
    ),
    docked: doors,
    dockedLabel: formatDockedLabel(doors.length),
    overlay:
      options.overlayOpen == null || doors.length === 0
        ? null
        : {
            state: options.overlayOpen ? "open" : "closed",
            triggerLabel: `${doors.length} more`,
            triggerAriaLabel:
              doors.length === 1
                ? "Show 1 docked pane"
                : `Show ${doors.length} docked panes`,
            onOpenChange: noop,
          },
    emptyLabel: options.emptyLabel ?? "No panes to show.",
  };
}

/* ------------------------------------------------------------------ *
 * The running example: a viewer sending a clip to a streamer they watch.
 * ------------------------------------------------------------------ */

const SEND_PURPOSE = {
  title: "Send a clip to jagerzgoober",
  subtitle: "It plays full-screen on their stream, with your name on it.",
  badge: "Overlay is up",
};

const CLIP: RawPane = {
  id: "clip",
  label: "Clip",
  slot: "stage",
  hint: "0:13 — “Come to Shaq, Beast.”",
  content: stub("The clip", "The moment you are about to send, trimmed.", true),
};

const SEND: RawPane = {
  id: "send",
  label: "Send",
  slot: "support",
  hint: "You are only charged when it plays",
  content: stub(
    "Paste a link, or pick from a list",
    "The one thing this screen is for.",
    true,
  ),
};

const STREAM: RawPane = {
  id: "stream",
  label: "Their stream",
  slot: "lead",
  badge: "Live",
  content: stub("jagerzgoober, live", "Playing Dead by Daylight for 25 viewers."),
};

const FIND: RawPane = {
  id: "find",
  label: "Find",
  slot: "lead",
  hint: "Search what they said on stream",
  content: stub("Search", "Transcript hits across the archive."),
};

const LISTS: RawPane = {
  id: "lists",
  label: "Your lists",
  slot: "aside",
  badge: "4",
  content: stub("Lists", "What you have kept, ready to send."),
};

/** The five doors the shipped surface leaves standing. */
const DOOR_FIND: RawDoor = {
  id: "find",
  label: "Find",
  slot: "lead",
  hint: "Search what they said",
};
const DOOR_LISTS: RawDoor = {
  id: "lists",
  label: "Your lists",
  slot: "aside",
  badge: "4",
};
const DOOR_STREAM: RawDoor = {
  id: "stream",
  label: "Their stream",
  slot: "lead",
  badge: "Live",
};
const DOOR_DROPS: RawDoor = {
  id: "drops",
  label: "Incoming",
  slot: "support",
  hint: "Clips people sent you",
};
const DOOR_CONTROLS: RawDoor = {
  id: "controls",
  label: "Overlay setup",
  slot: "support",
  hint: "Your own overlay",
};

/**
 * The continuum: a coherent VM at any point on the transport.
 *
 * The lab's clock drives this, so anything the container derives from transport
 * is derived here too, through the same helpers — a desync shows up immediately
 * rather than in production.
 */
export function frameAt(
  progress: number,
  overrides: Partial<PaneDockVM> = {},
): PaneDockVM {
  const clamped = clampProgress(progress);
  return {
    ...build(SEND_PURPOSE, [STREAM, CLIP, SEND], [DOOR_FIND, DOOR_LISTS], {
      progress: clamped,
      movingId: "stream",
      kind: "opening",
    }),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ *
 * Fixtures.
 * ------------------------------------------------------------------ */

/**
 * THE SURFACE AS SHIPPED. Two panes doing the job, five doors standing around
 * them — every one individually defensible, and together the reason the send
 * box is the smallest thing on a page called "Send a clip to jagerzgoober".
 */
export const SEND_FIVE_DOCKED = build(
  SEND_PURPOSE,
  [CLIP, SEND],
  [DOOR_FIND, DOOR_LISTS, DOOR_STREAM, DOOR_DROPS, DOOR_CONTROLS],
);

/**
 * THE SAME PANES, DOORS RANKED AGAINST `purpose`. "Overlay setup" is the
 * streamer's own machine and this viewer is not the streamer; "Incoming" is
 * what people send THEM. Neither belongs to the sentence at the top, so neither
 * gets standing chrome — they are reachable from the overflow, not from a rail.
 */
export const SEND_JOB_ONLY = build(
  SEND_PURPOSE,
  [CLIP, SEND],
  [DOOR_FIND, DOOR_LISTS],
);

/** Nothing put away: one pane, zero chrome. The state a leaf must draw no dock in. */
export const SOLO = build(SEND_PURPOSE, [SEND], []);

export const SETTLED = frameAt(1);

export const OPENING_EARLY = frameAt(0.12);

export const OPENING_MID = frameAt(0.5);

export const OPENING_LATE = frameAt(0.9);

/** A pane on its way out — the half of the transport `opening` never shows. */
export const CLOSING_MID = build(
  SEND_PURPOSE,
  [STREAM, CLIP, SEND],
  [DOOR_FIND, DOOR_LISTS],
  { progress: 0.5, movingId: "stream", kind: "closing" },
);

export const REDUCED_MOTION = build(
  SEND_PURPOSE,
  [STREAM, CLIP, SEND],
  [DOOR_FIND, DOOR_LISTS],
  { progress: 0.5, movingId: "stream", reducedMotion: true },
);

/** Narrow: doors cannot stand in a row, and the leaf must say so structurally. */
export const NARROW = build(
  SEND_PURPOSE,
  [CLIP, SEND],
  [DOOR_FIND, DOOR_LISTS, DOOR_STREAM, DOOR_DROPS, DOOR_CONTROLS],
  { density: "narrow", overlayOpen: false },
);

/** The sheet a narrow leaf opens. Rendered as data so the lab needs no click. */
export const NARROW_SHEET_OPEN = build(
  SEND_PURPOSE,
  [CLIP, SEND],
  [DOOR_FIND, DOOR_LISTS, DOOR_STREAM, DOOR_DROPS, DOOR_CONTROLS],
  { density: "narrow", overlayOpen: true },
);

/** Every optional field absent. A leaf must not leave a gap where they were. */
export const NO_OPTIONALS = build(
  { title: "Send a clip", subtitle: null, badge: null },
  [
    { id: "clip", label: "Clip", slot: "stage", content: stub("The clip", "No hint, no badge.", true) },
    { id: "send", label: "Send", slot: "support", content: stub("Send", "No hint, no badge.") },
  ],
  [
    { id: "find", label: "Find", slot: "lead" },
    { id: "lists", label: "Lists", slot: "aside" },
  ],
);

/** A pane that may not be docked — a leaf renders no control rather than a dead one. */
export const UNDOCKABLE_STAGE = build(
  SEND_PURPOSE,
  [{ ...CLIP, dockable: false }, SEND],
  [DOOR_FIND, DOOR_LISTS],
);

export const LONG_COPY = build(
  {
    title:
      "Send a clip to a streamer whose display name runs long enough to wrap across two lines on a narrow column",
    subtitle:
      "It plays full-screen on their live stream with your name on it, and you are only charged for the seconds it actually spends on air.",
    badge: "Overlay is up — drops play on stream",
  },
  [
    {
      ...CLIP,
      hint: "0:13 — “Come to Shaq, Beast, and bring the whole entire lobby with you while you are at it”",
    },
    SEND,
  ],
  [
    { ...DOOR_FIND, hint: "Search every word they have said on stream, across the whole archive" },
    DOOR_LISTS,
  ],
);

/** Twelve doors. If a leaf's dock does not scale, this is where it says so. */
export const MANY_DOCKED = build(
  SEND_PURPOSE,
  [CLIP, SEND],
  Array.from({ length: 12 }, (_, i) => ({
    id: `pane-${i}`,
    label: `Pane ${i + 1}`,
    slot: (["lead", "stage", "support", "aside"] as const)[i % 4],
    badge: i % 3 === 0 ? String(i + 1) : null,
  })),
  { overlayOpen: false },
);

/** Everything docked, nothing open — a workspace put entirely away. */
export const ALL_DOCKED = build(
  SEND_PURPOSE,
  [],
  [DOOR_FIND, DOOR_LISTS, DOOR_STREAM, DOOR_DROPS, DOOR_CONTROLS],
);

export const EMPTY = build(
  { title: "Nothing open", subtitle: null, badge: null },
  [],
  [],
  { emptyLabel: "Nothing here yet — open a pane to get started." },
);

/** Four open panes, one per slot. The widest arrangement a leaf must survive. */
export const FOUR_SLOTS = build(
  SEND_PURPOSE,
  [FIND, CLIP, SEND, LISTS],
  [DOOR_DROPS],
);

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Send page — five docked": SEND_FIVE_DOCKED,
  "Send page — the job": SEND_JOB_ONLY,
  Solo: SOLO,
  Settled: SETTLED,
  "Opening — early": OPENING_EARLY,
  "Opening — mid": OPENING_MID,
  "Opening — late": OPENING_LATE,
  "Closing — mid": CLOSING_MID,
  "Reduced motion": REDUCED_MOTION,
  Narrow: NARROW,
  "Narrow — sheet open": NARROW_SHEET_OPEN,
  "No optionals": NO_OPTIONALS,
  "Undockable stage": UNDOCKABLE_STAGE,
  "Long copy": LONG_COPY,
  "Many docked": MANY_DOCKED,
  "All docked": ALL_DOCKED,
  "Four slots": FOUR_SLOTS,
  Empty: EMPTY,
} satisfies Record<string, PaneDockVM>;

export type PaneDockFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: PaneDockFixtureName = "Send page — five docked";
