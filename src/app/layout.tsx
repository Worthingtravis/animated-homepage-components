import type { Metadata } from "next";
import Link from "next/link";

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
        <header className="border-b border-border">
          <nav className="mx-auto flex max-w-6xl items-baseline gap-6 px-6 py-4">
            <Link href="/" className="text-sm font-semibold text-foreground">
              🌲 the forest
            </Link>
            <Link href="/lab" className="text-sm text-muted-foreground hover:text-foreground">
              lab
            </Link>
            <a
              href="https://github.com/Worthingtravis/animated-homepage-components"
              className="ml-auto text-sm text-muted-foreground hover:text-foreground"
            >
              source
            </a>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
