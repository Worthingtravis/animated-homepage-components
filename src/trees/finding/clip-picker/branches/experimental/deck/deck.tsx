/**
 * Deck — a leaf on Clip Picker / Experimental.
 *
 * PURE PRESENTATION. Its props ARE ClipPickerVM.
 *
 * Structural answer: **one clip at a time, the whole width, swipe for the next.**
 *
 * Canon asks "which of these?". This asks "this one?" — and that is a different
 * question with a different failure mode. A grid makes a visitor compare, and
 * comparing is work; a deck makes them judge one thing, which is nearly free.
 * For someone who arrived from a Twitch panel with no intention of staying,
 * "yes/next" beats "choose" almost every time.
 *
 * ── How it pages without owning state ──────────────────────────────────────
 * It does not. There is no current-index here, no `useState`, no hook. Each
 * card is `w-full shrink-0` inside a `snap-x snap-mandatory` scroller, so the
 * position lives in the DOM's scroll offset where the browser already keeps it,
 * and swipe / trackpad / shift-scroll / keyboard all work for free. That is the
 * whole trick, and it is why a deck is possible on a tree whose leaves may not
 * hold state.
 *
 * ── The cost, named ────────────────────────────────────────────────────────
 * You cannot compare two clips, and you cannot see how many are left. This is
 * the wrong leaf for a regular hunting a specific moment and the right one for
 * a stranger who will bounce. It is `experimental` because that bet is real and
 * it is a bet — the ordering below is the curator's, so a bad first card costs
 * more here than anywhere else on this tree.
 *
 * ── Ordering ───────────────────────────────────────────────────────────────
 * Featured shelves first, then the rest, flattened. `featured` is a curator's
 * mark and this leaf spends it on the one thing that matters here: what you see
 * before you decide whether to keep going.
 *
 * Theming: Send is a full-width primary fill, the position dots and the matched
 * transcript run are accent, focus rings are `--ring`.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type {
  ClipCard,
  ClipPickerNotice,
  ClipPickerVM,
  SearchSuggestion,
  TranscriptSegment,
} from "../../../clip-picker.vm";

export const meta: LeafMeta = {
  label: "Deck",
  description:
    "One clip at a time, full width, swipe for the next — judging instead of comparing. Pages on native scroll-snap, so it holds no state at all.",
  sizeHint: "lg",
  tags: ["deck", "swipe", "one-at-a-time", "mobile", "low-commitment"],
};

function Quote({ segments }: { segments: TranscriptSegment[] }) {
  return (
    <p className="text-pretty text-base leading-relaxed text-muted-foreground">
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className="rounded bg-accent px-1 font-semibold text-accent-foreground">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

function DeckCard({ card }: { card: ClipCard }) {
  const { send } = card;
  return (
    <li className="flex w-full shrink-0 snap-center flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      {card.thumbnail ? (
        <div className="relative overflow-hidden rounded-xl">
          <Image
            src={card.thumbnail.src}
            alt={card.thumbnail.alt}
            width={card.thumbnail.width}
            height={card.thumbnail.height}
            className="h-auto w-full object-cover"
          />
          <span className="absolute bottom-2 right-2 rounded bg-background/85 px-2 py-0.5 text-xs font-medium text-foreground">
            {card.duration}
          </span>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
          {card.duration}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h4 className="text-balance text-lg font-semibold text-foreground">{card.title}</h4>
          {card.badge ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {card.badge}
            </span>
          ) : null}
        </div>

        {card.quote ? <Quote segments={card.quote} /> : null}

        <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {card.timestamp ? <span>at {card.timestamp}</span> : null}
          {card.age ? <span>{card.age}</span> : null}
          {card.plays ? <span>{card.plays}</span> : null}
          {card.creatorLabel ? <span>{card.creatorLabel}</span> : null}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <button
          type="button"
          onClick={send.onSend ?? undefined}
          disabled={send.onSend === null}
          aria-label={send.ariaLabel}
          data-send-state={send.state}
          className={cn(
            "min-h-12 w-full rounded-xl text-base font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            send.state === "ready" && "bg-primary text-primary-foreground hover:bg-primary/90",
            send.state === "sending" && "bg-primary/70 text-primary-foreground",
            send.state === "sent" && "border border-primary/40 bg-primary/10 text-primary",
            send.state === "blocked" && "border border-border bg-muted text-muted-foreground",
          )}
        >
          {send.label}
        </button>
        {send.hint ? (
          <p className="text-center text-xs text-muted-foreground">{send.hint}</p>
        ) : null}
      </div>
    </li>
  );
}

function Suggestions({ label, suggestions }: { label: string; suggestions: SearchSuggestion[] }) {
  if (suggestions.length === 0) return null;
  return (
    <section aria-label={label} className="flex flex-wrap items-center gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          onClick={suggestion.onPick}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 text-sm text-foreground hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {suggestion.label}
          {suggestion.count ? (
            <span className="text-xs text-muted-foreground">{suggestion.count}</span>
          ) : null}
        </button>
      ))}
    </section>
  );
}

/**
 * The surface-wide sentence — most often "sending is paused right now".
 *
 * It exists so that state and permission stay separate: the shelves below are
 * still worth looking at when this is showing, which is the entire reason this
 * is a banner and not an `offline` screen with the picks deleted.
 */
