/**
 * Clip Picker — THE CONTRACT.
 *
 * The tree that answers one question: *what do I send this streamer?*
 *
 * ── The problem, stated honestly ───────────────────────────────────────────
 * A viewer arrives from a Twitch panel with a vague memory — "the bit where he
 * screamed at the fish" — and a set of ten thousand clips. Every send surface
 * that has ever shipped answers this with a search box and a grid, and every
 * one of them is wrong for the same reason: **a search box is a demand that the
 * viewer already knows the words.** Most do not. They know a feeling, a game,
 * and roughly when.
 *
 * So this contract carries two ways in and treats them as one surface:
 *
 *   1. **Shelves** the streamer pre-established. Zero typing. This is the
 *      default state and it is the one that has to be good.
 *   2. **Transcript search** for the viewer who *does* have the words — and,
 *      critically, `suggestions`, which are searches the streamer curated. A
 *      suggestion is the bridge: it turns "I can't describe it" into one tap.
 *
 * ── Three decisions that are load-bearing ──────────────────────────────────
 *
 * **Sending is on the card, not on a panel.** `ClipCard.send` carries its own
 * state and its own label, so a leaf confirms a send *where the person was
 * looking*. There is no selected-item field in this VM, no "now go to the send
 * panel", and no modal — because the moment a picker has a selection it has two
 * places to look at once, and that is the failure `chrome/pane-dock` documents.
 *
 * **A match is a data structure, not string surgery.** `TranscriptSegment[]`
 * arrives pre-split into matched and unmatched runs. A leaf maps and styles;
 * it never sees the query, never runs a regex, never calls `.split()`. That is
 * what keeps highlighting identical across four leaves and what makes an
 * overlapping or accent-folded match a container problem, where it belongs.
 *
 * **`state` distinguishes "no query" from "no results".** `browse` and `empty`
 * look nothing alike and mean opposite things — one is the front door, one is a
 * dead end that has to offer a way out. A leaf that derived this from
 * `results.length === 0` would render the dead end on first paint.
 *
 * Pure. No hooks, no fetch, no `window`. The container owns the query, the
 * debounce and the network; fixtures freeze every one of them.
 */

/**
 * Explicit visual state. Leaves switch on this — never on derived checks.
 *
 * - `loading`  — first paint, nothing to show yet.
 * - `browse`   — no query. The streamer's shelves. The default and the point.
 * - `searching`— a query is in flight. Previous results may still be on screen.
 * - `results`  — a query with matches.
 * - `empty`    — a query with no matches. Must offer a way back out.
 * - `offline`  — nothing to pick from **at all** (no shelves, no index).
 *
 * `offline` is the narrowest state on this tree and it is deliberately hard to
 * reach. "Sending is switched off right now" is NOT offline — see `notice`.
 */
export type ClipPickerState =
  | "loading"
  | "browse"
  | "searching"
  | "results"
  | "empty"
  | "offline";

/** Set by the container from a media query. Never a leaf's own measurement. */
export type ClipPickerDensity = "wide" | "narrow";

/**
 * One sentence across the top of the picker, when something is true about the
 * whole surface that the cards cannot say for themselves.
 *
 * This field exists because of a bug worth naming. `adaptSendPanel` used to map
 * a *paused* streamer onto `offline`, which every leaf renders as a single
 * sentence with the shelves gone — so the one moment a viewer most needs to see
 * the shortlist (they came back, sending is off, the list is the reason to
 * return later) was the one moment it was deleted. "Nothing to send" and "you
 * cannot send right now" are different facts and only the first is a state.
 *
 * `blocked` means the surface cannot act; every card's `send` will be `blocked`
 * too, and a leaf that renders both is not repeating itself — the banner says
 * why, the buttons say which.
 */
export type ClipPickerNotice = {
  /** Pre-formatted, the streamer's own words where there are any. */
  message: string;
  tone: "info" | "blocked";
};

/**
 * One run of transcript text, already decided.
 *
 * `match: true` is what the viewer typed, located by the container. A leaf
 * styles the two runs differently and does nothing else — see the header.
 */
export type TranscriptSegment = {
  text: string;
  match: boolean;
};

