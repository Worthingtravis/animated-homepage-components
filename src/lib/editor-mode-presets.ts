/**
 * Editor mode presets — the accents every leaf gets checked against.
 *
 * These are to editor mode what fixtures are to a VM: a spread of real inputs
 * wide enough that a leaf cannot pass by accident. The conformance suite renders
 * every leaf inside a `CreatorSurface` wearing each of them.
 *
 * The spread is chosen deliberately:
 *  - `Default` is the Prisma column default — what a creator who never opened
 *    the editor actually has.
 *  - `Ocean` and `Ember` are ordinary mid-luminance picks, one cool one warm.
 *  - `Lime` is the documented failure case. Upstream's own comment records that
 *    #9CCB1A put white text on the primary CTA at 1.91:1 — effectively
 *    invisible — which is why `--primary-foreground` is derived rather than
 *    hardcoded. Any leaf that hardcodes a light foreground on a primary fill
 *    fails visibly here, and that is the point of shipping it.
 *  - `Ink` drives `themeBackground`, which most presets leave null, so the one
 *    variable that repaints the page surface is never untested.
 */

import type { EditorMode } from "./editor-mode";
import { EDITOR_MODE_DEFAULT } from "./editor-mode";

const base = {
  themeBackground: null,
  fontFamily: null,
  backgroundImageUrl: null,
  backgroundPosition: null,
  featureFlags: null,
} satisfies Omit<EditorMode, "themeAccent" | "themeAccentDark">;

/** Prisma's `themeAccent @default("#FF69B4")` / `themeAccentDark @default("#E91E8C")`. */
export const PRESET_DEFAULT: EditorMode = EDITOR_MODE_DEFAULT;

export const PRESET_OCEAN: EditorMode = {
  ...base,
  themeAccent: "#4EA8FF",
  themeAccentDark: "#2B6FB8",
};

export const PRESET_EMBER: EditorMode = {
  ...base,
  themeAccent: "#FFB347",
  themeAccentDark: "#C77F1E",
};

/**
 * The contrast trap. `readableTextOn("#9CCB1A")` returns black; a leaf that
 * hardcodes white on a primary fill is unreadable under this preset.
 */
export const PRESET_LIME: EditorMode = {
  ...base,
  themeAccent: "#9CCB1A",
  themeAccentDark: "#6F9210",
};

/** The one preset that repaints the page surface itself. */
export const PRESET_INK: EditorMode = {
  ...base,
  themeAccent: "#C4B5FD",
  themeAccentDark: "#8B5CF6",
  themeBackground: "#0B0B14",
};

/** Label -> mode. The lab's editor dock renders one swatch per entry. */
export const EDITOR_MODE_PRESETS = {
  Default: PRESET_DEFAULT,
  Ocean: PRESET_OCEAN,
  Ember: PRESET_EMBER,
  Lime: PRESET_LIME,
  Ink: PRESET_INK,
} satisfies Record<string, EditorMode>;

export type EditorModePresetName = keyof typeof EDITOR_MODE_PRESETS;

export const DEFAULT_PRESET: EditorModePresetName = "Default";

/**
 * Font families the dock offers. These are NAMES, matching how upstream stores
 * `fontFamily` (a Google Font family, not a stack) — `editorModeVars` turns the
 * name into `"<name>", sans-serif` exactly as production does.
 *
 * `null` means "leave the forest default alone". The lab loads a webfont for a
 * chosen name; a name whose font is neither installed nor loadable simply falls
 * through to the `sans-serif` half of the stack, which is the same thing that
 * happens on a creator page when Google Fonts is blocked.
 */
export const EDITOR_MODE_FONTS: Array<string | null> = [
  null,
  "Inter",
  "Fraunces",
  "Space Grotesk",
  "IBM Plex Mono",
  "Bebas Neue",
];
