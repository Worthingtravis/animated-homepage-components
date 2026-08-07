"use client";

/**
 * The lab: drive every leaf on a tree through every fixture.
 *
 * This page is the payoff of the whole layout — because leaves share one
 * contract, "compare all" is just a map over the registry. Lab state is one
 * reducer (extract-vm phase 7), never a pile of useState.
 */

import { useEffect, useReducer } from "react";
import Link from "next/link";

import { allLeaves, findTree, type LeafNode } from "@/lib/forest";
import { LAB_CYCLE_MS } from "@/lib/lab-clock";
import { cn } from "@/lib/utils";
import { FOREST } from "@/trees/generated";

/*
 * Editor mode is deliberately NOT lab state. It lives at the root
 * (`EditorModeProvider`) and themes the whole app, because a creator page is
 * themed edge to edge — see `src/app/editor-mode-shell.tsx`. This component
 * owns only what is genuinely about driving one tree.
 */
type LabState = {
  fixture: string;
  leafRef: string;
  compareAll: boolean;
  /** When on, the lab drives `progress` itself instead of using the frozen value. */
  live: boolean;
  progress: number;
};

type LabAction =
  | { type: "select_fixture"; fixture: string }
  | { type: "select_leaf"; leafRef: string }
  | { type: "toggle_compare" }
  | { type: "toggle_live" }
  | { type: "tick"; progress: number }
  | { type: "reset"; initial: LabState };

function labReducer(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case "select_fixture":
      return { ...state, fixture: action.fixture };
    case "select_leaf":
      return { ...state, leafRef: action.leafRef, compareAll: false };
    case "toggle_compare":
      return { ...state, compareAll: !state.compareAll };
    case "toggle_live":
      return { ...state, live: !state.live };
    case "tick":
      return { ...state, progress: action.progress };
    case "reset":
      return action.initial;
  }
}

/** Shared with any tree whose `frameAt` needs to match the lab's rate. */
const CYCLE_MS = LAB_CYCLE_MS;

export function TreeLab({ species, treeKey }: { species: string; treeKey: string }) {
  const tree = findTree(FOREST, species, treeKey);
  const leaves = tree ? allLeaves(tree) : [];

  const initial: LabState = {
    fixture: tree?.defaultFixture ?? "",
    leafRef: leaves[0]?.ref ?? "",
    compareAll: false,
    live: false,
    progress: 0,
  };
  const [state, dispatch] = useReducer(labReducer, initial);

  useEffect(() => {
    if (!state.live) return;
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      dispatch({ type: "tick", progress: ((now - start) % CYCLE_MS) / CYCLE_MS });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.live]);

  if (!tree) return <p className="text-muted-foreground">Unknown tree.</p>;

  const baseVm = (tree.fixtures[state.fixture] ?? {}) as Record<string, unknown>;
  // With `frameAt`, the clock samples a coherent frame. Without it, we can only
  // move `progress` and leave the rest of the fixture as-is.
  const vm = state.live
    ? ((tree.frameAt?.(state.progress) as Record<string, unknown>) ?? {
        ...baseVm,
        progress: state.progress,
      })
    : baseVm;
  const shown: LeafNode[] = state.compareAll
    ? leaves
    : leaves.filter((leaf) => leaf.ref === state.leafRef);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link href="/lab" className="text-xs text-muted-foreground hover:text-foreground">
          ← lab
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{tree.meta.label}</h1>
        <p className="text-muted-foreground">{tree.meta.description}</p>
        <p className="font-mono text-xs text-muted-foreground">
          src/trees/{tree.species}/{tree.key}/
        </p>
      </header>

      <section aria-label="Fixtures" className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Fixture
          {/* With frameAt driving, the fixture is not what is on screen. Say so. */}
          {state.live && tree.frameAt ? (
            <span className="ml-3 normal-case tracking-normal">
              — overridden while the clock runs
            </span>
          ) : null}
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(tree.fixtures).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={state.fixture === name}
              onClick={() => dispatch({ type: "select_fixture", fixture: name })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                state.fixture === name
                  ? "border-ring bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Leaves" className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Leaf
        </h2>
        <div className="flex flex-wrap gap-2">
          {leaves.map((leaf) => (
            <button
              key={leaf.ref}
              type="button"
              aria-pressed={!state.compareAll && state.leafRef === leaf.ref}
              onClick={() => dispatch({ type: "select_leaf", leafRef: leaf.ref })}
              title={leaf.meta.description}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                !state.compareAll && state.leafRef === leaf.ref
                  ? "border-ring bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {leaf.meta.label}
              <span className="ml-2 font-mono text-xs opacity-70">{leaf.ref}</span>
            </button>
          ))}
          <button
            type="button"
            aria-pressed={state.compareAll}
            onClick={() => dispatch({ type: "toggle_compare" })}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              state.compareAll
                ? "border-ring bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            Compare all
          </button>
          <button
            type="button"
            aria-pressed={state.live}
            onClick={() => dispatch({ type: "toggle_live" })}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              state.live
                ? "border-ring bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {state.live ? "Pause clock" : "Run clock"}
            {tree.frameAt ? null : <span className="ml-2 text-xs opacity-70">(progress only)</span>}
          </button>
        </div>
      </section>

      {/*
        No surface here — the whole app is already inside one. Every leaf below
        inherits the same `--primary` the header and the dock are wearing, which
        is exactly the arrangement a creator page has.
      */}
      <section
        aria-label="Preview"
        className={cn("grid gap-6", state.compareAll ? "xl:grid-cols-2" : "grid-cols-1")}
      >
        {shown.map((leaf) => {
          const { Component } = leaf;
          return (
            <figure key={leaf.ref} className="space-y-2">
              <figcaption className="flex items-baseline justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{leaf.meta.label}</span>
                <span className="font-mono">{leaf.ref}</span>
              </figcaption>
              <Component {...vm} />
            </figure>
          );
        })}
      </section>
    </div>
  );
}