/** Pre-resolved dimensions so a leaf never measures. Mirrors `channel-hero`. */
export type ClipPickerImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * What pressing Send currently means for one card.
 *
 * The state lives per card rather than per surface because a viewer sends two
 * or three in a row, and a global "sending" flag would freeze the whole list
 * for the duration of one request.
 */
export type ClipSendState = "ready" | "sending" | "sent" | "blocked";

export type ClipSendAction = {
  state: ClipSendState;
  /** Pre-formatted — "Send", "Sending…", "Sent · 3rd in queue", "Queue full". */
  label: string;
  ariaLabel: string;
  /** Pre-formatted consequence — "plays in about 2 min". Null when unknown. */
  hint: string | null;
  /** Null exactly when the action is unavailable — `sending`, `sent`, `blocked`. */
  onSend: (() => void) | null;
};

/**
 * One clip, ready to render.
 *
 * `quote` is present only for a card that came out of transcript search. A card
 * on a curated shelf has no quote and does not pretend to — that difference is
 * the honest signal that the two ways in are different, and a leaf may show it.
 */
export type ClipCard = {
  id: string;
  title: string;
  /** Pre-formatted — "from jagerzgoober". Null when the surface is one channel. */
  creatorLabel: string | null;
  /** Pre-formatted — "0:14". Never a number of seconds. */
  duration: string;
  /** Pre-formatted — "3 days ago". */
  age: string | null;
  /** Pre-formatted — "1.2K plays". */
  plays: string | null;
  /** Pre-formatted position in the VOD — "1:42:07". */
  timestamp: string | null;
  thumbnail: ClipPickerImage | null;
  /** Curator's mark — "Streamer pick", "Chat favourite". Accent-tinted. */
  badge: string | null;
  /** The matched transcript line, pre-split. Null on a curated card. */
  quote: TranscriptSegment[] | null;
  send: ClipSendAction;
  /** Null when this surface offers no preview. */
  onPreview: (() => void) | null;
  previewAriaLabel: string | null;
};

/**
 * A row of clips the streamer put together.
 *
 * `featured` is a curator's mark — "start here" — not a look. A leaf may spend
 * more room on it or ignore it; what it may not do is invent its own ranking.
 */
export type ClipShelf = {
  id: string;
  label: string;
  hint: string | null;
  headingId: string;
  featured: boolean;
  items: ClipCard[];
};

/**
 * A search the streamer curated.
 *
 * The most important field in this file. It is how someone who cannot describe
 * what they want gets into search anyway: they tap "fish", not type it. Present
 * in `browse` as a warm start and in `empty` as the way out.
 */
export type SearchSuggestion = {
  id: string;
  label: string;
  /** Pre-formatted — "42 moments". Null when uncounted. */
  count: string | null;
  onPick: () => void;
};

/**
 * The search field. Controlled — the query is the container's, always.
 *
 * A leaf holding its own input state is the one thing that would end this tree:
 * two leaves would disagree about what was typed, and the lab could not freeze
 * a query as a fixture.
 */
export type ClipPickerSearch = {
  query: string;
  /** Accessible label — "Search what they said". */
  label: string;
  placeholder: string;
  /** Pre-formatted result count — "18 moments". Null outside `results`. */
  resultLabel: string | null;
  /** One line under the field. Pre-formatted. */
  hint: string | null;
  onQueryChange: (next: string) => void;
  /** Null when the field is already empty. */
  onClear: (() => void) | null;
  suggestions: SearchSuggestion[];
  suggestionsLabel: string;
};

/**
 * Where to search. The one filter a viewer actually reaches for, and the only
 * one this contract will ever carry — every additional axis is a decision the
 * curator should have made instead.
 */
export type ClipPickerScope = {
  value: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (next: string) => void;
};

