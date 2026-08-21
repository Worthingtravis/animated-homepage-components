/**
 * Quote First — a leaf on Clip Picker / Canon.
 *
 * PURE PRESENTATION. Its props ARE ClipPickerVM.
 *
 * Structural answer: **the transcript is the content; the clip is the
 * attachment.**
 *
 * The other two Canon leaves render a clip that happens to carry a quote. This
 * one renders the *line that was said*, at reading size, and treats the clip as
 * metadata hanging off it. Same VM, opposite emphasis — which is the whole
 * argument for a contract: nothing about this leaf required a new field.
 *
 * ── Who it is for ──────────────────────────────────────────────────────────
 * The viewer who already has words. A regular, a mod, someone who watched the
 * VOD last night and wants the exact moment. For them a thumbnail grid is noise
 * — thumbnails of one streamer's face all look the same, and the sentence is
 * the only thing that distinguishes one result from another.
 *
 * ── Why the search field is the biggest thing on the screen ────────────────
 * Because that is the promise. A field this size says "type the words" the way
 * a small one in a header never does. The cost is that `browse` — the state a
 * first-time viewer lands in — gets less room than it does elsewhere, and the
 * shelves fall back to a compact list. That trade is the leaf.
 *
 * Theming: the field's focus ring and the search glyph are `--ring`/primary,
 * the matched run is accent, Send is a primary fill.
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
  label: "Quote First",
  description:
    "Search-led: a full-width field, and results that lead with the sentence at reading size with the clip hanging off it. For the viewer who already has the words.",
  sizeHint: "lg",
  tags: ["search", "transcript", "quote", "regulars", "text-first"],
};

function Quote({ segments }: { segments: TranscriptSegment[] }) {
  return (
    <p className="text-pretty text-lg leading-relaxed text-foreground">
      <span aria-hidden className="text-muted-foreground">
        “
      </span>
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={index}
            className="rounded bg-accent px-1 font-semibold text-accent-foreground"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
      <span aria-hidden className="text-muted-foreground">
        ”
      </span>
    </p>
  );
}

function SendButton({ card }: { card: ClipCard }) {
  const { send } = card;
  return (
    <button
      type="button"
      onClick={send.onSend ?? undefined}
      disabled={send.onSend === null}
      aria-label={send.ariaLabel}
      data-send-state={send.state}
      className={cn(
        "min-h-10 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors",
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

/** The line first. Everything else is a footnote under it. */
function QuoteRow({ card }: { card: ClipCard }) {
  return (
    <li className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0">
      {card.quote ? (
        <Quote segments={card.quote} />
      ) : (
        <p className="text-lg leading-relaxed text-foreground">{card.title}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {card.thumbnail ? (
          <Image
            src={card.thumbnail.src}
            alt={card.thumbnail.alt}
            width={card.thumbnail.width}
            height={card.thumbnail.height}
            className="h-10 w-auto shrink-0 rounded object-cover"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-baseline gap-x-2">
            {/* Demoted to a caption — the sentence above is the headline now. */}
            <span className="truncate text-sm font-medium text-muted-foreground">
              {card.title}
            </span>
            {card.badge ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">
                {card.badge}
              </span>
            ) : null}
          </div>
          <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            <span>{card.duration}</span>
            {card.timestamp ? <span>at {card.timestamp}</span> : null}
            {card.age ? <span>{card.age}</span> : null}
            {card.plays ? <span>{card.plays}</span> : null}
            {card.creatorLabel ? <span>{card.creatorLabel}</span> : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <SendButton card={card} />
          {card.send.hint ? (
            <span className="text-[0.6875rem] text-muted-foreground">{card.send.hint}</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Browse gets a compact list here — the field already took the room. */
function CompactRow({ card }: { card: ClipCard }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="truncate text-sm font-medium text-foreground">{card.title}</span>
          {card.badge ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">
              {card.badge}
            </span>
          ) : null}
        </div>
        <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <span>{card.duration}</span>
          {card.age ? <span>{card.age}</span> : null}
          {card.plays ? <span>{card.plays}</span> : null}
        </p>
      </div>
      <SendButton card={card} />
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
    <ul aria-hidden className="flex flex-col gap-5">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex flex-col gap-3 border-b border-border pb-5">
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-5 w-4/5 rounded bg-muted" />
          <div className="h-8 w-40 rounded bg-muted/70" />
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

export function ClipPickerQuoteFirst(vm: ClipPickerVM) {
  const settle = vm.reducedMotion
    ? undefined
    : { opacity: 0.4 + 0.6 * vm.progress, transform: `translateY(${(1 - vm.progress) * 6}px)` };

  return (
    <section
      data-clip-picker={vm.scopeId}
      data-state={vm.state}
      data-density={vm.density}
      className="@container mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-2xl border border-border bg-background p-4 @lg:p-6"
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

      {/* The promise, at the size of a promise. */}
      {vm.state === "offline" ? null : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
            <span aria-hidden className="text-xl text-primary">
              ⌕
            </span>
            <input
              type="search"
              value={vm.search.query}
              onChange={(event) => vm.search.onQueryChange(event.target.value)}
              aria-label={vm.search.label}
              placeholder={vm.search.placeholder}
              className="min-h-14 min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
            />
            {vm.search.onClear ? (
              <button
                type="button"
                onClick={vm.search.onClear}
                aria-label="Clear the search"
                className="inline-flex min-h-11 shrink-0 items-center self-stretch rounded-lg px-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ✕
              </button>
            ) : null}
            {vm.scope ? (
              <label className="shrink-0">
                <span className="sr-only">{vm.scope.label}</span>
                <select
                  value={vm.scope.value}
                  onChange={(event) => vm.scope?.onChange(event.target.value)}
                  className="min-h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <p className="text-sm text-muted-foreground">
              {vm.search.resultLabel ?? vm.search.hint}
            </p>
          ) : null}

          <Suggestions label={vm.search.suggestionsLabel} suggestions={vm.search.suggestions} />
        </div>
      )}

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

      {vm.state === "searching" ? <Skeletons count={vm.skeletonCount} /> : null}

      {vm.state === "results" ? (
        <ul className="flex flex-col gap-5" style={settle}>
          {vm.results.map((card) => (
            <QuoteRow key={card.id} card={card} />
          ))}
        </ul>
      ) : null}

      {vm.state === "empty" ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-foreground">
          {vm.emptyLabel}
        </p>
      ) : null}

      {/* Compact by design — the field took the room, on purpose. */}
      {vm.state === "browse" ? (
        <div className="flex flex-col gap-6" style={settle}>
          {vm.shelves.map((shelf) => (
            <section key={shelf.id} aria-labelledby={shelf.headingId} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3
                  id={shelf.headingId}
                  className={cn(
                    "font-semibold text-foreground",
                    shelf.featured ? "text-base" : "text-sm",
                  )}
                >
                  {shelf.label}
                </h3>
                {shelf.hint ? <p className="text-xs text-muted-foreground">{shelf.hint}</p> : null}
              </div>
              <ul className="flex flex-col gap-1.5">
                {shelf.items.map((card) => (
                  <CompactRow key={card.id} card={card} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ClipPickerQuoteFirst;
