"use client";

/**
 * A page, rendered in whatever shape the curator left it.
 *
 * `/` and `/lab` each mount one of these around the content they ship with.
 * If nobody has arranged that surface, the children render and this component
 * is a no-op with a footnote. If somebody has, the same sections come back
 * behind `chrome/section-tabs` — the real container, the real chrome leaf, the
 * real transition — and the children are not rendered at all.
 *
 * ── Why the shipped design is the child and not a fallback branch ──────────
 * Passing it in means the server renders it, the static export contains it, and
 * a visitor with no stored layout gets the full page in the first byte. The
 * curated form can only ever be an upgrade applied after hydration, which is
 * also why an unreadable localStorage entry degrades to "the site as shipped"
 * rather than to an empty tab bar.
 *
 * Nothing below knows it is inside a tab. A section does not gain a prop, and
 * the sections themselves are resolved by id through the same `SectionFull` the
 * organizer's drag cards use.
 */

import Link from "next/link";
import { type ReactNode } from "react";

import { findSurface, type SurfaceId } from "@/lib/site-layout";
import { SectionTabsConnected } from "@/trees/chrome/section-tabs/section-tabs-connected";

import { SectionFull } from "./section-render";
import { useSiteLayout } from "./site-layout-provider";

export function CuratedSurface({
  surface,
  heading,
  ariaLabel,
  children,
}: {
  surface: SurfaceId;
  /** The tab strip's heading. Not the page's — the page keeps its own <h1>. */
  heading: string;
  ariaLabel: string;
  /** What this page renders when nobody has curated it. */
  children: ReactNode;
}) {
  const { layoutFor, curated, byId, update } = useSiteLayout();
  const meta = findSurface(surface);

  if (!curated(surface)) {
    return (
      <div className="space-y-8">
        {children}
        <p className="text-xs text-muted-foreground">
          This page is uncurated.{" "}
          <Link href="/organize" className="text-primary underline-offset-4 hover:underline">
            Arrange it in organize →
          </Link>
        </p>
      </div>
    );
  }

  const layout = layoutFor(surface);
  const tabs = layout.tabs.map((tab) => {
    const sections = tab.sectionIds
      .map((id) => byId.get(id))
      .filter((section): section is NonNullable<typeof section> => Boolean(section));

    return {
      id: tab.id,
      label: tab.label,
      badge: sections.length > 0 ? String(sections.length) : null,
      hint: sections[0]?.treeLabel ?? "Empty",
      summary:
        sections.length > 0
          ? sections.map((section) => section.label).join(" · ")
          : "Nothing in this tab yet.",
      sectionCount: sections.length,
      emptyLabel: "Nothing here yet — drop a section into this tab in organize.",
      content:
        sections.length > 0 ? (
          <div className="flex flex-col gap-10">
            {sections.map((section) => (
              <SectionFull key={section.id} section={section} />
            ))}
          </div>
        ) : null,
    };
  });

  return (
    <div className="space-y-4">
      <SectionTabsConnected
        id={`surface-${surface}`}
        variant={layout.display}
        transition={layout.transition}
        durationMs={layout.durationMs}
        scrollable
        heading={heading}
        ariaLabel={ariaLabel}
        tabs={tabs}
        activeId={layout.activeTabId ?? undefined}
        onActiveChange={(id) => update(surface, (current) => ({ ...current, activeTabId: id }))}
      />
      <p className="text-xs text-muted-foreground">
        {meta.label} is curated.{" "}
        <Link href="/organize" className="text-primary underline-offset-4 hover:underline">
          Rearrange it →
        </Link>
      </p>
    </div>
  );
}