function Notice({ notice }: { notice: ClipPickerNotice }) {
  return (
    <p
      data-notice={notice.tone}
      role={notice.tone === "blocked" ? "status" : undefined}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        notice.tone === "blocked"
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-transparent bg-accent text-accent-foreground",
      )}
    >
      {notice.message}
    </p>
  );
}

export function ClipPickerDeck(vm: ClipPickerVM) {
  const settle = vm.reducedMotion
    ? undefined
    : { opacity: 0.5 + 0.5 * vm.progress, transform: `scale(${0.98 + 0.02 * vm.progress})` };

  /*
   * Curator order, flattened. Featured first — see the header. This is reading
   * a mark the container set, not inventing a ranking.
   *
   * `empty` deliberately gets NO deck. Paging the curated shelves under
   * "nothing matched" reads as results for the query that just failed, and a
   * deck gives no other signal that it changed subject. The suggestions are the
   * way out of that state; a silent pile of unrelated clips is not.
   */
  /*
   * Flattening is what makes the key a problem here and nowhere else. The three
   * canon leaves render a card inside its shelf's `<section>`, so `card.id` is
   * only ever compared against its own shelf's siblings. A deck deliberately
   * throws that scope away — and a clip genuinely belongs in more than one
   * shelf ("From this week" AND "Just chatting" are both true of the same
   * clip), so `card.id` stops being unique the moment the curator does the
   * normal thing. The shelf it was pulled from is what makes it unique again.
   */
  const deck: Array<{ key: string; card: ClipCard }> =
    vm.state === "results" || vm.state === "searching"
      ? vm.results.map((card) => ({ key: `result:${card.id}`, card }))
      : vm.state === "browse"
        ? [...vm.shelves]
            .sort((a, b) => Number(b.featured) - Number(a.featured))
            .flatMap((shelf) =>
              shelf.items.map((card) => ({ key: `${shelf.id}:${card.id}`, card })),
            )
        : [];

  return (
    <section
      data-clip-picker={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="@container mx-auto flex w-full max-w-xl flex-col gap-5 rounded-2xl border border-border bg-background p-4"
    >
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-balance text-xl font-semibold text-foreground">
            {vm.purpose.title}
          </h2>
          {vm.purpose.badge ? (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {vm.purpose.badge}
            </span>
          ) : null}
        </div>
        {vm.purpose.subtitle ? (
          <p className="text-sm text-muted-foreground">{vm.purpose.subtitle}</p>
        ) : null}
      </header>

      {vm.notice ? <Notice notice={vm.notice} /> : null}

      {vm.state === "offline" ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {vm.offlineLabel}
        </p>
      ) : (
        <>
          {/* Search is deliberately secondary here — the deck is the offer. */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
            <span aria-hidden className="text-muted-foreground">
              ⌕
            </span>
            <input
              type="search"
              value={vm.search.query}
              onChange={(event) => vm.search.onQueryChange(event.target.value)}
              aria-label={vm.search.label}
              placeholder={vm.search.placeholder}
              className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {vm.search.onClear ? (
              <button
                type="button"
                onClick={vm.search.onClear}
                aria-label="Clear the search"
                className="inline-flex min-h-11 shrink-0 items-center self-stretch rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ✕
              </button>
            ) : null}
          </div>

          {vm.state === "loading" ? (
            <p className="text-sm text-muted-foreground">{vm.loadingLabel}</p>
          ) : null}

          {vm.state === "empty" ? (
            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border p-6">
              <p className="text-sm text-foreground">{vm.emptyLabel}</p>
              <Suggestions
                label={vm.search.suggestionsLabel}
                suggestions={vm.search.suggestions}
              />
            </div>
          ) : null}

          {deck.length > 0 ? (
            <>
              {/*
                The pager. Position lives in scroll offset, not in this
                component — the entire reason a stateless deck is possible.
              */}
              <ul
                data-deck=""
                aria-label="Clips, one at a time"
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
                style={settle}
              >
                {deck.map(({ key, card }) => (
                  <DeckCard key={key} card={card} />
                ))}
              </ul>
              <p className="text-center text-xs text-muted-foreground">
                {/* Pre-formatted count would be a VM field; this is a static
                    affordance, not a value. */}
                Swipe for the next one
              </p>
            </>
          ) : null}

          {vm.state === "browse" ? (
            <Suggestions label={vm.search.suggestionsLabel} suggestions={vm.search.suggestions} />
          ) : null}
        </>
      )}
    </section>
  );
}

export default ClipPickerDeck;
