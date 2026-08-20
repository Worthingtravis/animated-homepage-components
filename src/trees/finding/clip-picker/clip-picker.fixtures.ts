/**
 * Fixtures for `finding/clip-picker`.
 *
 * The running example is a viewer who landed on jagerzgoober's send page from a
 * Twitch panel, remembers roughly one thing, and has never used this site
 * before. Every fixture below is a real instant in that minute — including the
 * ones nobody designs for: the dead-end search, the queue that filled up while
 * you were reading, the clip with no thumbnail because the VOD expired.
 *
 * `build()` mirrors what `clip-picker-connected.tsx` does, and both derive
 * through the same `.vm.ts` helpers, so a fixture cannot drift into a shape the
 * container would never produce.
 */

import {
  adaptSendPanel,
  clampProgress,
  formatResultLabel,
  resolveSendAction,
  splitTranscript,
  type ClipCard,
  type ClipPickerImage,
  type ClipPickerVM,
  type ClipSendState,
  type ClipShelf,
  type SearchSuggestion,
  type SendPanelVMLike,
  type TranscriptSegment,
} from "./clip-picker.vm";

const noop = () => {};

const THUMB: ClipPickerImage = {
  src: "/forest/clip-thumb-placeholder.svg",
  alt: "Clip thumbnail",
  width: 320,
  height: 180,
};

/* ------------------------------------------------------------- builders */

type CardInput = {
  id: string;
  title: string;
  duration: string;
  age?: string | null;
  plays?: string | null;
  timestamp?: string | null;
  badge?: string | null;
  creatorLabel?: string | null;
  thumbnail?: ClipPickerImage | null;
  line?: string | null;
  send?: ClipSendState;
  sendHint?: string | null;
  queueLabel?: string | null;
  preview?: boolean;
};

function card(input: CardInput, query = ""): ClipCard {
  const quote: TranscriptSegment[] | null = input.line
    ? splitTranscript(input.line, query)
    : null;

  return {
    id: input.id,
    title: input.title,
    creatorLabel: input.creatorLabel ?? null,
    duration: input.duration,
    age: input.age ?? null,
    plays: input.plays ?? null,
    timestamp: input.timestamp ?? null,
    thumbnail: input.thumbnail === undefined ? THUMB : input.thumbnail,
    badge: input.badge ?? null,
    quote,
    send: resolveSendAction(input.send ?? "ready", {
      title: input.title,
      hint: input.sendHint ?? null,
      queueLabel: input.queueLabel ?? null,
      onSend: noop,
    }),
    onPreview: input.preview === false ? null : noop,
    previewAriaLabel: input.preview === false ? null : `Preview ${input.title}`,
  };
}

function shelf(
  id: string,
  label: string,
  items: ClipCard[],
  options: { hint?: string | null; featured?: boolean } = {},
): ClipShelf {
  return {
    id,
    label,
    hint: options.hint ?? null,
    headingId: `clip-picker-shelf-${id}`,
    featured: options.featured ?? false,
    items,
  };
}

function suggestion(id: string, label: string, count: string | null): SearchSuggestion {
  return { id, label, count, onPick: noop };
}

const SUGGESTIONS: SearchSuggestion[] = [
  suggestion("fish", "the fish incident", "12 moments"),
  suggestion("rage", "rage quits", "48 moments"),
  suggestion("nurse", "adept nurse attempts", "31 moments"),
  suggestion("chat", "reading chat out loud", "76 moments"),
];

/* --------------------------------------------------------------- cards */

const PINNED: ClipCard[] = [
  card({
    id: "pin-1",
    title: "The fish incident",
    duration: "0:22",
    age: "2 weeks ago",
    plays: "18.4K plays",
    badge: "Streamer pick",
    sendHint: "plays in about 2 min",
  }),
  card({
    id: "pin-2",
    title: "Adept nurse, attempt 47",
    duration: "0:41",
    age: "4 days ago",
    plays: "6.1K plays",
    badge: "Streamer pick",
    sendHint: "plays in about 2 min",
  }),
  card({
    id: "pin-3",
    title: "Reads chat, immediately regrets it",
    duration: "0:15",
    age: "3 days ago",
    plays: "9.8K plays",
    badge: "Chat favourite",
  }),
];

