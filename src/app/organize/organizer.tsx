"use client";

/**
 * The organizer — a programmable single-page organization panel.
 *
 * Drag a section onto a tab. That is the whole interaction, and everything else
 * on this screen exists to make its result immediately visible: the board on
 * top says what goes where, the preview underneath is the real page, rendered
 * through the real container, with the real chrome and the real transition.
 *
 * ── Where the state is allowed to be ───────────────────────────────────────
 * Here, and nowhere below. This file holds the layout, the drag session and the
 * persistence. `SectionTabsConnected` derives a VM from what it is handed, and
 * the leaves are pure. Nothing about "which tab am I on" leaks into a section —
 * a section does not know it has been tabularized, which is the property that
 * makes any of them draggable in the first place.
 *
 * ── Why the rules are not in the drag handlers ─────────────────────────────
 * Every mutation goes through a pure function in `src/lib/section-layout.ts`.
 * The handlers below translate a drop into (sectionId, container, index) and
 * hand it over. That split is why the "Move to…" select is three lines rather
 * than a second implementation of the same rules — and why a pointerless
 * visitor gets the identical behaviour instead of a degraded one.
 */

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useMemo, useState } from "react";

import { buildCatalog, indexCatalog, type CatalogSection } from "@/lib/section-catalog";
import {
  SHELF,
  addTab,
  containerOf,
  emptyLayout,
  moveSection,
  reconcile,
  removeTab,
  renameTab,
  sectionsIn,
  tabContainerId,
  type SectionLayout,
} from "@/lib/section-layout";
import { cn } from "@/lib/utils";
import { FOREST } from "@/trees/generated";
import { SectionTabsConnected } from "@/trees/chrome/section-tabs/section-tabs-connected";
import { TRANSITIONS } from "@/trees/chrome/section-tabs/section-tabs.transitions";
import { allLeaves, findTree } from "@/lib/forest";

import { SectionFull, SectionPreview } from "./section-preview";

const STORAGE_KEY = "forest.section-layout";

/**
 * Where the pointer is, not which box is nearest.
 *
 * `closestCorners` — dnd-kit's usual default — compares distances to a
 * rectangle's corners, which quietly breaks for containers: a tall empty column
 * has its corners far from the middle of itself, so dropping into the centre of
 * a column can resolve to a small card in the *next* column instead. The drop
 * looks like it lands and nothing moves.
 *
 * `pointerWithin` asks the only question a drop actually has: what is under the
 * cursor. The fallbacks cover a drag driven by the keyboard, which has no
 * pointer to be within anything.
 */
const collisionDetection: CollisionDetection = (args) => {
  const withinPointer = pointerWithin(args);
  if (withinPointer.length > 0) return withinPointer;
  const intersecting = rectIntersection(args);
  if (intersecting.length > 0) return intersecting;
  return closestCorners(args);
};

/** The starting arrangement — three named tabs and everything else on the shelf. */
function seedLayout(sectionIds: string[]): SectionLayout {
  const base = addTab(addTab(addTab(emptyLayout(), "Home", "home"), "About", "about"), "Shop", "shop");
  return reconcile({ ...base, activeTabId: "home" }, sectionIds);
}

/* ------------------------------------------------------------ draggables */