export type ClipPickerVM = {
  state: ClipPickerState;

  /**
   * The settle after a query changes, normalized 0..1, monotonic. Results
   * arriving is a one-shot that repeats on every keystroke; the container drives
   * it, fixtures pin it.
   */
  progress: number;
  reducedMotion: boolean;
  density: ClipPickerDensity;
  /** Unique per instance — leaves stamp it so two pickers can share a page. */
  scopeId: string;

  /**
   * Why this screen exists. `title` is NOT nullable, for the same reason it is
   * not nullable on `chrome/pane-dock`: a surface that cannot state its job
   * cannot rank anything on it.
   */
  purpose: {
    title: string;
    subtitle: string | null;
    badge: string | null;
  };

  search: ClipPickerSearch;
  /** Null when the surface searches one place and has no choice to offer. */
  scope: ClipPickerScope | null;

  /** Surface-wide sentence. Null in the ordinary case. Rendered in every state. */
  notice: ClipPickerNotice | null;

  /** Rendered in `browse`. The streamer's curation. */
  shelves: ClipShelf[];
  /** Rendered in `results` / `searching`. Flat and already ranked. */
  results: ClipCard[];

  /** Pre-formatted, per state. A leaf never composes these. */
  emptyLabel: string;
  offlineLabel: string;
  loadingLabel: string;
  /** Placeholder rows to draw while `searching`. Pre-decided count. */
  skeletonCount: number;
};

/* ------------------------------------------------------------- helpers */
/* Pure. They run in the container and in fixtures — never inside a leaf.  */

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Resolve the state from what the container knows.
 *
 * Order matters and is the whole point: `offline` beats everything, an in-flight
 * query beats stale results, and **no query is `browse` even when there is
 * nothing to browse** — a viewer who has typed nothing has not failed at
 * anything, so they must never be shown a dead end.
 */
export function resolveClipPickerState(input: {
  loading: boolean;
  searching: boolean;
  query: string;
  shelfCount: number;
  resultCount: number;
  indexed: boolean;
}): ClipPickerState {
  if (input.loading) return "loading";
  if (!input.indexed && input.shelfCount === 0) return "offline";
  if (input.searching) return "searching";
  if (input.query.trim().length === 0) return "browse";
  return input.resultCount > 0 ? "results" : "empty";
}

/**
 * Split a transcript line into matched and unmatched runs.
 *
 * Case-insensitive, whole-query, every occurrence. It lives here — not in a
 * leaf and not in the container's fetch — so that all four leaves highlight
 * identically and so this is the one place a smarter matcher (accent folding,
 * stemming) would ever have to land.
 *
 * An empty or whitespace query yields one unmatched segment, which is why a
 * curated card can be given a quote without lighting up like a search hit.
 */
export function splitTranscript(line: string, query: string): TranscriptSegment[] {
  const needle = query.trim();
  if (needle.length === 0 || line.length === 0) {
    return line.length === 0 ? [] : [{ text: line, match: false }];
  }

  const segments: TranscriptSegment[] = [];
  const haystack = line.toLowerCase();
  const lowered = needle.toLowerCase();
  let cursor = 0;

  for (;;) {
    const at = haystack.indexOf(lowered, cursor);
    if (at === -1) break;
    if (at > cursor) segments.push({ text: line.slice(cursor, at), match: false });
    segments.push({ text: line.slice(at, at + needle.length), match: true });
    cursor = at + needle.length;
  }

  if (cursor < line.length) segments.push({ text: line.slice(cursor), match: false });
  return segments.length > 0 ? segments : [{ text: line, match: false }];
}

