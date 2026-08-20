/**
 * Chaptered — a leaf on Forest Primer / Canon.
 *
 * PURE PRESENTATION. Its props ARE ForestPrimerVM.
 *  - no useState / useEffect / useMemo / useCallback / useRef
 *  - no fetch, no server actions, no imports from any hook or client
 *  - no hardcoded colors and no `dark:` prefixes — semantic tokens only
 *  - no raw <img> — use next/image
 *  - honour `vm.reducedMotion`: when true, render the resting frame
 *
 * Every diagram below is drawn from `chapter.figure`, which carries strings and
 * arrays and nothing else. The rectangles, rules, ticks and the knob are this
 * file's opinion; a sibling leaf may draw the same six figures completely
 * differently without the contract moving. Deriving a transform from
 * `chapter.progress` inline is presentation, not business logic.
 */

import type { ReactNode } from "react";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import type {
  ChapterPosition,
  ForestPrimerChapter,
  ForestPrimerVM,
  PrimerFigure,
} from "../../../forest-primer.vm";

export const meta: LeafMeta = {
  label: "Chaptered",
  description:
    "Numbered chapters down a ruled column, each with its diagram drawn in CSS and SVG — " +
    "boxes, a track, a strike, two grids and a chain.",
  sizeHint: "lg",
  tags: ["editorial", "scroll", "diagram"],
};

/* ------------------------------------------------------------------ *
 * Reveal — one expression, no comparisons.
 *
 * Each chapter already carries its own progress, so entrance is arithmetic on a
 * number this file was handed rather than a guess about which chapter is where.
 * ------------------------------------------------------------------ */

function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function revealStyle(chapter: ForestPrimerChapter, reducedMotion: boolean) {
  if (reducedMotion) return undefined;
  const t = ease(chapter.progress);
  return {
    opacity: 0.35 + 0.65 * t,
    transform: `translateY(${(1 - t) * 14}px)`,
  };
}

/** A grown rule / bar / fill. Reduced motion means "already grown". */
function grow(chapter: ForestPrimerChapter, reducedMotion: boolean): number {
  return reducedMotion ? 1 : ease(chapter.progress);
}

const NUMERAL_BY_POSITION: Record<ChapterPosition, string> = {
  past: "border-primary/40 text-primary",
  active: "border-primary bg-primary text-primary-foreground",
  upcoming: "border-border text-muted-foreground",
};

/* ------------------------------------------------------------------ *
 * The six figures.
 * ------------------------------------------------------------------ */