function SectionCard({
  section,
  containers,
  currentContainer,
  onMoveTo,
  dragging,
}: {
  section: CatalogSection;
  containers: Array<{ id: string; label: string }>;
  currentContainer: string;
  onMoveTo: (sectionId: string, containerId: string) => void;
  dragging?: boolean;
}) {
  const sortable = useSortable({ id: section.id });

  return (
    <li
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn(
        "group rounded-xl border border-border bg-card p-2.5",
        sortable.isDragging && "opacity-40",
        dragging && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={sortable.setActivatorNodeRef}
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label={`Drag ${section.label}`}
          className="mt-0.5 cursor-grab rounded-md px-1.5 py-1 text-muted-foreground hover:bg-accent/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
        >
          <span aria-hidden>⠿</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{section.label}</p>
          <p className="line-clamp-2 text-[0.6875rem] leading-snug text-muted-foreground">
            {section.summary}
          </p>
        </div>
      </div>

      <SectionPreview section={section} scale={0.22} className="mt-2 h-16" />

      {/*
        The pointerless path. Same pure move, same result — this is a peer of
        dragging, not a consolation prize for it.
      */}
      <label className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
        <span className="shrink-0">Move to</span>
        <select
          value={currentContainer}
          onChange={(event) => onMoveTo(section.id, event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-1.5 py-1 text-[0.6875rem] text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          {containers.map((container) => (
            <option key={container.id} value={container.id}>
              {container.label}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}

function Column({
  containerId,
  title,
  subtitle,
  sections,
  containers,
  onMoveTo,
  accent,
  scroll,
  children,
}: {
  containerId: string;
  title: React.ReactNode;
  subtitle: string;
  sections: CatalogSection[];
  containers: Array<{ id: string; label: string }>;
  onMoveTo: (sectionId: string, containerId: string) => void;
  accent?: boolean;
  /** Cap the height and scroll inside. For the shelf, which holds everything. */
  scroll?: boolean;
  children?: React.ReactNode;
}) {
  const droppable = useDroppable({ id: containerId });

  return (
    <div
      ref={droppable.setNodeRef}
      data-container={containerId}
      className={cn(
        "flex min-h-52 min-w-0 flex-col rounded-2xl border p-3 transition-colors",
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card/40",
        // The drop target has to be unmistakable while a card is in the air —
        // this is the only feedback saying "let go here".
        droppable.isOver && "border-primary bg-primary/10 ring-2 ring-primary/40",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          <p className="text-[0.6875rem] text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>

      <SortableContext
        items={sections.map((section) => section.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul
          className={cn(
            "flex flex-1 flex-col gap-2",
            scroll && "max-h-[32rem] overflow-y-auto pr-1",
          )}
        >
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              containers={containers}
              currentContainer={containerId}
              onMoveTo={onMoveTo}
            />
          ))}
          {sections.length === 0 ? (
            <li className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-primary/40 px-3 py-6 text-center text-[0.6875rem] text-muted-foreground">
              Drop a section here
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </div>
  );
}

/* ------------------------------------------------------------- organizer */

export function Organizer() {
  const catalog = useMemo(() => buildCatalog(FOREST), []);
  const byId = useMemo(() => indexCatalog(catalog), [catalog]);
  const catalogIds = useMemo(() => catalog.map((section) => section.id), [catalog]);

  const displayLeaves = useMemo(() => {
    const tree = findTree(FOREST, "chrome", "section-tabs");
    return tree ? allLeaves(tree) : [];
  }, []);

  const [layout, setLayout] = useState<SectionLayout>(() => seedLayout(catalogIds));
  const [dragging, setDragging] = useState<string | null>(null);

  /*
   * Read persisted state AFTER mount, never during the first render — the
   * server cannot know what is in localStorage, and seeding from it would be a
   * hydration mismatch. Reconciling on the way in is what keeps a stale entry
   * from rendering tabs full of sections that no longer exist.
   */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      setLayout(reconcile(JSON.parse(raw) as SectionLayout, catalogIds));
    } catch {
      // A corrupt entry is not worth failing the page over.
    }
  }, [catalogIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Private mode / quota. It works, it just will not remember.
    }
  }, [layout]);

  const sensors = useSensors(
    // A small activation distance keeps a click on the handle from registering
    // as a one-pixel drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const containers = useMemo(
    () => [
      { id: SHELF, label: "Unassigned" },
      ...layout.tabs.map((tab) => ({ id: tabContainerId(tab.id), label: tab.label })),
    ],
    [layout.tabs],
  );

  const resolve = useCallback(
    (ids: string[]) => ids.map((id) => byId.get(id)).filter((s): s is CatalogSection => Boolean(s)),
    [byId],
  );

  const onMoveTo = useCallback((sectionId: string, containerId: string) => {
    setLayout((current) => moveSection(current, sectionId, containerId, -1));
  }, []);

  const onDragStart = useCallback((event: DragStartEvent) => {
    setDragging(String(event.active.id));
  }, []);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    setDragging(null);
    const { active, over } = event;
    if (!over) return;

    const sectionId = String(active.id);
    const overId = String(over.id);

    setLayout((current) => {
      // `over` is either a column (dropped on empty space) or another card
      // (dropped onto a position). Both resolve to the same (container, index).
      const isContainer = overId === SHELF || overId.startsWith("tab:");
      const targetContainer = isContainer ? overId : containerOf(current, overId);
      if (!targetContainer) return current;

      const index = isContainer ? -1 : sectionsIn(current, targetContainer).indexOf(overId);
      return moveSection(current, sectionId, targetContainer, index);
    });
  }, []);

  const draggingSection = dragging ? byId.get(dragging) : undefined;

  /* The live preview's input. Empty tabs are kept: seeing a tab you have not
   * filled yet is the point of having made it. */
  const previewTabs = useMemo(
    () =>
      layout.tabs.map((tab) => {
        const sections = resolve(tab.sectionIds);
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
          emptyLabel: "Drag a section into this tab to fill it.",
          content:
            sections.length > 0 ? (
              <div className="flex flex-col gap-10">
                {sections.map((section) => (
                  <SectionFull key={section.id} section={section} />
                ))}
              </div>
            ) : null,
        };
      }),
    [layout.tabs, resolve],
  );

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------------- toolbar */}
      <section className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-card/50 p-4">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium">Tab chrome</span>
          <select
            value={layout.display}
            onChange={(event) => setLayout((c) => ({ ...c, display: event.target.value }))}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {displayLeaves.map((leaf) => (
              <option key={leaf.ref} value={leaf.ref}>
                {leaf.meta.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium">Transition</span>
          <select
            value={layout.transition}
            onChange={(event) => setLayout((c) => ({ ...c, transition: event.target.value }))}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {Object.values(TRANSITIONS).map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium">Duration · {layout.durationMs}ms</span>
          <input
            type="range"
            min={0}
            max={900}
            step={20}
            value={layout.durationMs}
            onChange={(event) =>
              setLayout((c) => ({ ...c, durationMs: Number(event.target.value) }))
            }
            className="w-40 accent-primary"
          />
        </label>

        <p className="min-w-48 flex-1 text-xs text-muted-foreground">
          {TRANSITIONS[layout.transition]?.description}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLayout((c) => addTab(c))}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Add tab
          </button>
          <button
            type="button"
            onClick={() => setLayout(seedLayout(catalogIds))}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Reset
          </button>
        </div>
      </section>

      {/* --------------------------------------------------------- board */}
      <DndContext
        /*
         * A stable id. Without it dnd-kit counts its own instances to generate
         * the `aria-describedby` it puts on every handle, and the server and
         * the client arrive at different numbers — a hydration mismatch React
         * reports but does not repair.
         */
        id="organizer-board"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(15rem,18rem)_1fr]">
          <Column
            containerId={SHELF}
            title="Unassigned"
            subtitle="Every leaf in the forest"
            scroll
            sections={resolve(layout.shelf)}
            containers={containers}
            onMoveTo={onMoveTo}
          />

          <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {layout.tabs.map((tab) => (
              <Column
                key={tab.id}
                accent
                containerId={tabContainerId(tab.id)}
                subtitle={`${tab.sectionIds.length} section${tab.sectionIds.length === 1 ? "" : "s"}`}
                sections={resolve(tab.sectionIds)}
                containers={containers}
                onMoveTo={onMoveTo}
                title={
                  <input
                    value={tab.label}
                    onChange={(event) =>
                      setLayout((c) => renameTab(c, tab.id, event.target.value))
                    }
                    aria-label={`Rename ${tab.label}`}
                    className="w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground hover:border-border focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  />
                }
              >
                <button
                  type="button"
                  onClick={() => setLayout((c) => removeTab(c, tab.id))}
                  aria-label={`Delete ${tab.label} — its sections return to Unassigned`}
                  className="shrink-0 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  ✕
                </button>
              </Column>
            ))}
          </div>
        </div>

        {/*
          The overlay is what follows the cursor. Without it the card animates
          back to its origin on every drop and the whole board feels like it
          rejected you.
        */}
        <DragOverlay>
          {draggingSection ? (
            <div className="w-64 rounded-xl border border-primary bg-card p-2.5 shadow-xl ring-2 ring-primary/30">
              <p className="truncate text-xs font-semibold text-foreground">
                {draggingSection.label}
              </p>
              <SectionPreview section={draggingSection} scale={0.22} className="mt-2 h-16" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ------------------------------------------------------- preview */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Live result</h2>
          <p className="text-xs text-muted-foreground">
            The real container, the real chrome, the real sections.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/30 p-5">
          {previewTabs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No tabs yet — add one and drag a section into it.
            </p>
          ) : (
            <SectionTabsConnected
              id="organizer"
              variant={layout.display}
              transition={layout.transition}
              durationMs={layout.durationMs}
              scrollable
              heading="Your page"
              ariaLabel="Your page sections"
              tabs={previewTabs}
              activeId={layout.activeTabId ?? undefined}
              onActiveChange={(id) => setLayout((c) => ({ ...c, activeTabId: id }))}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default Organizer;