const RECENT: ClipCard[] = [
  card({ id: "rec-1", title: "Clutch on Ormond", duration: "0:33", age: "yesterday", plays: "2.2K plays" }),
  card({ id: "rec-2", title: "Explains the build for the ninth time", duration: "1:04", age: "2 days ago", plays: "1.1K plays" }),
  card({ id: "rec-3", title: "Genuinely good hex placement", duration: "0:28", age: "2 days ago", plays: "890 plays" }),
  card({ id: "rec-4", title: "Loses to a flashlight", duration: "0:19", age: "3 days ago", plays: "3.4K plays" }),
];

const SHORT: ClipCard[] = [
  card({ id: "sh-1", title: "hi", duration: "0:04", age: "1 hour ago", plays: "40 plays", thumbnail: null }),
  card({ id: "sh-2", title: "Perfect skill check, no reaction", duration: "0:07", age: "5 hours ago", plays: "620 plays" }),
];

const QUERY = "fish";

const RESULTS: ClipCard[] = [
  card(
    {
      id: "res-1",
      title: "The fish incident",
      duration: "0:22",
      timestamp: "1:42:07",
      age: "2 weeks ago",
      plays: "18.4K plays",
      line: "no — no, the fish is not supposed to do that, why is the fish doing that",
      sendHint: "plays in about 2 min",
    },
    QUERY,
  ),
  card(
    {
      id: "res-2",
      title: "Aquarium arc, day one",
      duration: "0:48",
      timestamp: "0:12:55",
      age: "3 weeks ago",
      plays: "4.0K plays",
      line: "chat I bought a fish. that's it. that's the stream update.",
    },
    QUERY,
  ),
  card(
    {
      id: "res-3",
      title: "Naming the fish",
      duration: "2:11",
      timestamp: "2:58:31",
      age: "3 weeks ago",
      plays: "1.7K plays",
      line: "we are NOT naming the fish after a killer. absolutely not. ...fine. Nurse.",
    },
    QUERY,
  ),
];

/* ---------------------------------------------------------------- base */

/** Everything is overridable, and `search` merges field-by-field. */
type Overrides = Partial<Omit<ClipPickerVM, "search">> & {
  search?: Partial<ClipPickerVM["search"]>;
};

function build(overrides: Overrides = {}): ClipPickerVM {
  const search: ClipPickerVM["search"] = {
    query: "",
    label: "Search what they said",
    placeholder: "Search what they said…",
    resultLabel: null,
    hint: "Every word from every VOD. Try a phrase you remember.",
    onQueryChange: noop,
    onClear: null,
    suggestions: SUGGESTIONS,
    suggestionsLabel: "Or start here",
    ...overrides.search,
  };

  return {
    state: "browse",
    progress: 1,
    reducedMotion: false,
    density: "wide",
    scopeId: "clip-picker-demo",
    purpose: {
      title: "Send a clip to jagerzgoober",
      subtitle: "It plays on their stream. Pick one — that is the whole thing.",
      badge: "Overlay is up",
    },
    scope: {
      value: "all",
      label: "Search",
      options: [
        { value: "all", label: "Every VOD" },
        { value: "stream", label: "Tonight's stream" },
        { value: "mine", label: "Clips I sent" },
      ],
      onChange: noop,
    },
    notice: null,
    shelves: [
      shelf("pinned", "jagerzgoober's picks", PINNED, {
        hint: "Hand-picked. Safe bets.",
        featured: true,
      }),
      shelf("recent", "From this week", RECENT, { hint: "Fresh — chat has seen these." }),
      shelf("short", "Under 10 seconds", SHORT, { hint: "For when the queue is long." }),
    ],
    results: [],
    emptyLabel: "Nothing matched that.",
    offlineLabel: "Nothing to send yet — jagerzgoober has no clips indexed.",
    loadingLabel: "Loading clips…",
    skeletonCount: 3,
    ...overrides,
    search,
  };
}

function searched(query: string, results: ClipCard[], overrides: Overrides = {}): ClipPickerVM {
  return build({
    state: results.length > 0 ? "results" : "empty",
    results,
    ...overrides,
    search: {
      query,
      resultLabel: formatResultLabel(results.length),
      hint: null,
      onClear: noop,
      ...overrides.search,
    },
  });
}

/* ------------------------------------------------------------ frameAt */

/**
 * A coherent VM at any instant of the results settle.
 *
 * The clock here drives *arrival*, not a loop: the first third is the query in
 * flight with the previous screen still up, and the rest is the result list
 * settling in. Frozen fixtures below are samples of exactly this.
 */
