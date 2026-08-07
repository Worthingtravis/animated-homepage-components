"use client";

/**
 * The app shell — puts the editor mode on the air for EVERY route.
 *
 * This wraps the whole document body, not just a preview box, because the
 * question the forest exists to answer is "what does this look like on a
 * creator's page?" and a creator's page is themed edge to edge. Chrome that
 * kept the platform's colours while the preview wore the creator's would be
 * showing a comparison nobody is ever going to see.
 */

import { CreatorSurface } from "@/lib/creator-surface";
import { useEditorMode, useGoogleFont } from "@/lib/editor-mode-context";

import { EditorDock } from "./editor-dock";

export function EditorModeShell({ children }: { children: React.ReactNode }) {
  const editor = useEditorMode();
  useGoogleFont(editor.activeMode?.fontFamily ?? null);

  return (
    <CreatorSurface
      mode={editor.activeMode}
      withBackgroundImage={editor.withBackgroundImage}
      className="min-h-dvh bg-background"
    >
      {children}
      <EditorDock />
    </CreatorSurface>
  );
}
