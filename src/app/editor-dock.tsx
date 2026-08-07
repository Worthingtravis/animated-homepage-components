"use client";

/**
 * The editor dock — the lab's stand-in for the creator page builder's
 * appearance controls, reachable from every route.
 *
 * It offers the same fields upstream's theme swatches and `PageSettingsGroup`
 * offer, writing the one `EditorMode` the whole app renders inside. Nothing
 * here is a design decision of its own: if a control exists in this dock it is
 * because a creator has it, and if a creator has it, a leaf has to survive it.
 *
 * Like upstream's rail this floats over the page and is dismissible, and like
 * upstream's rail it is tinted by the accent it is editing — which is a feature,
 * because a control that stays readable in its own output is a control that has
 * proven the accent works.
 */

import { readableTextOn } from "@/lib/editor-mode";
import { useEditorMode } from "@/lib/editor-mode-context";
import {
  EDITOR_MODE_FONTS,
  EDITOR_MODE_PRESETS,
  type EditorModePresetName,
} from "@/lib/editor-mode-presets";
import { cn } from "@/lib/utils";

const SWATCH =
  "size-8 cursor-pointer rounded-md border border-border bg-transparent p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0.5";

const FIELD =
  "w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Upstream's 9-cell background position picker. */
const POSITIONS = [
  "left top",
  "center top",
  "right top",
  "left center",
  "center",
  "right center",
  "left bottom",
  "center bottom",
  "right bottom",
];

export function EditorDock() {
  const editor = useEditorMode();
  const { mode } = editor;

  if (!editor.open) {
    return (
      <button
        type="button"
        onClick={editor.toggleOpen}
        aria-expanded={false}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden
          className="size-3.5 rounded-full border border-border"
          style={{ backgroundColor: editor.themed ? mode.themeAccent : "transparent" }}
        />
        Editor mode
      </button>
    );
  }

  return (
    <aside
      aria-label="Editor mode"
      className="fixed bottom-4 right-4 z-50 max-h-[85dvh] w-72 space-y-5 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-2xl"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Editor mode
        </h2>
        <button
          type="button"
          onClick={editor.toggleOpen}
          aria-label="Close editor mode"
          className="rounded-md px-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        The creator page&rsquo;s own controls. They theme the whole app, because a creator page is
        themed edge to edge.
      </p>

      <button
        type="button"
        aria-pressed={editor.themed}
        onClick={editor.toggleThemed}
        className={cn(
          "w-full rounded-md border px-3 py-1.5 text-sm transition-colors",
          editor.themed
            ? "border-ring bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {editor.themed ? "On — showing a creator's theme" : "Off — forest tokens"}
      </button>

      {/* ── Presets ─────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h3 className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
          Theme
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(EDITOR_MODE_PRESETS) as EditorModePresetName[]).map((name) => {
            const preset = EDITOR_MODE_PRESETS[name];
            const selected = preset.themeAccent === mode.themeAccent;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={selected}
                onClick={() => editor.selectPreset(name)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                  selected
                    ? "border-ring text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="size-3.5 rounded-full border border-border"
                  style={{ backgroundColor: preset.themeAccent }}
                />
                {name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Colours. Upstream ships exactly these three swatches. ────── */}
      <section className="space-y-2">
        <h3 className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
          Colours
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <label className="space-y-1.5">
            <span className="block text-xs text-muted-foreground">Brand</span>
            <input
              type="color"
              value={mode.themeAccent}
              onChange={(event) => editor.patchMode({ themeAccent: event.target.value })}
              className={SWATCH}
            />
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs text-muted-foreground">Hover / glow</span>
            <input
              type="color"
              value={mode.themeAccentDark}
              onChange={(event) => editor.patchMode({ themeAccentDark: event.target.value })}
              className={SWATCH}
            />
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs text-muted-foreground">Background</span>
            <input
              type="color"
              value={mode.themeBackground ?? "#000000"}
              onChange={(event) => editor.patchMode({ themeBackground: event.target.value })}
              className={SWATCH}
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {/*
            The derived value, shown rather than hidden. It is the single most
            surprising thing about this contract — the platform's own default
            pink needs BLACK text — and a leaf author who cannot see it will
            hardcode white.
          */}
          <span>
            <code className="font-mono">--primary-foreground</code> ={" "}
            <code className="font-mono text-foreground">{readableTextOn(mode.themeAccent)}</code>
          </span>
          {mode.themeBackground ? (
            <button
              type="button"
              onClick={() => editor.patchMode({ themeBackground: null })}
              className="shrink-0 underline hover:text-foreground"
            >
              clear
            </button>
          ) : null}
        </div>
      </section>

      {/* ── Font ────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h3 className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
          Font
        </h3>
        <select
          value={mode.fontFamily ?? ""}
          onChange={(event) => editor.patchMode({ fontFamily: event.target.value || null })}
          className={FIELD}
        >
          {EDITOR_MODE_FONTS.map((family) => (
            <option key={family ?? "default"} value={family ?? ""}>
              {family ?? "Platform default"}
            </option>
          ))}
        </select>
      </section>

      {/* ── Background image. Content, not palette. ──────────────────── */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
            Background image
          </h3>
          <button
            type="button"
            aria-pressed={editor.withBackgroundImage}
            onClick={editor.toggleBackgroundImage}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[0.625rem] transition-colors",
              editor.withBackgroundImage
                ? "border-ring text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {editor.withBackgroundImage ? "applied" : "ignored"}
          </button>
        </div>
        <input
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={mode.backgroundImageUrl ?? ""}
          onChange={(event) => editor.patchMode({ backgroundImageUrl: event.target.value || null })}
          className={FIELD}
        />
        <div className="grid w-fit grid-cols-3 gap-1" role="group" aria-label="Background position">
          {POSITIONS.map((position) => {
            const selected = (mode.backgroundPosition ?? "center") === position;
            return (
              <button
                key={position}
                type="button"
                title={position}
                aria-label={position}
                aria-pressed={selected}
                onClick={() => editor.patchMode({ backgroundPosition: position })}
                className={cn(
                  "size-5 rounded-sm border transition-colors",
                  selected ? "border-ring bg-primary" : "border-border hover:bg-muted",
                )}
              />
            );
          })}
        </div>
      </section>
    </aside>
  );
}
