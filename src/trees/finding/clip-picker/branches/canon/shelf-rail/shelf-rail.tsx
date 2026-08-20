/**
 * Shelf Rail — a leaf on Clip Picker / Canon.
 *
 * PURE PRESENTATION. Its props ARE ClipPickerVM.
 *
 * Structural answer: **shelves as horizontal rails, the way a viewer already
 * reads a streaming service.**
 *
 * Same order as `one-column` — purpose, search, suggestions, shelves — but each
 * shelf scrolls sideways instead of stacking. That buys the thing a phone
 * cannot have: several shelves visible at once, so "jagerzgoober's picks" and
 * "from this week" are a glance apart rather than a scroll apart.
 *
 * ── The cost, named ────────────────────────────────────────────────────────
 * Horizontal scroll hides content off the right edge, and nothing on screen
 * says how much. That is a genuine loss and it is the reason this is not the
 * default: on a phone it becomes a row of two-and-a-half cards and a swipe
 * nobody discovers. It earns its place on a desktop, where a rail is the
 * grammar every viewer already knows from every video service they use.
 *
 * ── Where it deliberately breaks the pattern ───────────────────────────────
 * Search results do NOT become a rail. A result set is ranked, and a ranked
 * list that scrolls sideways buries its own best answer. Results stay a
 * vertical list — the layout switches with the state, which is exactly what
 * `vm.state` is for.
 *
 * Theming: Send is `bg-primary` + `text-primary-foreground`, badges and the
 * transcript highlight are accent, focus rings are `--ring`.
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
  label: "Shelf Rail",
  description:
    "Desktop-first: every curated shelf is a horizontal rail, so several shelves are a glance apart. Search results break the pattern and stay a ranked vertical list.",
  sizeHint: "lg",
  tags: ["desktop", "rails", "shelves", "browse", "familiar"],
};

function Quote({ segments }: { segments: TranscriptSegment[] }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {segments.map((segment, index) =>
        segment.match ? (
          <mark key={index} className="rounded bg-accent px-0.5 font-medium text-accent-foreground">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

function SendButton({ card, block }: { card: ClipCard; block?: boolean }) {
  const { send } = card;
  return (
    <button
      type="button"
      onClick={send.onSend ?? undefined}
      disabled={send.onSend === null}
      aria-label={send.ariaLabel}
      data-send-state={send.state}
      className={cn(
        "min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors",
        block && "w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        send.state === "ready" && "bg-primary text-primary-foreground hover:bg-primary/90",
        send.state === "sending" && "bg-primary/70 text-primary-foreground",
        send.state === "sent" && "border border-primary/40 bg-primary/10 text-primary",
        send.state === "blocked" && "border border-border bg-muted text-muted-foreground",
      )}
    >
      {send.label}
    </button>
  );
}

/** A rail card: fixed width so the rail has a rhythm, and self-contained. */
function RailCard({ card }: { card: ClipCard }) {
  return (
    <li className="flex w-56 shrink-0 snap-start flex-col gap-2 rounded-xl border border-border bg-card p-2">
      {card.thumbnail ? (
        <div className="relative overflow-hidden rounded-lg">
          <Image
            src={card.thumbnail.src}
            alt={card.thumbnail.alt}
            width={card.thumbnail.width}
            height={card.thumbnail.height}
            className="h-auto w-full object-cover"
          />
          <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1.5 py-0.5 text-[0.6875rem] font-medium text-foreground">
            {card.duration}
          </span>
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
          {card.duration}
        </div>
      )}

      <div className="flex min-h-10 flex-col gap-1">
        <h4 className="line-clamp-2 text-sm font-medium text-foreground">{card.title}</h4>
        {card.badge ? (
          <span className="w-fit rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">
            {card.badge}
          </span>
        ) : null}
        <p className="flex flex-wrap gap-x-2 text-[0.6875rem] text-muted-foreground">
          {card.age ? <span>{card.age}</span> : null}
          {card.plays ? <span>{card.plays}</span> : null}
        </p>
      </div>

      <SendButton card={card} block />
      {card.send.hint ? (
        <p className="text-center text-[0.6875rem] leading-tight text-muted-foreground">
          {card.send.hint}
        </p>
      ) : null}
    </li>
  );
}

