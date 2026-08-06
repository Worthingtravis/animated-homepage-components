---
name: open-leaf
description: Add a new visual variant (leaf) to an existing tree. Use when the data contract already exists and only the LOOK is new — "another version of the hero", "a minimal variant", "make a brutalist one". Never changes the VM.
user_invocable: true
argument-hint: <species>/<tree>/<branch> <leaf>
---

# Open a Leaf

A **leaf** is one pure presentation component. Its props ARE the tree's VM. A
leaf is interchangeable with every other leaf on the same tree — not just its
branch — because none of them own state.

## Step 1 — Read the contract, not the neighbours

```bash
pnpm forest                                  # what exists
```

Read, in this order:

1. `src/trees/<species>/<tree>/<tree>.vm.ts` — the contract you must satisfy
2. `src/trees/<species>/<tree>/<tree>.fixtures.ts` — every state you must survive
3. `src/trees/<species>/<tree>/branches/<branch>/branch.meta.ts` — the direction
4. One sibling leaf — for the *pattern*, not for the look

Read the sibling last and briefly. Copying a sibling is how a forest ends up
with five leaves that are the same leaf.

## Step 2 — Scaffold

```bash
pnpm leaf <species>/<tree>/<branch> <leaf>
```

Writes `<leaf>.tsx` (pure, typed to the VM) and `<leaf>.test.tsx` (renders every
fixture). The export name is always `Pascal(tree) + Pascal(leaf)`.

If no branch fits the direction, grow one first: `/grow-branch`.

## Step 3 — Style it

**Forbidden — the conformance suite fails the build on these:**

- `useState`, `useEffect`, `useReducer`, `useRef`, `useMemo`, `useCallback`
- `fetch`, data hooks, any import from `@/hooks`
- raw `<img>` (use `next/image`)
- `dark:` on any utility
- hardcoded colors: `text-white`, `bg-black`, `bg-slate-900`, hex literals
- `toFixed`, `toLocaleString` — the VM arrives pre-formatted

**Required:**

- semantic tokens only: `text-foreground`, `bg-card`, `border-border`,
  `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-accent`
- switch on `vm.state`, never on derived truthiness
- honour `vm.reducedMotion` — render the resting frame, do not just slow down
- render every optional field conditionally (`vm.eyebrow ? … : null`)

**Allowed and encouraged:** deriving inline from `vm.progress`
(`Math.sin(vm.progress * TAU)`), inline `style` for animated transforms and
gradients, `data-*` attributes for layout switches. That is presentation, not
business logic.

## Step 4 — Make it actually different

A leaf earns its place by being a different *answer*, not a different padding
value. Before writing, name the one structural decision that separates it from
its siblings: the type is stacked instead of centred; the motion is a fill
instead of a drift; the chips orbit instead of sit still.

If you cannot name it, you want a prop on an existing leaf, not a new leaf.

## Step 5 — Verify

```bash
pnpm test          # renders your leaf against every fixture + purity checks
pnpm typecheck
pnpm dev           # → /lab/<species>/<tree>, hit "Compare all" and "Run clock"
```

Check the leaf under: `Empty`, `Long copy`, `Many items`, `No chrome`, and
`Reduced motion`. Those four are where leaves break.

## Step 6 — Fill in the meta

Every leaf exports `meta`. Write a real one-line description — it is the tooltip
in the lab and the only thing telling the next person why this leaf exists.

## Step 7 — Report

```
🍃 opened motion/aurora-headline/experimental/orbit-glow
   distinct because: the aurora orbits the type instead of sitting behind it
   fixtures passing: 9/9
   lab: /lab/motion/aurora-headline
```
