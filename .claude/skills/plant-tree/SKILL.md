---
name: plant-tree
description: Plant a new tree (component + VM contract) in the forest. Use when adding a NEW component whose data shape does not already exist — "add a marquee component", "new hero section", "plant a ticker". If the data shape already exists and only the LOOK is new, use open-leaf instead.
user_invocable: true
argument-hint: <species>/<tree>
---

# Plant a Tree

A **tree** is a ViewModel contract. Planting one is a commitment: every future
leaf on it renders from the type you write today. Get the contract right and the
variants are free.

## When this is the wrong skill

| Situation | Use instead |
|---|---|
| Same data, new look | `/open-leaf` |
| Same data, new *family* of looks | `/grow-branch` |
| The data shape genuinely differs | plant a new tree (you are in the right place) |

A new look that "just needs one extra field" is the trap. Adding a field to the
VM changes every existing leaf. Either the field belongs to all of them — add
it — or you are describing a different component, and it gets its own tree.

## Step 1 — Pick the species

Species already in the forest: run `pnpm forest`.

A species is a *kind* of concern, not a look. `motion` (defined by movement),
`layout` (defined by arrangement), `narrative` (defined by sequence). If the new
tree does not fit an existing one, `pnpm species <name>` first and fill in
`src/trees/<species>/species.meta.ts` honestly — a species with a vague
description becomes a junk drawer.

## Step 2 — Scaffold

```bash
pnpm plant <species>/<tree>
```

This writes, already conformant:

```
src/trees/<species>/<tree>/
  tree.meta.ts              ← label + description shown in the lab
  <tree>.vm.ts              ← THE CONTRACT
  <tree>.fixtures.ts        ← every visual state
  <tree>-connected.tsx      ← the only file allowed hooks
  branches/canon/baseline/  ← a first leaf to prove it renders
```

Add `--bare` to skip the starter branch and leaf.

## Step 3 — Shape the contract (the actual work)

Rewrite `<tree>.vm.ts`. Non-negotiable, from the extract-vm skill:

- **Every displayed value is a pre-formatted string.** No `number`, `Date` or
  `bigint` that a leaf would have to format. `"18.25 USDC"`, not `18250000n`.
- **Every action is a callback.** Passive/animated trees legitimately have none —
  do not invent `onClick` handlers a ticker will never fire.
- **Transport is a prop.** `progress: number` in 0..1. The container owns the
  clock; fixtures freeze it. This is what makes an animation testable.
- **`reducedMotion: boolean`.** Every motion tree carries it, and every leaf
  honours it.
- **Explicit state strings.** `state: "idle" | "active" | "empty"`, never a
  derived `items.length > 0 && !loading` check inside a leaf.
- **Option lists are pre-formatted** — `{ value, label }[]`, not API rows.
- **No hooks, no fetches, no `window`** in this file. The conformance test
  enforces this.

Put pure helpers (clamps, state resolvers, label maps) in the same file. They
run in the container or in fixtures — never in a leaf.

## Step 4 — Fixtures before pixels

Fill `<tree>.fixtures.ts` **before** styling anything. Target 8+ (15–20 for
complex trees), covering:

- idle / active / empty
- 3+ frozen instants along the transport (early, mid, late)
- `reducedMotion: true`
- the content that breaks layouts: long headline, 12 items, missing eyebrow/CTA/body

Keep `ALL_FIXTURES` and `DEFAULT_FIXTURE` exported — the lab and the conformance
test both read them.

Every fixture must be survivable by every future leaf. A fixture nobody can
render is a contract bug, not a styling bug.

## Step 5 — Wire the container

`<tree>-connected.tsx` owns the clock, the media query, the fetch, the state.
It formats raw input into VM strings and renders whichever leaf `variant`
selects. It should read as VM assembly with no layout in it at all.

## Step 6 — Verify

```bash
pnpm sync && pnpm typecheck && pnpm test
```

The conformance suite renders **every leaf against every fixture** and fails on
hooks, raw `<img>`, hardcoded colors, `dark:`, `toFixed`, `toLocaleString`, and
fetches inside leaves. If it is green, the tree conforms.

Then look at it: `pnpm dev` → `/lab/<species>/<tree>`.

## Step 7 — Report

```
🌳 planted motion/aurora-headline
   contract: AuroraHeadlineVM (7 props, 0 callbacks — passive tree)
   fixtures: 9
   leaves:   canon/baseline
   lab:      /lab/motion/aurora-headline
```
