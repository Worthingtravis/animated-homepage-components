/**
 * Expandable Card — fixtures.
 *
 * `sample` is the coherence engine: hand it a set of records, which one is open,
 * and where the opening has got to, and every field agrees with every other —
 * the card's `state`, the panel's `phase`, the resolved motion styles, the ids.
 * Every frozen fixture below is one of its samples, so no fixture can describe
 * a frame the running component cannot reach.
 *
 * Two of them carry **rectangles**, and they are the important ones. The morph
 * is arithmetic on two rects, so a fixture that supplies them is the only way
 * the conformance suite ever sees a real FLIP transform — everything else
 * exercises the fallback. `MORPH_MID` and `MORPH_START` pin the measured path;
 * the rest pin what happens without it.
 *
 * Every string here is frozen on purpose. A fixture that formatted a date at
 * run time would render differently on every run and the suite would be
 * asserting against weather.
 */

import { LAB_CYCLE_MS } from "@/lib/lab-clock";

import { resolveMotion } from "./expandable-card.transitions";
import {
  cardAnchor,
  cardIds,
  clampProgress,
  resolveExpandableCardState,
  resolveItemState,
  unavailableAction,
  type ExpandableCardAction,
  type ExpandableCardItem,
  type ExpandableCardPhase,
  type ExpandableCardVM,
  type Rect,
} from "./expandable-card.vm";

const noop = () => {};

const SCOPE = "clips";
const THUMB = "/forest/clip-thumb-placeholder.svg";

/** The raw records. Everything else on this page is derived from these. */
type Record_ = {
  id: string;
  title: string;
  subtitle: string;
  meta: string | null;
  body: string[];
  facts: Array<{ label: string; value: string }>;
  action: ExpandableCardAction | null;
};

function play(label: string): ExpandableCardAction {
  return { label, href: null, onActivate: noop, disabled: false, tone: "primary" };
}

const RECORDS: Record_[] = [
  {
    id: "fish",
    title: "The fish incident",
    subtitle: "Stardew Valley · Feb 12",
    meta: "6 min",
    body: [
      "Four minutes of increasingly unwise decisions, ending with the legendary fish and a chair that did not survive.",
      "Clipped by the chat, not by the streamer — which is why it starts a beat late and nobody minds.",
    ],
    facts: [
      { label: "Length", value: "6 min" },
      { label: "Clipped by", value: "27 viewers" },
      { label: "Peak", value: "4:12" },
    ],
    action: play("Play"),
  },
  {
    id: "keyboard",
    title: "Keyboard, meet floor",
    subtitle: "Just Chatting · Feb 9",
    meta: "2 min",
    body: [
      "A sneeze, a cable, and the only mechanical keyboard in the room. The apology to the desk is the best part.",
    ],
    facts: [
      { label: "Length", value: "2 min" },
      { label: "Clipped by", value: "12 viewers" },
    ],
    action: play("Play"),
  },
  {
    id: "speedrun",
    title: "Sub-40, finally",
    subtitle: "Celeste · Jan 30",
    meta: "9 min",
    body: [
      "Eleven months of attempts land in one run. The silence between the last two rooms is the whole clip.",
      "The reaction at the end is why this one gets sent to people who do not play Celeste.",
    ],
    facts: [
      { label: "Length", value: "9 min" },
      { label: "Attempt", value: "#2,418" },
      { label: "Peak", value: "8:51" },
    ],
    action: play("Play"),
  },
  {
    id: "cat",
    title: "The cat takes the mic",
    subtitle: "Just Chatting · Jan 22",
    meta: "3 min",
    body: [
      "Three minutes of a cat asleep on the boom arm while the stream continues around it.",
    ],
    facts: [
      { label: "Length", value: "3 min" },
      { label: "Clipped by", value: "51 viewers" },
    ],
    action: play("Play"),
  },
  {
    id: "chart",
    title: "Explaining the spreadsheet",
    subtitle: "Just Chatting · Jan 14",
    meta: "12 min",
    body: [
      "The annual budget stream, in which a colour-coded sheet is defended with more conviction than the game it funds.",
    ],
    facts: [
      { label: "Length", value: "12 min" },
      { label: "Clipped by", value: "8 viewers" },
    ],
    action: play("Play"),
  },
  {
    id: "raid",
    title: "Raided mid-sentence",
    subtitle: "Valheim · Jan 3",
    meta: "4 min",
    body: ["Two thousand people arrive during a story about a sandwich. The story finishes."],
    facts: [
      { label: "Length", value: "4 min" },
      { label: "Raid size", value: "2,104" },
    ],
    action: play("Play"),
  },
];

