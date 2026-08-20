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
              Full-bleed on purpose. Width is a decision each page makes — see
              `page-shell.tsx` — because the lab puts a rail in the gutter
              beside a column that prose pages still want narrowed. The header
              spans the widest of those shells, so the rail's left edge and the
              brand line up.
            */}
            <main className="w-full px-6 py-10">{children}</main>
          </EditorModeShell>
        </EditorModeProvider>
      </body>
    </html>
  );
}
