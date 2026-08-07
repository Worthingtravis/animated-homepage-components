"use client";

/**
 * The editor mode, held once for the whole app.
 *
 * There is exactly ONE mode, at the root, because that is what a creator has:
 * a creator page does not theme its hero differently from its nav, and a lab
 * that themed only its preview box would let a leaf pass while the chrome
 * beside it disagreed about what `--primary` means.
 *
 * Upstream tints the owner's editor rail with the owner's own accent for the
 * same reason — the controls live inside the thing they control.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import type { EditorMode } from "./editor-mode";
import {
  DEFAULT_PRESET,
  EDITOR_MODE_PRESETS,
  type EditorModePresetName,
} from "./editor-mode-presets";

const STORAGE_KEY = "forest.editor-mode";

export type EditorModeState = {
  mode: EditorMode;
  /** Off renders on the forest's own tokens, for judging a leaf unthemed. */
  themed: boolean;
  withBackgroundImage: boolean;
  /** Whether the floating dock is expanded. */
  open: boolean;
};

const INITIAL: EditorModeState = {
  mode: EDITOR_MODE_PRESETS[DEFAULT_PRESET],
  themed: true,
  withBackgroundImage: false,
  open: false,
};

type Action =
  | { type: "patch_mode"; patch: Partial<EditorMode> }
  | { type: "select_preset"; preset: EditorModePresetName }
  | { type: "toggle_themed" }
  | { type: "toggle_background_image" }
  | { type: "toggle_open" }
  | { type: "hydrate"; state: EditorModeState };

function reducer(state: EditorModeState, action: Action): EditorModeState {
  switch (action.type) {
    case "patch_mode":
      // Touching a control implies wanting to see it, rather than editing
      // something that is currently switched off.
      return { ...state, themed: true, mode: { ...state.mode, ...action.patch } };
    case "select_preset":
      return { ...state, themed: true, mode: EDITOR_MODE_PRESETS[action.preset] };
    case "toggle_themed":
      return { ...state, themed: !state.themed };
    case "toggle_background_image":
      return { ...state, withBackgroundImage: !state.withBackgroundImage };
    case "toggle_open":
      return { ...state, open: !state.open };
    case "hydrate":
      return action.state;
  }
}

export type EditorModeContextValue = EditorModeState & {
  /** The mode to render with — `null` when editor mode is switched off. */
  activeMode: EditorMode | null;
  patchMode: (patch: Partial<EditorMode>) => void;
  selectPreset: (preset: EditorModePresetName) => void;
  toggleThemed: () => void;
  toggleBackgroundImage: () => void;
  toggleOpen: () => void;
};

const EditorModeContext = createContext<EditorModeContextValue | null>(null);

export function EditorModeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  /*
   * Read persisted state AFTER mount rather than during the first render.
   * Server-rendered HTML cannot know what is in localStorage, and seeding the
   * reducer from it would be a hydration mismatch — the exact class of bug
   * Next.js flags on `<html>`. One frame of default theme is the cost.
   */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<EditorModeState>;
      if (!saved.mode) return;
      dispatch({
        type: "hydrate",
        state: {
          ...INITIAL,
          ...saved,
          // Never restore the dock open — a page that loads with a panel over
          // it is a page you have to dismiss before you can look at it.
          open: false,
          mode: { ...INITIAL.mode, ...saved.mode },
        },
      });
    } catch {
      // A corrupt or unreadable entry is not worth failing the app over.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode / quota. The app works, it just will not remember.
    }
  }, [state]);

  const value = useMemo<EditorModeContextValue>(
    () => ({
      ...state,
      activeMode: state.themed ? state.mode : null,
      patchMode: (patch) => dispatch({ type: "patch_mode", patch }),
      selectPreset: (preset) => dispatch({ type: "select_preset", preset }),
      toggleThemed: () => dispatch({ type: "toggle_themed" }),
      toggleBackgroundImage: () => dispatch({ type: "toggle_background_image" }),
      toggleOpen: () => dispatch({ type: "toggle_open" }),
    }),
    [state],
  );

  return <EditorModeContext.Provider value={value}>{children}</EditorModeContext.Provider>;
}

export function useEditorMode(): EditorModeContextValue {
  const value = useContext(EditorModeContext);
  if (!value) throw new Error("useEditorMode must be used inside <EditorModeProvider>");
  return value;
}

/** Load a webfont for the chosen family, so the font control does something. */
export function useGoogleFont(family: string | null) {
  const load = useCallback((name: string) => {
    const id = `forest-font-${name.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      name,
    )}:wght@400;600;800&display=swap`;
    document.head.append(link);
  }, []);

  useEffect(() => {
    if (family) load(family);
  }, [family, load]);
}