/** A result row: wide, ranked, quote-forward. Deliberately not a rail card. */
function ResultRow({ card }: { card: ClipCard }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 @2xl:flex-row @2xl:items-center">
      {card.thumbnail ? (
        <div className="relative shrink-0 overflow-hidden rounded-lg @2xl:w-44">
          <Image
            src={card.thumbnail.src}
            alt={card.thumbnail.alt}
            width={card.thumbnail.width}
            height={card.thumbnail.height}
            className="h-auto w-full object-cover"
          />
          <span className="absolute bottom-1 right-1 rounded bg-background/85 px-1.5 py-0.5 text-[0.6875rem] font-medium text-foreground">
            {card.duration}
          </span>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
          {card.timestamp ? (
            <span className="text-xs text-muted-foreground">at {card.timestamp}</span>
          ) : null}
          {card.badge ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">
              {card.badge}
            </span>
          ) : null}
        </div>
        {card.quote ? <Quote segments={card.quote} /> : null}
        <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {card.thumbnail ? null : <span>{card.duration}</span>}
          {card.age ? <span>{card.age}</span> : null}
          {card.plays ? <span>{card.plays}</span> : null}
          {card.creatorLabel ? <span>{card.creatorLabel}</span> : null}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-1 @2xl:w-36">
        <SendButton card={card} block />
        {card.send.hint ? (
          <span className="text-center text-[0.6875rem] leading-tight text-muted-foreground">
            {card.send.hint}
          </span>
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
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 text-sm text-foreground hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

function Skeletons({ count }: { count: number }) {
  return (
    <ul aria-hidden className="flex gap-3 overflow-hidden">
      {Array.from({ length: Math.max(count, 4) }, (_, index) => (
        <li key={index} className="flex w-56 shrink-0 flex-col gap-2 rounded-xl border border-border bg-card p-2">
          <div className="h-28 w-full rounded-lg bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-9 w-full rounded-lg bg-muted/70" />
        </li>
      ))}
    </ul>
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

export function ClipPickerShelfRail(vm: ClipPickerVM) {
  const settle = vm.reducedMotion
    ? undefined
    : { opacity: 0.4 + 0.6 * vm.progress, transform: `translateY(${(1 - vm.progress) * 8}px)` };

  return (
    <section
      data-clip-picker={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="@container flex w-full flex-col gap-6 rounded-2xl border border-border bg-background p-4"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-balance text-2xl font-semibold text-foreground">
              {vm.purpose.title}
            </h2>
            {vm.purpose.badge ? (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {vm.purpose.badge}
              </span>
            ) : null}
          </div>
          {vm.purpose.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{vm.purpose.subtitle}</p>
          ) : null}
        </div>

        {vm.state === "offline" ? null : (
          <div className="flex min-w-64 flex-1 justify-end gap-2">
            <div className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
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
                  className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  ✕
                </button>
              ) : null}
            </div>
            {vm.scope ? (
              <label>
                <span className="sr-only">{vm.scope.label}</span>
                <select
                  value={vm.scope.value}
                  onChange={(event) => vm.scope?.onChange(event.target.value)}
                  className="min-h-10 rounded-xl border border-border bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {vm.scope.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        )}
      </header>

      {vm.notice ? <Notice notice={vm.notice} /> : null}

      {vm.search.resultLabel || vm.search.hint ? (
        <p className="-mt-3 text-xs text-muted-foreground">
          {vm.search.resultLabel ?? vm.search.hint}
        </p>
      ) : null}

      {vm.state === "loading" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{vm.loadingLabel}</p>
          <Skeletons count={vm.skeletonCount} />
        </div>
      ) : null}

      {vm.state === "offline" ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {vm.offlineLabel}
        </p>
      ) : null}

      {vm.state === "browse" ? (
        <div className="flex flex-col gap-8" style={settle}>
          <Suggestions label={vm.search.suggestionsLabel} suggestions={vm.search.suggestions} />
          {vm.shelves.map((shelf) => (
            <section key={shelf.id} aria-labelledby={shelf.headingId} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3
                  id={shelf.headingId}
                  className={cn(
                    "font-semibold text-foreground",
                    shelf.featured ? "text-lg" : "text-sm",
                  )}
                >
                  {shelf.label}
                </h3>
                {shelf.hint ? <p className="text-xs text-muted-foreground">{shelf.hint}</p> : null}
              </div>
              {/*
                `overflow-x-auto` on the rail itself, never on the page. Snap
                points give the swipe a resting place so a half-card is not the
                normal state.
              */}
              <ul
                data-rail=""
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
              >
                {shelf.items.map((card) => (
                  <RailCard key={card.id} card={card} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {vm.state === "searching" ? <Skeletons count={vm.skeletonCount} /> : null}

      {/* Ranked, so vertical. See the header. */}
      {vm.state === "results" ? (
        <ul className="flex flex-col gap-3" style={settle}>
          {vm.results.map((card) => (
            <ResultRow key={card.id} card={card} />
          ))}
        </ul>
      ) : null}

      {vm.state === "empty" ? (
        <div className="flex flex-col gap-5 rounded-xl border border-dashed border-border p-6">
          <p className="text-sm text-foreground">{vm.emptyLabel}</p>
          <Suggestions label={vm.search.suggestionsLabel} suggestions={vm.search.suggestions} />
        </div>
      ) : null}
    </section>
  );
}

export default ClipPickerShelfRail;