function NestingFigure({
  figure,
  fill,
}: {
  figure: Extract<PrimerFigure, { kind: "nesting" }>;
  fill: number;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-muted/40 p-3 sm:p-5">
        {figure.levels.reduceRight<ReactNode>((inner, level, index) => {
          const depth = figure.levels.length - 1 - index;
          const arrived = fill >= depth / Math.max(1, figure.levels.length);
          return (
            <div
              key={level.id}
              data-level={level.term}
              className={cn(
                "rounded-lg border p-3 transition-colors sm:p-4",
                arrived ? "border-primary/40 bg-card" : "border-border bg-card/60",
              )}
              style={{ opacity: arrived ? 1 : 0.55 }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={cn(
                    "font-mono text-[0.65rem] uppercase tracking-[0.2em]",
                    arrived ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {level.term}
                </span>
                <span className="font-mono text-sm font-medium text-foreground">{level.name}</span>
                {level.countLabel ? (
                  <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                    {level.countLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{level.note}</p>
              {inner ? <div className="mt-3 border-l-2 border-primary/25 pl-3">{inner}</div> : null}
            </div>
          );
        }, null)}
      </div>

      <p className="overflow-x-auto rounded-lg bg-primary/5 px-3 py-2 font-mono text-xs text-foreground ring-1 ring-primary/20">
        {figure.path}
      </p>
    </div>
  );
}

const SPLIT_TONE = {
  allowed: { box: "border-primary/40 bg-primary/5", dot: "bg-primary", file: "text-primary" },
  carried: { box: "border-accent/50 bg-accent/5", dot: "bg-accent", file: "text-foreground" },
  forbidden: { box: "border-dashed border-border bg-card", dot: "bg-muted-foreground/50", file: "text-muted-foreground" },
} as const;

function SplitFigure({
  figure,
  fill,
}: {
  figure: Extract<PrimerFigure, { kind: "split" }>;
  fill: number;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {figure.columns.map((column, index) => {
          const tone = SPLIT_TONE[column.tone];
          const local = Math.min(1, Math.max(0, fill * figure.columns.length - index));
          return (
            <div
              key={column.id}
              data-tone={column.tone}
              className={cn("rounded-lg border p-4", tone.box)}
              style={{ opacity: 0.4 + 0.6 * local }}
            >
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              <p className={cn("mt-0.5 font-mono text-xs", tone.file)}>{column.file}</p>
              <ul className="mt-3 space-y-1.5">
                {column.entries.map((entry) => (
                  <li key={entry} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", tone.dot)} />
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
        {figure.obligation}
      </p>
    </div>
  );
}

function TransportFigure({
  figure,
  fill,
}: {
  figure: Extract<PrimerFigure, { kind: "transport" }>;
  fill: number;
}) {
  const percent = `${fill * 100}%`;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between font-mono text-xs text-muted-foreground">
          <span className="text-foreground">{figure.valueLabel}</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{figure.knobLabel}</span>
        </div>

        <div className="relative mt-6 h-2 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: percent }}
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-ring/25"
            style={{ left: percent }}
          />
        </div>

        <div className="mt-3 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{figure.startLabel}</span>
          <span>{figure.endLabel}</span>
        </div>
      </div>

      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {figure.rows.map((row, index) => (
          <li
            key={row.id}
            className="flex flex-col border-t border-border pt-2"
            style={{ opacity: 0.35 + 0.65 * Math.min(1, Math.max(0, fill * figure.rows.length - index)) }}
          >
            <span className="font-mono text-xs text-primary">{row.ref}</span>
            <span className="text-xs text-muted-foreground">{row.transport}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormattingFigure({
  figure,
  fill,
}: {
  figure: Extract<PrimerFigure, { kind: "formatting" }>;
  fill: number;
}) {
  return (
    <ul className="space-y-3">
      {figure.rows.map((row, index) => {
        const local = Math.min(1, Math.max(0, fill * figure.rows.length - index));
        return (
          <li
            key={row.id}
            className="grid items-center gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_1fr]"
          >
            <div>
              <code className="font-mono text-xs text-muted-foreground line-through decoration-primary/60">
                {row.computed}
              </code>
              <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground">{row.source}</p>
            </div>

            <span
              aria-hidden
              className="hidden h-px bg-primary/50 sm:block"
              style={{ width: `${16 + 24 * local}px` }}
            />

            <span
              className="justify-self-start rounded-md bg-primary/10 px-2.5 py-1 font-mono text-sm font-medium text-foreground ring-1 ring-primary/25 sm:justify-self-end"
              style={{ opacity: 0.4 + 0.6 * local, transform: `translateX(${(1 - local) * -8}px)` }}
            >
              {row.arrives}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function MatrixFigure({
  figure,
  fill,
}: {
  figure: Extract<PrimerFigure, { kind: "matrix" }>;
  fill: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {figure.grids.map((grid) => {
        const columns = grid.cells[0]?.length ?? 0;
        const total = Math.max(1, grid.cells.length * columns);
        return (
          <div key={grid.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">{grid.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {grid.rowLabel} · {grid.columnLabel}
            </p>

            {columns > 0 ? (
              <div
                className="mt-4 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {grid.cells.map((row, rowIndex) =>
                  row.map((cell, columnIndex) => {
                    const ticked = (rowIndex * columns + columnIndex + 1) / total <= fill;
                    return (
                      <span
                        key={cell}
                        data-ticked={ticked}
                        className={cn(
                          "aspect-square rounded-[2px] transition-colors",
                          ticked ? "bg-primary" : "bg-muted",
                        )}
                      />
                    );
                  }),
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Nothing planted, nothing to prove.
              </p>
            )}

            <p className="mt-3 font-mono text-xs text-primary">{grid.totalLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{grid.note}</p>
          </div>
        );
      })}
    </div>
  );
}

function ChainFigure({
  figure,
  fill,
}: {
  figure: Extract<PrimerFigure, { kind: "chain" }>;
  fill: number;
}) {
  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap items-stretch gap-2">
        {figure.links.map((link, index) => {
          const local = Math.min(1, Math.max(0, fill * figure.links.length - index));
          return (
            <li
              key={link.id}
              className="flex items-center gap-2"
              style={{ opacity: 0.35 + 0.65 * local }}
            >
              {index > 0 ? (
                <span aria-hidden className="h-px w-5 bg-primary/40" />
              ) : null}
              <span className="rounded-lg border border-border bg-card px-3 py-2">
                <span className="block font-mono text-xs text-primary">{link.href}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{link.caption}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-muted-foreground">
        Read from <code className="font-mono text-primary">{figure.source}</code>. {figure.note}
      </p>
    </div>
  );
}

function Figure({ chapter, reducedMotion }: { chapter: ForestPrimerChapter; reducedMotion: boolean }) {
  const fill = grow(chapter, reducedMotion);
  switch (chapter.figure.kind) {
    case "nesting":
      return <NestingFigure figure={chapter.figure} fill={fill} />;
    case "split":
      return <SplitFigure figure={chapter.figure} fill={fill} />;
    case "transport":
      return <TransportFigure figure={chapter.figure} fill={fill} />;
    case "formatting":
      return <FormattingFigure figure={chapter.figure} fill={fill} />;
    case "matrix":
      return <MatrixFigure figure={chapter.figure} fill={fill} />;
    case "chain":
      return <ChainFigure figure={chapter.figure} fill={fill} />;
  }
}

/* ------------------------------------------------------------------ *
 * The leaf.
 * ------------------------------------------------------------------ */

export function ForestPrimerChaptered(vm: ForestPrimerVM) {
  if (vm.state === "empty") {
    return (
      <section
        data-state={vm.state}
        className="rounded-2xl border border-dashed border-primary/30 bg-card/40 p-10 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {vm.headline}
        </p>
      </section>
    );
  }

  const spine = vm.reducedMotion ? 1 : ease(vm.progress);

  return (
    <section
      data-state={vm.state}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="h-1 w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${spine * 100}%` }} />
      </div>

      <header className="px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          {vm.eyebrow ? (
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
              {vm.eyebrow}
            </p>
          ) : null}
          {vm.positionLabel ? (
            <p className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {vm.positionLabel}
            </p>
          ) : null}
        </div>

        <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {vm.headline}
        </h2>

        {vm.body ? (
          <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">{vm.body}</p>
        ) : null}
      </header>

      <div className="px-6 sm:px-10">
        {vm.chapters.map((chapter) => (
          <article
            key={chapter.id}
            data-chapter={chapter.id}
            data-position={chapter.position}
            className="border-t border-border py-10 first:border-t-0 sm:py-14"
            style={revealStyle(chapter, vm.reducedMotion)}
          >
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
              <div className="flex sm:flex-col sm:items-center">
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border font-mono text-sm font-semibold transition-colors",
                    NUMERAL_BY_POSITION[chapter.position],
                  )}
                >
                  {chapter.ordinal}
                </span>
                <span
                  aria-hidden
                  className="ml-4 mt-6 hidden w-px flex-1 bg-primary/20 sm:ml-0 sm:block"
                />
              </div>

              <div className="min-w-0 space-y-5">
                <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {chapter.title}
                </h3>

                <Figure chapter={chapter} reducedMotion={vm.reducedMotion} />

                <p className="max-w-2xl text-sm text-muted-foreground">{chapter.caption}</p>

                {chapter.pullQuote ? (
                  <p className="border-l-2 border-accent pl-4 text-lg font-medium text-balance text-foreground sm:text-xl">
                    {chapter.pullQuote}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      {vm.closingLine ? (
        <footer className="border-t border-border px-6 py-10 text-center sm:px-10">
          <span
            className="inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            style={{ opacity: 0.5 + 0.5 * spine }}
          >
            {vm.closingLine}
          </span>
        </footer>
      ) : null}
    </section>
  );
}

export default ForestPrimerChaptered;