type Chrome = { eyebrow: string | null; headline: string | null; body: string | null };

const CHROME: Chrome = {
  eyebrow: "From the last month",
  headline: "Clips worth sending",
  body: "Press one to open it. Everything the panel shows is the same record the card showed.",
};

/**
 * The coherence engine.
 *
 * `openId` decides the state, the card roles and whether there is a panel;
 * `phase` and `progress` decide the motion. Nothing here is hand-written — the
 * same functions the container calls produce it.
 */
export function sample(options: {
  records?: Record_[];
  openId?: string | null;
  phase?: ExpandableCardPhase;
  progress?: number;
  transition?: string;
  reducedMotion?: boolean;
  origin?: Rect | null;
  target?: Rect | null;
  chrome?: Partial<Chrome> | null;
}): ExpandableCardVM {
  const records = options.records ?? RECORDS;
  const openId = options.openId ?? null;
  const phase = options.phase ?? "open";
  const progress = clampProgress(options.progress ?? 1);
  const reducedMotion = options.reducedMotion ?? false;
  const chrome = options.chrome === null ? null : { ...CHROME, ...options.chrome };

  const cards: ExpandableCardItem[] = records.map((record) => {
    const ids = cardIds(SCOPE, record.id);
    return {
      id: record.id,
      title: record.title,
      subtitle: record.subtitle,
      meta: record.meta,
      media: { src: THUMB, alt: `Thumbnail for ${record.title}`, width: 640, height: 360 },
      state: resolveItemState(record.id, openId),
      triggerId: ids.triggerId,
      panelId: ids.panelId,
      anchor: cardAnchor(record.id),
      onExpand: noop,
      action: record.action,
    };
  });

  const openIndex = records.findIndex((record) => record.id === openId);
  const openRecord = openIndex >= 0 ? records[openIndex] : null;
  const openCard = openIndex >= 0 ? cards[openIndex] : null;
  const ids = openRecord ? cardIds(SCOPE, openRecord.id) : null;

  return {
    state: resolveExpandableCardState(cards.length, openRecord ? openId : null),
    progress,
    reducedMotion,
    eyebrow: chrome?.eyebrow ?? null,
    headline: chrome?.headline ?? null,
    body: chrome?.body ?? null,
    cards,
    panel:
      openRecord && openCard && ids
        ? {
            id: ids.panelId,
            titleId: ids.titleId,
            labelledBy: ids.triggerId,
            card: openCard,
            body: openRecord.body,
            facts: openRecord.facts,
            action: openRecord.action,
            close: { label: "Close", onClose: noop },
            phase,
            motion: resolveMotion(
              options.transition,
              {
                phase,
                progress,
                origin: options.origin ?? null,
                target: options.target ?? null,
              },
              reducedMotion,
            ),
          }
        : null,
    emptyLabel: "No clips from this month yet",
  };
}

/**
 * A plausible measured pair: a card in the third column of a grid, opening into
 * a panel centred in a 1280×800 viewport. These are the numbers the morph
 * actually runs on, so a leaf that forgets to clip its surface shows it here.
 */
export const ORIGIN_RECT: Rect = { x: 848, y: 372, width: 288, height: 220 };
export const TARGET_RECT: Rect = { x: 340, y: 96, width: 600, height: 608 };

/* ------------------------------------------------------------------ frames */

/** The default. Nothing open — the state that has to be good. */
export const BROWSING = sample({});

/** One card open, everything settled. No motion left to run. */
export const OPEN = sample({ openId: "fish" });

/** Mid-opening, unmeasured — the fallback path every server render takes. */
export const OPENING = sample({ openId: "fish", phase: "entering", progress: 0.35 });

/** Mid-opening, measured. The real FLIP: the panel is still mostly card-shaped. */
export const MORPH_START = sample({
  openId: "speedrun",
  phase: "entering",
  progress: 0.12,
  origin: ORIGIN_RECT,
  target: TARGET_RECT,
});

/** Halfway through a measured morph. The frame to compare leaves on. */
export const MORPH_MID = sample({
  openId: "speedrun",
  phase: "entering",
  progress: 0.5,
  origin: ORIGIN_RECT,
  target: TARGET_RECT,
});

/** On the way out. The panel is still mounted — that is what makes an exit possible. */
export const CLOSING = sample({
  openId: "fish",
  phase: "leaving",
  progress: 0.5,
  origin: ORIGIN_RECT,
  target: TARGET_RECT,
});

/** A different preset entirely, same VM. Nothing about a leaf changes. */
export const SHEET = sample({
  openId: "keyboard",
  phase: "entering",
  progress: 0.45,
  transition: "sheet",
});

