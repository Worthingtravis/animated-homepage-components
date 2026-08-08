/**
 * The contract's pure helpers.
 *
 * These exist as a unit test and not only inside the conformance suite because
 * they are the part of this tree meant to be *lifted* — copied into a consuming
 * app that has its own send panel and no interest in this repo's leaves. A
 * function is only free to steal if its edges are pinned; these are the edges.
 */

import { describe, expect, it, vi } from "vitest";

import {
  adaptSendPanel,
  clampProgress,
  formatClipDuration,
  formatResultLabel,
  resolveClipPickerState,
  resolveSendAction,
  splitTranscript,
} from "./clip-picker.vm";

const flat = (line: string, query: string) =>
  splitTranscript(line, query)
    .map((segment) => segment.text)
    .join("");

describe("splitTranscript", () => {
  it("never loses or invents a character, whatever the query", () => {
    // The invariant that matters most: a leaf renders the segments and nothing
    // else, so anything this drops is text the viewer will never see again.
    const line = "no — no, the fish is not supposed to do that";
    for (const query of ["", " ", "fish", "FISH", "no", "z", line, "  fish  "]) {
      expect(flat(line, query), `query: ${JSON.stringify(query)}`).toBe(line);
    }
  });

  it("marks every occurrence, not just the first", () => {
    const segments = splitTranscript("fish fish fish", "fish");
    expect(segments.filter((segment) => segment.match)).toHaveLength(3);
  });

  it("matches case-insensitively but preserves the original casing", () => {
    const segments = splitTranscript("The FISH swam", "fish");
    const matched = segments.find((segment) => segment.match);
    expect(matched?.text).toBe("FISH");
  });

  it("treats an empty or whitespace query as no match at all", () => {
    // This is why a curated card can carry a quote without lighting up like a
    // search hit — `browse` has no query and must not look like `results`.
    for (const query of ["", "   ", "\n"]) {
      const segments = splitTranscript("the fish", query);
      expect(segments.some((segment) => segment.match)).toBe(false);
    }
  });

  it("trims the query, so a trailing space does not silently kill the match", () => {
    expect(splitTranscript("the fish", "fish ").some((segment) => segment.match)).toBe(true);
  });

  it("returns one unmatched run when nothing matches", () => {
    expect(splitTranscript("the fish", "hexadecimal")).toEqual([
      { text: "the fish", match: false },
    ]);
  });

  it("returns an empty list for an empty line rather than an empty segment", () => {
    expect(splitTranscript("", "fish")).toEqual([]);
    expect(splitTranscript("", "")).toEqual([]);
  });

  it("handles a query longer than the line", () => {
    expect(splitTranscript("fish", "fish and chips")).toEqual([{ text: "fish", match: false }]);
  });

  it("matches a run at the very start and the very end without emitting empties", () => {
    // An empty leading or trailing segment renders as nothing but still costs a
    // DOM node and an array key — and it is the classic off-by-one here.
    for (const segments of [splitTranscript("fish tank", "fish"), splitTranscript("tank fish", "fish")]) {
      expect(segments).toHaveLength(2);
      expect(segments.every((segment) => segment.text.length > 0)).toBe(true);
    }
  });

  it("does not overlap runs on a self-repeating query", () => {
    // "aa" in "aaaa" is two matches, not three — an overlapping scan would
    // duplicate text, which the first test would then catch as corruption.
    const segments = splitTranscript("aaaa", "aa");
    expect(segments).toEqual([
      { text: "aa", match: true },
      { text: "aa", match: true },
    ]);
  });

  it("survives regex metacharacters, because it never builds a regex", () => {
    const segments = splitTranscript("what (the) hell", "(the)");
    expect(segments.find((segment) => segment.match)?.text).toBe("(the)");
  });
});

