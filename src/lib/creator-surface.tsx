/**
 * Creator surface — the wrapper that puts an editor mode on the air.
 *
 * This is a transcription of the wrapper div in laughingwhales'
 * `creator-page-client.tsx`. It is the single element that carries a creator's
 * look, and everything below it inherits:
 *
 *   <div className="creator-page creator-style-default" style={cssVars}>
 *
 * ── Why this component exists in the forest ────────────────────────────────
 * It is the harvest boundary. On a creator page this wrapper already exists and
 * a harvested leaf simply lands inside it. In this lab, nothing would otherwise
 * provide it, so a leaf would be checked against forest tokens and shipped into
 * a surface that repaints four of them underneath it. Rendering every preview
 * inside this wrapper is what makes the lab honest.
 *
 * It takes no hooks and holds no state, so it is safe anywhere — a server
 * component, a fixture-driven page, a test.
 *
 * ── Harvesting ─────────────────────────────────────────────────────────────
 * Do NOT copy this file into laughingwhales. The real wrapper is already there
 * and owns the live values; this is the forest's stand-in for it. Copy it only
 * into a target that has no creator-page chrome of its own.
 */

import type { CSSProperties, ReactNode } from "react";

import {
  editorModeBackground,
  editorModeClassName,
  editorModeVars,
  type EditorMode,
} from "./editor-mode";
import { cn } from "./utils";

export type CreatorSurfaceProps = {
  /** The resolved editor mode. `null` renders on the forest's own tokens. */
  mode: EditorMode | null;
  /**
   * Apply the background image as well as the palette. Off by default: most
   * previews want to judge a leaf against the creator's colours without a
   * photograph competing with it.
   */
  withBackgroundImage?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function CreatorSurface({
  mode,
  withBackgroundImage = false,
  className,
  style,
  children,
}: CreatorSurfaceProps) {
  return (
    <div
      data-creator-surface=""
      // `stylePersonality` rides along so a leaf sees the same class ancestry
      // here that it will see on a creator page.
      className={cn(editorModeClassName(mode), className)}
      style={
        {
          ...editorModeVars(mode),
          ...(withBackgroundImage ? editorModeBackground(mode) : {}),
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
