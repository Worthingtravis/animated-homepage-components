/**
 * One Column — a leaf on Clip Picker / Canon.
 *
 * PURE PRESENTATION. Its props ARE ClipPickerVM.
 *
 * Structural answer: **one column, thumb-reachable, shelves first.**
 *
 * The viewer this leaf is built for came from a Twitch panel on a phone, has
 * never seen this site, and will leave in about eight seconds if nothing is
 * recognisable. So the order is fixed and opinionated:
 *
 *   purpose → search → suggestions → the streamer's picks → everything else
 *
 * ── Why the suggestions sit above the shelves, not inside search ───────────
 * They are the only control on the screen that works for someone who cannot
 * describe what they want. Putting them under the field — always visible, not
 * behind focus, not behind a dropdown — turns "I don't know the words" into one
 * tap, and it is why this leaf can afford to keep the search field small.
 *
 * ── Why Send is on the card ────────────────────────────────────────────────
 * A picker with a selected item has two places to look at once. This one never
 * has a selection: you press Send on the thing you are looking at, and *that
 * thing* changes to say so. The confirmation lands where the eye already is.
 *
 * ── The one thing this leaf spends its budget on ───────────────────────────
 * Tap targets. Every Send is a full-height 44px+ primary button, the cards are
 * one per row, and nothing is behind a hover. It costs vertical space, which is
 * the cheapest thing on a phone and the most expensive on a desktop — which is
 * exactly why `shelf-rail` exists.
 *
 * Theming: Send is `bg-primary` + `text-primary-foreground`, badges and the
 * transcript highlight are accent, every focus ring is `--ring`.
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
  label: "One Column",
  description:
    "Phone-first: purpose, search, curated suggestions, then the streamer's shelves — one card per row with a full-width Send. Nothing behind a hover, no selection state, no second place to look.",
  sizeHint: "lg",
  tags: ["mobile", "shelves", "search", "send", "recommended"],
};

/* --------------------------------------------------------------- parts */

function Quote({ segments }: { segments: TranscriptSegment[] }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {/* The container decided what matched. This only paints it. */}
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={index}
            className="rounded bg-accent px-0.5 font-medium text-accent-foreground"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

/**
 * The surface-wide sentence. Above the search field, below the purpose — the
 * first thing read after "what is this screen", which is where "…but you cannot
 * send right now" has to land if the shelves below it are going to make sense.
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

function SendButton({ card }: { card: ClipCard }) {
  const { send } = card;
  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={send.onSend ?? undefined}
        disabled={send.onSend === null}
        aria-label={send.ariaLabel}
        data-send-state={send.state}
        className={cn(
          "min-h-11 rounded-xl px-5 text-sm font-semibold transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          send.state === "ready" && "bg-primary text-primary-foreground hover:bg-primary/90",
          send.state === "sending" && "bg-primary/70 text-primary-foreground",
          // Sent is a statement, not an action — it stops looking like a button.
          send.state === "sent" && "border border-primary/40 bg-primary/10 text-primary",
          send.state === "blocked" && "border border-border bg-muted text-muted-foreground",
        )}
      >
        {send.label}
      </button>
      {send.hint ? (
        <span className="text-center text-[0.6875rem] leading-tight text-muted-foreground">
          {send.hint}
        </span>
      ) : null}
    </div>
  );
}

function Card({ card }: { card: ClipCard }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 @lg:flex-row @lg:items-center">
      {card.thumbnail ? (
        <div className="relative shrink-0 overflow-hidden rounded-xl @lg:w-40">
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
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h4 className="text-balance text-sm font-semibold text-foreground">{card.title}</h4>
          {card.badge ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">
              {card.badge}
            </span>
          ) : null}
        </div>

        {card.quote ? <Quote segments={card.quote} /> : null}

        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {/* No thumbnail means the duration lost its home — say it here instead. */}
          {card.thumbnail ? null : <span>{card.duration}</span>}
          {card.timestamp ? <span>at {card.timestamp}</span> : null}
          {card.age ? <span>{card.age}</span> : null}
          {card.plays ? <span>{card.plays}</span> : null}
          {card.creatorLabel ? <span>{card.creatorLabel}</span> : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 @lg:flex-col">
        <div className="flex-1 @lg:w-32 @lg:flex-none">
          <SendButton card={card} />
        </div>
        {card.onPreview ? (
          <button
            type="button"
            onClick={card.onPreview}
            aria-label={card.previewAriaLabel ?? undefined}
            className="min-h-11 shrink-0 rounded-xl border border-border px-4 text-sm text-muted-foreground hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring @lg:w-32"
          >
            Preview
          </button>
        ) : null}
      </div>
    </li>
  );
}