export function frameAt(progress: number, overrides: Overrides = {}): ClipPickerVM {
  const p = clampProgress(progress);
  if (p < 0.34) {
    return build({
      state: "searching",
      progress: p / 0.34,
      ...overrides,
      search: {
        query: QUERY,
        resultLabel: null,
        hint: "Searching every VOD…",
        onClear: noop,
        ...overrides.search,
      },
    });
  }
  return searched(QUERY, RESULTS, { progress: (p - 0.34) / 0.66, ...overrides });
}

/* ----------------------------------------------------------- fixtures */

export const ALL_FIXTURES: Record<string, ClipPickerVM> = {
  /* The default and the one that has to be good. */
  "Browse — the streamer's shelves": build(),

  "Browse — one shelf only": build({
    shelves: [shelf("pinned", "jagerzgoober's picks", PINNED, { hint: "That is the list.", featured: true })],
  }),

  /* A curator who pinned nothing. The suggestions are the only warm start. */
  "Browse — nothing curated": build({
    shelves: [shelf("recent", "From this week", RECENT, { hint: "Nobody has pinned anything yet." })],
  }),

  "Search — results": searched(QUERY, RESULTS),

  "Search — one result": searched(QUERY, [RESULTS[0]]),

  /* The dead end. `emptyLabel` plus suggestions are the only way back out. */
  "Search — nothing matched": searched("hexadecimal", []),

  "Search — in flight": frameAt(0.2),
  "Search — arriving (early)": frameAt(0.4),
  "Search — arriving (mid)": frameAt(0.66),
  "Search — settled": frameAt(1),

  /* Sending is per card: one in flight, one done, one blocked, one ready. */
  "Sending — one card in flight": searched(QUERY, [
    { ...RESULTS[0], send: resolveSendAction("sending", { title: RESULTS[0].title }) },
    RESULTS[1],
    RESULTS[2],
  ]),

  "Sent — confirmation on the card": searched(QUERY, [
    {
      ...RESULTS[0],
      send: resolveSendAction("sent", {
        title: RESULTS[0].title,
        queueLabel: "Sent · 3rd in queue",
        hint: "plays in about 4 min",
      }),
    },
    RESULTS[1],
    RESULTS[2],
  ]),

  "Blocked — the queue filled up": build({
    shelves: [
      shelf(
        "pinned",
        "jagerzgoober's picks",
        PINNED.map((item) => ({
          ...item,
          send: resolveSendAction("blocked", { title: item.title, hint: "try again in a few minutes" }),
        })),
        { hint: "Hand-picked. Safe bets.", featured: true },
      ),
    ],
  }),

  /*
   * Sending is off, but the shelves stay. The case the adapter used to render
   * as `offline` — which deleted the shortlist at the one moment it is the
   * reason to come back later.
   */
  "Paused — the shelves stay up": build({
    notice: { message: "jagerzgoober has drops paused right now.", tone: "blocked" },
    purpose: {
      title: "Send a clip to jagerzgoober",
      subtitle: "It plays on their stream. Pick one — that is the whole thing.",
      badge: null,
    },
    shelves: [
      shelf(
        "pinned",
        "jagerzgoober's picks",
        PINNED.map((item) => ({
          ...item,
          send: resolveSendAction("blocked", {
            title: item.title,
            blocked: { label: "Paused", reason: "sending is switched off right now" },
          }),
        })),
        { hint: "Still here when it comes back.", featured: true },
      ),
    ],
  }),

  /* A notice that is not a refusal — the surface still works. */
  "Notice — informational": build({
    notice: { message: "Tonight's VOD is still processing. Older clips search fine.", tone: "info" },
  }),

  "Loading — first paint": build({ state: "loading", shelves: [], progress: 0 }),

  /* The narrow, honest `offline`: nothing to show at all. */
  "Offline — nothing indexed": build({ state: "offline", shelves: [], scope: null }),

  "Reduced motion": frameAt(0.5, { reducedMotion: true }),

  "Narrow — phone from a Twitch panel": build({ density: "narrow" }),

  "Narrow — search results": searched(QUERY, RESULTS, { density: "narrow" }),

  /* Long copy everywhere it can hurt: title, quote, shelf label, hint. */
  "Long copy": searched("supposed to", [
    card(
      {
        id: "long-1",
        title:
          "The one where the fish is genuinely not supposed to be doing that and everybody in chat notices at the same time",
        duration: "4:52",
        timestamp: "3:41:19",
        age: "2 weeks ago",
        plays: "18,412 plays",
        badge: "Chat favourite · pinned by jagerzgoober himself",
        creatorLabel: "from jagerzgoober",
        line:
          "no — no, the fish is not supposed to do that, why is the fish doing that, chat what do I do, is it supposed to be sideways, it is NOT supposed to be sideways",
        sendHint: "plays in about 11 minutes, there are 6 clips ahead of yours",
      },
      "supposed to",
    ),
  ]),

  /* Optionals gone: no badges, no thumbnails, no timestamps, no hints. */
  "No optionals": build({
    purpose: { title: "Send a clip", subtitle: null, badge: null },
    scope: null,
    shelves: [
      shelf("bare", "Clips", [
        card({ id: "b-1", title: "Clip one", duration: "0:10", age: null, plays: null, thumbnail: null, preview: false }),
        card({ id: "b-2", title: "Clip two", duration: "0:12", age: null, plays: null, thumbnail: null, preview: false }),
      ]),
    ],
    search: { hint: null, suggestions: [] },
  }),

  /* Where a shelf layout gives up: twelve rows and a wall of results. */
  "Many results": searched(
    "the",
    Array.from({ length: 14 }, (_, index) =>
      card(
        {
          id: `many-${index}`,
          title: `Moment ${index + 1}`,
          duration: "0:20",
          timestamp: `${index}:15:00`,
          age: `${index + 1} days ago`,
          plays: `${index * 137} plays`,
          line: `and then the thing happened, which is the part everybody remembers`,
        },
        "the",
      ),
    ),
  ),

  "Many shelves": build({
    shelves: [
      shelf("pinned", "jagerzgoober's picks", PINNED, { featured: true, hint: "Hand-picked." }),
      shelf("recent", "From this week", RECENT),
      shelf("short", "Under 10 seconds", SHORT),
      shelf("dbd", "Dead by Daylight", RECENT.slice(0, 2)),
      shelf("chatting", "Just chatting", SHORT),
      shelf("old", "The classics", PINNED.slice(0, 2), { hint: "Older than the overlay." }),
    ],
  }),
};