describe("resolveClipPickerState", () => {
  const base = {
    loading: false,
    searching: false,
    query: "",
    shelfCount: 3,
    resultCount: 0,
    indexed: true,
  };

  it("shows `browse` for an empty query even with nothing to show", () => {
    // The rule this tree exists to protect: someone who has typed nothing has
    // not failed at anything, so they must never see the dead end.
    expect(resolveClipPickerState({ ...base, shelfCount: 0, resultCount: 0 })).toBe("browse");
  });

  it("separates `empty` from `browse` by the query, never by the count", () => {
    expect(resolveClipPickerState({ ...base, query: "  " })).toBe("browse");
    expect(resolveClipPickerState({ ...base, query: "fish" })).toBe("empty");
  });

  it("prefers `results` once anything matched", () => {
    expect(resolveClipPickerState({ ...base, query: "fish", resultCount: 3 })).toBe("results");
  });

  it("lets an in-flight query beat stale results", () => {
    expect(
      resolveClipPickerState({ ...base, searching: true, query: "fish", resultCount: 9 }),
    ).toBe("searching");
  });

  it("puts `loading` above everything", () => {
    expect(
      resolveClipPickerState({ ...base, loading: true, searching: true, query: "fish" }),
    ).toBe("loading");
  });

  it("only goes `offline` when there is nothing to browse AND nothing indexed", () => {
    expect(resolveClipPickerState({ ...base, indexed: false, shelfCount: 0 })).toBe("offline");
    // Shelves without an index is a real product state — a streamer who curated
    // lists before the transcripts finished. It is browsable, so it browses.
    expect(resolveClipPickerState({ ...base, indexed: false, shelfCount: 2 })).toBe("browse");
  });
});

describe("resolveSendAction", () => {
  it("nulls the callback exactly when the label stops being an offer", () => {
    // The bug this function exists to make unwritable: "says Sent but is still
    // pressable", once per leaf.
    const onSend = vi.fn();
    for (const state of ["sending", "sent", "blocked"] as const) {
      expect(resolveSendAction(state, { title: "Clip", onSend }).onSend).toBeNull();
    }
    expect(resolveSendAction("ready", { title: "Clip", onSend }).onSend).toBe(onSend);
  });

  it("names the clip in every accessible label", () => {
    for (const state of ["ready", "sending", "sent", "blocked"] as const) {
      expect(resolveSendAction(state, { title: "The fish incident" }).ariaLabel).toContain(
        "The fish incident",
      );
    }
  });

  it("lets the caller replace the sent label with a queue position", () => {
    const action = resolveSendAction("sent", { title: "Clip", queueLabel: "Sent · 3rd in queue" });
    expect(action.label).toBe("Sent · 3rd in queue");
  });

  it("ignores queueLabel in states that are not `sent`", () => {
    expect(resolveSendAction("ready", { title: "Clip", queueLabel: "Sent" }).label).toBe("Send");
  });

  it("keeps a missing callback null rather than undefined", () => {
    expect(resolveSendAction("ready", { title: "Clip" }).onSend).toBeNull();
  });

  it("defaults `blocked` to a full queue but lets the caller name another reason", () => {
    // "Queue full" on a paused streamer is a lie the viewer can check.
    expect(resolveSendAction("blocked", { title: "Clip" }).label).toBe("Queue full");

    const paused = resolveSendAction("blocked", {
      title: "Clip",
      blocked: { label: "Paused", reason: "sending is switched off right now" },
    });
    expect(paused.label).toBe("Paused");
    expect(paused.ariaLabel).toBe("Cannot send Clip — sending is switched off right now");
    expect(paused.onSend).toBeNull();
  });
});

describe("formatting helpers", () => {
  it("formats durations without an hour segment until there is one", () => {
    expect(formatClipDuration(14)).toBe("0:14");
    expect(formatClipDuration(64)).toBe("1:04");
    expect(formatClipDuration(3600)).toBe("1:00:00");
    expect(formatClipDuration(6127)).toBe("1:42:07");
  });

  it("clamps nonsense durations instead of rendering a minus sign", () => {
    expect(formatClipDuration(-5)).toBe("0:00");
    expect(formatClipDuration(0.9)).toBe("0:00");
  });

  it("pluralises the result count and returns null for nothing", () => {
    expect(formatResultLabel(1)).toBe("1 moment");
    expect(formatResultLabel(18)).toBe("18 moments");
    expect(formatResultLabel(0)).toBeNull();
    expect(formatResultLabel(-3)).toBeNull();
  });

  it("clamps progress, including NaN", () => {
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(2)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(0.5)).toBe(0.5);
  });
});

