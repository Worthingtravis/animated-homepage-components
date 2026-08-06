---
name: grow-branch
description: Grow a new branch (aesthetic direction) on an existing tree. Use when a proposed variant does not belong with any existing family of looks — "we need a brutalist set", "a print-inspired direction". A branch holds leaves; it is not itself renderable.
user_invocable: true
argument-hint: <species>/<tree>/<branch>
---

# Grow a Branch

A **branch** is an aesthetic direction on a tree. It groups leaves that share a
point of view. It holds no code — just `branch.meta.ts` and the leaves under it.

## The one rule

**A branch never changes the contract.** Every leaf on every branch of a tree
consumes the same VM. If a direction needs different data, it is a new **tree**
(`/plant-tree`), not a new branch. This is the invariant that keeps every leaf
drop-in swappable, and it is the whole reason the folder layout looks like this.

## When to grow one vs. just adding a leaf

Grow a branch when you can finish this sentence with something a *set* of leaves
would share: "leaves here all ___."

- ✅ "…are restrained enough to ship without design review" → `canon`
- ✅ "…are loud and allowed to be too much" → `experimental`
- ✅ "…are print-inspired: rules, serifs, no gradients" → `editorial`
- ❌ "…are the compact one" → that is a single leaf, not a branch

Two or three branches per tree is healthy. A branch per leaf means the branch
layer is doing nothing.

## Do it

```bash
pnpm forest                                   # see existing branches first
pnpm branch <species>/<tree>/<branch>
```

Then write `branch.meta.ts` properly:

```ts
export const meta: BranchMeta = {
  label: "Editorial",
  description: "Print-inspired: rules, serif display type, no gradients.",
};
```

The description is the brief for every future leaf on this branch. Vague
descriptions produce vague leaves.

## Then

A branch with no leaves is reported as a problem by `pnpm sync`. Open the first
one immediately: `/open-leaf <species>/<tree>/<branch> <leaf>`.

## Report

```
🌿 grew motion/aurora-headline/editorial
   brief: print-inspired — rules, serif display type, no gradients
   next: pnpm leaf motion/aurora-headline/editorial <leaf-name>
```
