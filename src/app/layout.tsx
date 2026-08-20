import type { Metadata } from "next";

import { EditorModeProvider } from "@/lib/editor-mode-context";

import { EditorModeShell } from "./editor-mode-shell";
import { SiteHeader } from "./site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Animated Homepage Components",
  description:
    "A forest of animated homepage components — pure presentation leaves driven by shared ViewModel contracts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        {/*
          Editor mode wraps EVERYTHING — header included. A creator page is
          themed edge to edge, so chrome that kept the platform's colours while
          the preview wore the creator's would be showing a comparison nobody
          will ever see.
        */}
        <EditorModeProvider>
          <EditorModeShell>
        <SiteHeader />
        {/*
          Widths step up rather than going edge-to-edge: the lab's compare-all
          puts several leaves side by side and a full-bleed leaf (brand-bar)
          needs room to read as full-bleed, but prose on the forest index still
          has to stay a readable measure. The header uses the same steps so the
          two never drift out of alignment.
        */}
        <main className="mx-auto w-full max-w-6xl px-6 py-10 xl:max-w-[88rem] 2xl:max-w-[104rem]">
          {children}
        </main>
          </EditorModeShell>
        </EditorModeProvider>
      </body>
    </html>
  );
}
