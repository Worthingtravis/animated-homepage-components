/**
 * The section layout — what the organizer edits.
 *
 * A layout is the answer to one question: *which sections live behind which
 * tab, in what order*. It is deliberately a plain, serialisable value with no
 * React in it — a list of tab groups, a shelf of unassigned sections, and the
 * two choices that make the result modular (which chrome, which transition).
 *
 * ── Why this file is pure ──────────────────────────────────────────────────
 * Everything here is a function from a layout to a new layout. No state, no
 * storage, no DOM. That is what lets the organizer's drag-and-drop be a thin
 * shell: a drag ends, one of these runs, and the result is both what renders
 * and what gets persisted. There is no second copy of the rules living inside
 * an event handler.
 *
 * It also means the interesting behaviour — a tab deleted while it is active, a
 * section dropped onto the tab it already belongs to, a layout loaded from
 * storage that references a section that no longer exists — is testable without
 * mounting anything.
 */

/** The shelf is a container too. Naming it keeps every move one code path. */
export const SHELF = "shelf";

export type TabGroup = {
  id: string;
  label: string;
  /** Section ids, in the order they render inside the tab's panel. */
  sectionIds: string[];
};

export type SectionLayout = {
  tabs: TabGroup[];
  /** Sections not assigned to any tab yet. */
  shelf: string[];
  activeTabId: string | null;
  /** `"<branch>/<leaf>"` — which chrome renders the tabs. */
  display: string;
  /** A preset name from `section-tabs.transitions.ts`. */
  transition: string;
  durationMs: number;
};

/** A drop target: the shelf, or one tab. */
export type ContainerId = typeof SHELF | string;

export function tabContainerId(tabId: string): string {
  return `tab:${tabId}`;
}

export function parseContainerId(containerId: string): { kind: "shelf" } | { kind: "tab"; tabId: string } {
  if (containerId === SHELF) return { kind: "shelf" };
  return { kind: "tab", tabId: containerId.startsWith("tab:") ? containerId.slice(4) : containerId };
}

/* --------------------------------------------------------------- reads */

export function containerOf(layout: SectionLayout, sectionId: string): string | null {
  if (layout.shelf.includes(sectionId)) return SHELF;
  const tab = layout.tabs.find((group) => group.sectionIds.includes(sectionId));
  return tab ? tabContainerId(tab.id) : null;
}

export function sectionsIn(layout: SectionLayout, containerId: string): string[] {
  const parsed = parseContainerId(containerId);
  if (parsed.kind === "shelf") return layout.shelf;
  return layout.tabs.find((group) => group.id === parsed.tabId)?.sectionIds ?? [];
}

/** Every tab that holds at least one section. The organizer previews these. */
export function filledTabs(layout: SectionLayout): TabGroup[] {
  return layout.tabs.filter((group) => group.sectionIds.length > 0);
}

/* -------------------------------------------------------------- writes */

function withContainer(
  layout: SectionLayout,
  containerId: string,
  next: string[],
): SectionLayout {
  const parsed = parseContainerId(containerId);
  if (parsed.kind === "shelf") return { ...layout, shelf: next };
  return {
    ...layout,
    tabs: layout.tabs.map((group) =>
      group.id === parsed.tabId ? { ...group, sectionIds: next } : group,
    ),
  };
}

/**
 * Move a section to `toIndex` in `toContainer`, removing it from wherever it
 * was. Reordering inside one container and moving between two are the same
 * operation, which is why a drag never has to decide which it is doing.
 *
 * `toIndex` of `-1` (or past the end) appends.
 */
export function moveSection(
  layout: SectionLayout,
  sectionId: string,
  toContainer: string,
  toIndex: number,
): SectionLayout {
  const from = containerOf(layout, sectionId);
  if (from === null) return layout;

  // Remove first, then insert, so an index computed against the visible list is
  // still correct when the move is within one container.
  let next = withContainer(
    layout,
    from,
    sectionsIn(layout, from).filter((id) => id !== sectionId),
  );

  const target = sectionsIn(next, toContainer).slice();
  const index = toIndex < 0 || toIndex > target.length ? target.length : toIndex;
  target.splice(index, 0, sectionId);
  next = withContainer(next, toContainer, target);

  return next;
}