/**
 * Reduced motion. Every style is settled before the preset runs, so the panel
 * is simply present — and a leaf that animates on its own is visible here.
 */
export const REDUCED_MOTION = sample({
  openId: "fish",
  phase: "entering",
  progress: 0.2,
  reducedMotion: true,
  origin: ORIGIN_RECT,
  target: TARGET_RECT,
});

/** Long copy everywhere. Titles wrap, the panel scrolls, nothing is truncated silently. */
export const LONG_COPY = sample({
  openId: "long",
  chrome: {
    headline:
      "Everything from the last four weeks, including the stream that ran nine hours and produced exactly one clip",
    body: "Press any card to open it — the panel is the same record, with the parts that did not fit on a card.",
  },
  records: [
    {
      id: "long",
      title:
        "The nine hour stream that produced exactly one clip, and the clip is four seconds of silence",
      subtitle: "Just Chatting · Feb 20 · with a guest whose name takes the rest of this line",
      meta: "4 sec",
      body: [
        "Nine hours of setup, troubleshooting, a rewired desk, two failed captures and one genuinely excellent explanation of why the audio interface was never the problem.",
        "What survives is four seconds in which nobody says anything and the fan noise stops. Chat clipped it forty times.",
        "The rest of the stream is in the VOD, and the VOD is not the point — this is the argument for a card that opens rather than a page that loads.",
      ],
      facts: [
        { label: "Length", value: "4 sec" },
        { label: "Stream length", value: "9 hr 12 min" },
        { label: "Clipped by", value: "40 viewers" },
        { label: "Peak concurrent", value: "1,208" },
      ],
      action: play("Play the four seconds"),
    },
    ...RECORDS.slice(0, 3),
  ],
});

/** Twelve cards. A grid that only works at six is a grid that does not work. */
export const MANY_ITEMS = sample({
  records: [
    ...RECORDS,
    ...RECORDS.map((record) => ({
      ...record,
      id: `${record.id}-2`,
      subtitle: record.subtitle.replace("Feb", "Dec").replace("Jan", "Nov"),
    })),
  ],
});

/**
 * Missing optionals: no meta line, no card action, one action unavailable. The
 * unavailable one is still rendered — see `unavailableAction`.
 */
export const NO_ACTIONS = sample({
  openId: "cat",
  records: RECORDS.slice(0, 4).map((record, index) => ({
    ...record,
    meta: null,
    facts: [],
    action: index === 3 ? unavailableAction("Unavailable") : null,
  })),
});

/** One card. It must not stretch across a six-column grid on its own. */
export const SINGLE = sample({ records: RECORDS.slice(0, 1) });

/** Nothing at all. The honest empty, not a skeleton. */
export const EMPTY = sample({ records: [], chrome: { body: null } });

/** No collection chrome — the tree dropped into something that already has a heading. */
export const NO_CHROME = sample({ chrome: null });

/**
 * The lab's clock. One complete interaction per cycle: open, dwell, close,
 * rest. Sweeping `progress` alone would leave the panel entering forever, which
 * is the one thing a real opening never does.
 */
export function frameAt(progress: number): ExpandableCardVM {
  const p = clampProgress(progress);
  const measured = { origin: ORIGIN_RECT, target: TARGET_RECT };

  if (p < 0.08) return sample({});
  if (p < 0.33) {
    return sample({ openId: "fish", phase: "entering", progress: (p - 0.08) / 0.25, ...measured });
  }
  if (p < 0.62) return sample({ openId: "fish", phase: "open", progress: 1, ...measured });
  if (p < 0.87) {
    return sample({ openId: "fish", phase: "leaving", progress: (p - 0.62) / 0.25, ...measured });
  }
  return sample({});
}

/** How long one open/close cycle takes in the lab. Documented so it can be tuned. */
export const CYCLE_MS = LAB_CYCLE_MS;

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Browsing": BROWSING,
  "Open": OPEN,
  "Opening — unmeasured": OPENING,
  "Morph — t=0.12": MORPH_START,
  "Morph — t=0.5": MORPH_MID,
  "Closing — t=0.5": CLOSING,
  "Sheet preset — t=0.45": SHEET,
  "Reduced motion": REDUCED_MOTION,
  "Long copy": LONG_COPY,
  "Many items — 12": MANY_ITEMS,
  "Missing optionals": NO_ACTIONS,
  "Single card": SINGLE,
  "No chrome": NO_CHROME,
  "Empty": EMPTY,
} satisfies Record<string, ExpandableCardVM>;

export type ExpandableCardFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: ExpandableCardFixtureName = "Browsing";
