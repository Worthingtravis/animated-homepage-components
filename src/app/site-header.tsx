"use client";

/**
 * The site header.
 *
 * A client component for exactly one reason: it lights the room you are in, and
 * which room that is comes from the path. Everything else about it — which
 * links exist, what they are called — is `HEADER_LINKS`, and it does not grow
 * with the forest. Species and trees are navigation one level in, on the lab
 * rail, where a list that keeps arriving has room to.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HEADER_LINKS, HOME_HREF, isActivePath } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

import { ConiferMark } from "./conifer-mark";

/*
 * Vertical padding on an INLINE link grows the hit area without growing the
 * line box, so these clear the 24px target floor the rest of the system is
 * held to and the header row does not move by a pixel.
 */
const HEADER_LINK =
  "py-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function SiteHeader() {
  const pathname = usePathname() ?? HOME_HREF;

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex w-full max-w-[120rem] items-baseline gap-6 px-6 py-4">
        <Link
          href={HOME_HREF}
          aria-current={isActivePath(pathname, HOME_HREF) ? "page" : undefined}
          className={cn(HEADER_LINK, "text-sm font-semibold text-foreground")}
        >
          <ConiferMark className="mr-1.5 inline-block size-3.5 align-[-0.15em]" />
          the forest
        </Link>
        {HEADER_LINKS.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                HEADER_LINK,
                "ml-auto text-sm text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActivePath(pathname, link.href) ? "page" : undefined}
              className={cn(
                HEADER_LINK,
                "text-sm transition-colors",
                isActivePath(pathname, link.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