describe("adaptSendPanel", () => {
  const panel = {
    step: "open" as const,
    header: { name: "jagerzgoober", connected: true, statusLine: "Overlay connected" },
    blurb: "It plays on their stream.",
    quickPicks: {
      heading: "Shortlist",
      hint: "Curated by them.",
      rows: [
        { listId: "a", name: "Fails", meta: "6 clips · 48s", playing: false, onSend: () => {} },
        { listId: "b", name: "Nurse", meta: "4 clips · 31s", playing: true, onSend: null },
      ],
    },
  };

  it("turns a shortlist into one featured shelf without reformatting its copy", () => {
    const vm = adaptSendPanel(panel);
    expect(vm.shelves).toHaveLength(1);
    expect(vm.shelves[0].featured).toBe(true);
    expect(vm.shelves[0].label).toBe("Shortlist");
    // Their sentence, passed through — not parsed apart and rebuilt.
    expect(vm.shelves[0].items[0].duration).toBe("6 clips · 48s");
  });

  it("carries a null row callback straight through to `blocked`", () => {
    const vm = adaptSendPanel(panel);
    expect(vm.shelves[0].items[0].send.state).toBe("ready");
    expect(vm.shelves[0].items[1].send.state).toBe("blocked");
    expect(vm.shelves[0].items[1].send.onSend).toBeNull();
  });

  /*
   * The regression this block exists for. The first version of `adaptSendPanel`
   * mapped every un-sendable step onto `offline`, and every leaf renders
   * `offline` as one sentence with the shelves gone — so a paused streamer's
   * shortlist was deleted at exactly the moment it is the reason to come back
   * later. State is about what there is to SHOW; permission is a notice.
   */
  it("keeps the shortlist up when sending is off", () => {
    for (const step of ["no-overlay", "closed", "no-streamer"] as const) {
      const vm = adaptSendPanel({ ...panel, step });
      expect(vm.state, step).toBe("browse");
      expect(vm.shelves[0].items, step).toHaveLength(2);
    }
  });

  it("blocks every row while it is up, including rows that were sendable", () => {
    const vm = adaptSendPanel({ ...panel, step: "closed" });
    expect(vm.shelves[0].items.every((item) => item.send.state === "blocked")).toBe(true);
    expect(vm.shelves[0].items.every((item) => item.send.onSend === null)).toBe(true);
    // Not "Queue full" — the queue is fine, the door is shut.
    expect(vm.shelves[0].items[0].send.label).toBe("Paused");
  });

  it("only reaches `offline` when there is genuinely nothing to show", () => {
    expect(adaptSendPanel({ step: "closed" }).state).toBe("offline");
    expect(adaptSendPanel({ step: "closed", quickPicks: { heading: "h", hint: "", rows: [] } }).state).toBe(
      "offline",
    );
    expect(adaptSendPanel({ ...panel, step: "loading" }).state).toBe("loading");
    expect(adaptSendPanel({ ...panel, step: "open" }).state).toBe("browse");
  });

  it("carries their sentence as the notice, and as the dead end when there is one", () => {
    const shown = adaptSendPanel({ ...panel, step: "closed", closedMessage: "Drops are paused." });
    expect(shown.notice).toEqual({ message: "Drops are paused.", tone: "blocked" });

    // Nothing to show at all — the same sentence, now the whole screen.
    const bare = adaptSendPanel({ step: "closed", closedMessage: "Drops are paused." });
    expect(bare.offlineLabel).toBe("Drops are paused.");
  });

  it("carries no notice when the panel is open or still loading", () => {
    expect(adaptSendPanel({ ...panel, step: "open" }).notice).toBeNull();
    expect(adaptSendPanel({ ...panel, step: "loading" }).notice).toBeNull();
  });

  it("always produces a purpose title, even with no header at all", () => {
    // Non-nullable by contract — an empty string here would silently un-rank
    // every leaf on the tree.
    expect(adaptSendPanel({ step: "open" }).purpose.title.length).toBeGreaterThan(0);
  });

  it("produces no selected-clip field, because there is nowhere to put one", () => {
    const vm = adaptSendPanel(panel);
    expect(Object.keys(vm)).not.toContain("selected");
  });
});