function Suggestions({
  label,
  suggestions,
}: {
  label: string;
  suggestions: SearchSuggestion[];
}) {
  if (suggestions.length === 0) return null;
  return (
    <section aria-label={label} className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <button
              type="button"
              onClick={suggestion.onPick}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 text-sm text-foreground hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {suggestion.label}
              {suggestion.count ? (
                <span className="text-xs text-muted-foreground">{suggestion.count}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Skeletons({ count }: { count: number }) {
  return (
    <ul aria-hidden className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex gap-3 rounded-2xl border border-border bg-card p-3"
        >
          <div className="h-20 w-40 shrink-0 rounded-xl bg-muted" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted/70" />
            <div className="h-3 w-1/3 rounded bg-muted/70" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- leaf */

export function ClipPickerOneColumn(vm: ClipPickerVM) {
  /*
   * Derived inline from `vm.progress` — allowed, and the reason the lab can
   * scrub the arrival. Reduced motion was already resolved by the container,
   * so honouring it here is one branch and no clock.
   */
  const settle = vm.reducedMotion
    ? undefined
    : {
        opacity: 0.4 + 0.6 * vm.progress,
        transform: `translateY(${(1 - vm.progress) * 8}px)`,
      };

  return (
    <section
      data-clip-picker={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="@container mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-border bg-background p-4"
    >
      {/* ------------------------------------------------------- purpose */}
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

      {/* -------------------------------------------------------- search */}
      {vm.state === "offline" ? null : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
              <span aria-hidden className="text-muted-foreground">
                ⌕
              </span>
              <input
                type="search"
                value={vm.search.query}
                onChange={(event) => vm.search.onQueryChange(event.target.value)}
                aria-label={vm.search.label}
                placeholder={vm.search.placeholder}
                className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              {vm.search.onClear ? (
                <button
                  type="button"
                  onClick={vm.search.onClear}
                  aria-label="Clear the search"
                  className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {vm.scope ? (
              <label className="flex shrink-0 items-center">
                <span className="sr-only">{vm.scope.label}</span>
                <select
                  value={vm.scope.value}
                  onChange={(event) => vm.scope?.onChange(event.target.value)}
                  className="min-h-11 rounded-xl border border-border bg-card px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

          {vm.search.resultLabel || vm.search.hint ? (
            <p className="text-xs text-muted-foreground">
              {vm.search.resultLabel ?? vm.search.hint}
            </p>
          ) : null}
        </div>
      )}

      {/* --------------------------------------------------------- body */}
      {vm.state === "loading" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{vm.loadingLabel}</p>
          <Skeletons count={vm.skeletonCount} />
        </div>
      ) : null}

      {vm.state === "offline" ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
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
                    // A curator's mark is the one ranking this leaf honours.
                    shelf.featured ? "text-lg" : "text-sm",
                  )}
                >
                  {shelf.label}
                </h3>
                {shelf.hint ? (
                  <p className="text-xs text-muted-foreground">{shelf.hint}</p>
                ) : null}
              </div>
              <ul className="flex flex-col gap-3">
                {shelf.items.map((card) => (
                  <Card key={card.id} card={card} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {vm.state === "searching" ? <Skeletons count={vm.skeletonCount} /> : null}

      {vm.state === "results" ? (
        <ul className="flex flex-col gap-3" style={settle}>
          {vm.results.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </ul>
      ) : null}

      {/* The dead end. The suggestions are the way out, so they are the biggest
          thing on it. */}
      {vm.state === "empty" ? (
        <div className="flex flex-col gap-6 rounded-xl border border-dashed border-border p-6">
          <p className="text-sm text-foreground">{vm.emptyLabel}</p>
          <Suggestions label={vm.search.suggestionsLabel} suggestions={vm.search.suggestions} />
        </div>
      ) : null}
    </section>
  );
}

export default ClipPickerOneColumn;