/** "18 moments" / "1 moment" / null when there is nothing to count. */
export function formatResultLabel(count: number, noun = "moment"): string | null {
  if (count <= 0) return null;
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** Seconds → "0:14" / "1:42:07". Runs in the container, never in a leaf. */
export function formatClipDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * The send action for one card, with the label and the null-ness kept in sync.
 *
 * Centralised because "the button says Sent but is still pressable" is the exact
 * bug a per-leaf `disabled` check produces, and it produces it four times.
 */
export function resolveSendAction(
  state: ClipSendState,
  options: {
    title: string;
    queueLabel?: string | null;
    hint?: string | null;
    onSend?: () => void;
    /**
     * Why it is blocked. A full queue is only the commonest reason — a paused
     * streamer is another, and a button reading "Queue full" when the queue is
     * empty is a lie the viewer can see through.
     */
    blocked?: { label: string; reason: string };
  },
): ClipSendAction {
  const blocked = options.blocked ?? { label: "Queue full", reason: "the queue is full" };

  const label =
    state === "sending"
      ? "Sending…"
      : state === "sent"
        ? (options.queueLabel ?? "Sent")
        : state === "blocked"
          ? blocked.label
          : "Send";

  const ariaLabel =
    state === "sending"
      ? `Sending ${options.title}`
      : state === "sent"
        ? `${options.title} sent`
        : state === "blocked"
          ? `Cannot send ${options.title} — ${blocked.reason}`
          : `Send ${options.title}`;

  return {
    state,
    label,
    ariaLabel,
    hint: options.hint ?? null,
    onSend: state === "ready" ? (options.onSend ?? null) : null,
  };
}

/* ------------------------------------------------- porting an existing panel */

/**
 * A *structural* view of a send panel that already exists in a consuming app.
 *
 * Deliberately shaped after yapdrop's `SendPanelVM`, and deliberately declared
 * here rather than imported: this repo never depends on the app it lifts from —
 * anything with these fields satisfies it. Every field is optional except the
 * two that carry meaning, so a partial or older panel still adapts.
 *
 * Only the fields `adaptSendPanel` actually reads are listed. That is the point
 * of a structural type: it is a statement about what the mapping needs, not a
 * copy of somebody else's file that has to be kept in sync.
 */
export type SendPanelVMLike = {
  /** Their lifecycle. `open` is the only one with anything to pick. */
  step: "no-streamer" | "loading" | "no-overlay" | "closed" | "open" | (string & {});
  header?: {
    name: string;
    connected: boolean;
    statusLine: string;
  } | null;
  /** What sending even is, for someone who has never seen the product. */
  blurb?: string | null;
  /** Why they cannot send, when they cannot. */
  closedMessage?: string | null;
  cold?: { summary: string; note: string } | null;
  /**
   * The streamer's shortlist. Note what this already is: a row that carries its
   * own `onSend`. The curated path in that product never had a selection step —
   * only the paste-a-URL path does. See the note in the README.
   */
  quickPicks?: {
    heading: string;
    hint: string;
    rows: Array<{
      listId: string;
      name: string;
      /** Already a sentence — "1 clip · 3s". Passed through untouched. */
      meta: string;
      playing: boolean;
      onPlay?: (() => void) | null;
      onSend: (() => void) | null;
    }>;
  } | null;
  chargeNote?: string | null;
};

/**
 * Lift an existing send panel into this tree's contract, in one pure call.
 *
 * The mapping is small because the two contracts already agree about most of
 * it; where they disagree, this function is where the disagreement is written
 * down rather than argued about:
 *
 * - **`step` → `state`, decided by what there is to SHOW, not by whether you
 *   can send.** This is the correction to the first version of this function,
 *   which mapped every un-sendable step onto `offline` and so deleted the
 *   shortlist exactly when it mattered most. That contradicted the source
 *   product's own note — *the picks still show, they are the reason to come
 *   back*. Now: rows to show → `browse` with a `blocked` notice and every card
 *   blocked; nothing to show → `offline`.
 * - **`quickPicks` → one featured shelf.** A shortlist IS a curated shelf; the
 *   heading and hint map straight across, and `featured` is set because a
 *   product that curated exactly one list meant it.
 * - **`onSend: null` → `blocked`.** Their row already nulls the callback when
 *   there is nothing to send to, which is the same convention
 *   `resolveSendAction` enforces — so the label and the disabled-ness cannot
 *   drift apart on the way in.
 * - **Search is supplied by the caller.** This tree assumes a transcript index;
 *   a panel that has none passes nothing and gets a field with no suggestions,
 *   which renders honestly as "search exists, nobody has indexed anything".
 *
 * What it deliberately does NOT map: the selected clip. There is no field for
 * it in `ClipPickerVM`, so a panel adapted through here renders its shortlist
 * with Send on the row and no chooser step at all. That is the whole argument,
 * made as a picture instead of a paragraph.
 */
export function adaptSendPanel(
  panel: SendPanelVMLike,
  extras: {
    scopeId?: string;
    progress?: number;
    reducedMotion?: boolean;
    density?: ClipPickerDensity;
    /** Wire a real index in; omit for a panel that has none yet. */
    search?: Partial<ClipPickerSearch>;
    scope?: ClipPickerScope | null;
    /** Extra shelves beyond their one shortlist. */
    shelves?: ClipShelf[];
    results?: ClipCard[];
  } = {},
): ClipPickerVM {
  /* Can the viewer act? Separate question from: is there anything to look at. */
  const sendable = panel.step === "open";
  const rowCount = panel.quickPicks?.rows.length ?? 0;
  const hasSomethingToShow = rowCount + (extras.shelves?.length ?? 0) > 0;

  const state: ClipPickerState =
    panel.step === "loading"
      ? "loading"
      : sendable || hasSomethingToShow
        ? "browse"
        : "offline";

  const blockedMessage =
    panel.closedMessage ??
    panel.cold?.note ??
    "Sending is switched off right now — these are still here when it comes back.";

  const quickShelf: ClipShelf[] = panel.quickPicks
    ? [
        {
          id: "quick-picks",
          label: panel.quickPicks.heading,
          hint: panel.quickPicks.hint,
          headingId: `${extras.scopeId ?? "clip-picker"}-shelf-quick-picks`,
          featured: true,
          items: panel.quickPicks.rows.map((row) => ({
            id: row.listId,
            title: row.name,
            creatorLabel: null,
            // Their `meta` is already "1 clip · 3s" — a pre-formatted sentence,
            // which is exactly what this contract wants and why it passes
            // through rather than being parsed apart and rebuilt.
            duration: row.meta,
            age: null,
            plays: null,
            timestamp: null,
            thumbnail: null,
            badge: row.playing ? "Playing" : null,
            quote: null,
            // Two independent ways to be un-sendable: the row said so, or the
            // whole panel is shut. Either one blocks; only the second explains
            // itself in the banner, so the button carries the shorter reason.
            send: resolveSendAction(sendable && row.onSend ? "ready" : "blocked", {
              title: row.name,
              hint: sendable ? (panel.chargeNote ?? null) : null,
              onSend: row.onSend ?? undefined,
              blocked: sendable
                ? undefined
                : { label: "Paused", reason: "sending is switched off right now" },
            }),
            onPreview: row.onPlay ?? null,
            previewAriaLabel: row.onPlay ? `Preview ${row.name}` : null,
          })),
        },
      ]
    : [];

  return {
    state,
    progress: clampProgress(extras.progress ?? 1),
    reducedMotion: extras.reducedMotion ?? false,
    density: extras.density ?? "wide",
    scopeId: extras.scopeId ?? "clip-picker",
    purpose: {
      // Non-nullable by contract, so the fallback is a real sentence rather
      // than an empty string that would silently un-rank the whole screen.
      title: panel.header ? `Send a clip to ${panel.header.name}` : "Send a clip",
      subtitle: panel.blurb ?? panel.cold?.summary ?? null,
      badge: panel.header?.connected ? panel.header.statusLine : null,
    },
    search: {
      query: "",
      label: "Search what they said",
      placeholder: "Search what they said…",
      resultLabel: null,
      hint: null,
      onQueryChange: () => {},
      onClear: null,
      suggestions: [],
      suggestionsLabel: "Or start here",
      ...extras.search,
    },
    scope: extras.scope ?? null,
    notice: sendable || panel.step === "loading" ? null : { message: blockedMessage, tone: "blocked" },
    shelves: [...quickShelf, ...(extras.shelves ?? [])],
    results: extras.results ?? [],
    emptyLabel: "Nothing matched that.",
    // Reached only when there is genuinely nothing to show. When there IS
    // something, the same sentence arrives as the notice instead.
    offlineLabel:
      panel.closedMessage ??
      panel.cold?.note ??
      "Nothing to send yet — this channel has no clips indexed.",
    loadingLabel: "Loading clips…",
    skeletonCount: 3,
  };
}

/** A picker with nothing in it. Used by fixtures and as a container fallback. */
export const CLIP_PICKER_EMPTY: ClipPickerVM = {
  state: "offline",
  progress: 1,
  reducedMotion: false,
  density: "wide",
  scopeId: "clip-picker-empty",
  purpose: { title: "Send a clip", subtitle: null, badge: null },
  search: {
    query: "",
    label: "Search what they said",
    placeholder: "Search what they said…",
    resultLabel: null,
    hint: null,
    onQueryChange: () => {},
    onClear: null,
    suggestions: [],
    suggestionsLabel: "Try one of these",
  },
  scope: null,
  notice: null,
  shelves: [],
  results: [],
  emptyLabel: "No moments matched that.",
  offlineLabel: "Nothing to send yet — this channel has no clips indexed.",
  loadingLabel: "Loading clips…",
  skeletonCount: 3,
};