/* ------------------------------------------------------------- the port */

/**
 * A real send panel's shape, lifted.
 *
 * This is yapdrop's `SendPanelVM` reduced to the fields `adaptSendPanel` reads,
 * with its own vocabulary intact — `quickPicks.rows[].meta` is their sentence
 * ("1 clip · 3s"), not one this file wrote. Adding it to `ALL_FIXTURES` is what
 * makes the portability claim a passing test: the conformance suite renders it
 * through all four leaves, so "your shortlist works with no selection step" is
 * something you look at rather than something you are told.
 *
 * Note what is already true in the source shape: every row carries its own
 * `onSend`. The curated path in that product never had a chooser step — only
 * the paste-a-URL path does.
 */
const YAPDROP_SEND_PANEL: SendPanelVMLike = {
  step: "open",
  header: {
    name: "jagerzgoober",
    connected: true,
    statusLine: "Overlay connected · plays within a minute",
  },
  blurb: "Send a clip and it plays on their stream. They see it live.",
  quickPicks: {
    heading: "jagerzgoober's shortlist",
    hint: "Curated by them. One tap.",
    rows: [
      { listId: "ql-1", name: "Fails of the week", meta: "6 clips · 48s", playing: false, onPlay: noop, onSend: noop },
      { listId: "ql-2", name: "Nurse highlights", meta: "4 clips · 31s", playing: true, onPlay: noop, onSend: noop },
      { listId: "ql-3", name: "Chat moments", meta: "1 clip · 3s", playing: false, onPlay: noop, onSend: noop },
    ],
  },
  chargeNote: "1¢/sec · up to 30s",
};

ALL_FIXTURES["Ported — yapdrop send panel"] = adaptSendPanel(YAPDROP_SEND_PANEL, {
  scopeId: "clip-picker-ported",
});

/**
 * The same panel with the overlay shut.
 *
 * What to look for: the shortlist is **still on screen**. `closedMessage`
 * becomes a banner and every row reads "Paused" — it does not become a dead end
 * with the picks deleted, which is what this fixture asserted until the adapter
 * was corrected.
 */
ALL_FIXTURES["Ported — yapdrop, overlay closed"] = adaptSendPanel(
  {
    ...YAPDROP_SEND_PANEL,
    step: "closed",
    closedMessage: "jagerzgoober has drops paused right now.",
  },
  { scopeId: "clip-picker-ported-closed" },
);

export const DEFAULT_FIXTURE = "Browse — the streamer's shelves";