let tabCounter = 0;

/**
 * Deterministic tab ids. `Date.now()` and `Math.random()` would make a layout
 * that cannot be diffed, snapshot-tested, or server-rendered without a mismatch
 * — so the caller passes an explicit id, or we count.
 */
export function nextTabId(layout: SectionLayout, explicit?: string): string {
  if (explicit) return explicit;
  const used = new Set(layout.tabs.map((group) => group.id));
  do {
    tabCounter += 1;
  } while (used.has(`tab-${tabCounter}`));
  return `tab-${tabCounter}`;
}

export function addTab(layout: SectionLayout, label?: string, id?: string): SectionLayout {
  const tabId = nextTabId(layout, id);
  const group: TabGroup = {
    id: tabId,
    label: label ?? `Tab ${layout.tabs.length + 1}`,
    sectionIds: [],
  };
  return {
    ...layout,
    tabs: [...layout.tabs, group],
    activeTabId: layout.activeTabId ?? tabId,
  };
}

/**
 * Delete a tab. Its sections go back to the shelf rather than being destroyed —
 * deleting a container should never be a way to lose work you cannot see.
 */
export function removeTab(layout: SectionLayout, tabId: string): SectionLayout {
  const group = layout.tabs.find((entry) => entry.id === tabId);
  if (!group) return layout;
  const tabs = layout.tabs.filter((entry) => entry.id !== tabId);
  return {
    ...layout,
    tabs,
    shelf: [...layout.shelf, ...group.sectionIds],
    activeTabId: layout.activeTabId === tabId ? (tabs[0]?.id ?? null) : layout.activeTabId,
  };
}

export function renameTab(layout: SectionLayout, tabId: string, label: string): SectionLayout {
  return {
    ...layout,
    tabs: layout.tabs.map((group) => (group.id === tabId ? { ...group, label } : group)),
  };
}

export function reorderTabs(layout: SectionLayout, fromIndex: number, toIndex: number): SectionLayout {
  const tabs = layout.tabs.slice();
  const [moved] = tabs.splice(fromIndex, 1);
  if (!moved) return layout;
  tabs.splice(Math.max(0, Math.min(toIndex, tabs.length)), 0, moved);
  return { ...layout, tabs };
}

/**
 * Reconcile a stored layout against the sections that actually exist now.
 *
 * A layout outlives the forest it was drawn from — leaves get renamed, trees
 * get planted. Dropping unknown ids and shelving newly-discovered ones is what
 * keeps a six-month-old localStorage entry from rendering a blank page.
 */
export function reconcile(layout: SectionLayout, knownSectionIds: readonly string[]): SectionLayout {
  const known = new Set(knownSectionIds);
  const tabs = layout.tabs.map((group) => ({
    ...group,
    sectionIds: group.sectionIds.filter((id) => known.has(id)),
  }));
  const placed = new Set([...tabs.flatMap((group) => group.sectionIds), ...layout.shelf.filter((id) => known.has(id))]);
  const shelf = [
    ...layout.shelf.filter((id) => known.has(id)),
    ...knownSectionIds.filter((id) => !placed.has(id)),
  ];
  const activeTabId =
    layout.activeTabId && tabs.some((group) => group.id === layout.activeTabId)
      ? layout.activeTabId
      : (tabs[0]?.id ?? null);
  return { ...layout, tabs, shelf, activeTabId };
}

export function emptyLayout(overrides: Partial<SectionLayout> = {}): SectionLayout {
  return {
    tabs: [],
    shelf: [],
    activeTabId: null,
    display: "canon/top-track",
    transition: "fade",
    durationMs: 280,
    ...overrides,
  };
}
