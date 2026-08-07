import type { Metadata } from "next";
import Link from "next/link";

import { EditorModeProvider } from "@/lib/editor-mode-context";

import { EditorModeShell } from "./editor-mode-shell";
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
        <header className="border-b border-border">
          <nav className="mx-auto flex w-full max-w-6xl items-baseline gap-6 px-6 py-4 xl:max-w-[88rem] 2xl:max-w-[104rem]">
            <Link href="/" className="text-sm font-semibold text-foreground">
              🌲 the forest
            </Link>
            <Link href="/lab" className="text-sm text-muted-foreground hover:text-foreground">
              lab
            </Link>
            <Link href="/organize" className="text-sm text-muted-foreground hover:text-foreground">
              organize
            </Link>
            <a
              href="https://github.com/Worthingtravis/animated-homepage-components"
              className="ml-auto text-sm text-muted-foreground hover:text-foreground"
            >
              source
            </a>
          </nav>
        </header>
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
