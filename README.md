# 🌲 Animated Homepage Components

A curated forest of animated homepage components. Every component here conforms
to the **extract-vm** pattern: business logic and presentation are physically
separated, so a component's *look* can be swapped without touching a line of its
*logic*.

Used in production on [laughingwhales.com](https://laughingwhales.com) and
[yapdrop.com](https://yapdrop.com).

## The invariant

> **Any leaf on a tree can replace any other leaf on that tree, with no other change.**

That is the whole point. It holds because leaves own nothing — no state, no
fetches, no formatting — and it is enforced by a test suite, not by review.

## Vocabulary

| Term | What it is | Where it lives |
|---|---|---|
| **species** | a *kind* of tree — a family of homepage concerns | `src/trees/<species>/` |
| **tree** | one component's ViewModel **contract** | `src/trees/<species>/<tree>/` |
| **branch** | an aesthetic direction | `.../branches/<branch>/` |
| **leaf** | one pure presentation component | `.../branches/<branch>/<leaf>/` |

You **plant a tree** for a new component, **grow a branch** for a new visual
direction, and **open a leaf** for each individual variant. Types of trees are
separated by species.

## Layout

The folder structure *is* the architecture. The VM, the fixtures and the
container sit at the tree; leaves sit three levels down. A leaf cannot own state
even by accident, because everything stateful is physically outside it.

```
src/trees/
  motion/                                  ← species
    species.meta.ts
    aurora-headline/                       ← tree — owns the contract
      tree.meta.ts
      aurora-headline.vm.ts                ← THE CONTRACT (pre-formatted strings, callbacks, transport)
      aurora-headline.fixtures.ts          ← every visual state, hook-free
      aurora-headline-connected.tsx        ← the ONLY file allowed hooks
      branches/
        canon/                             ← branch — an aesthetic direction
          branch.meta.ts
          baseline/
            baseline.tsx                   ← leaf — pure presentation, props ARE the VM
            baseline.test.tsx
          stacked-rule/
        experimental/
          orbit-glow/
  narrative/                               ← a different kind of tree
    step-reveal/                           ← transport is a position in a sequence
      ...
  generated.ts                             ← registry, rebuilt from the filesystem by `pnpm sync`
```

Two reference trees ship with the repo:

- **`motion/aurora-headline`** — the minimal case. Passive, no callbacks, one
  transport value.
- **`narrative/step-reveal`** — the full case. A steerable "how it works"
  sequence: autoplay, click-to-jump and reduced motion all resolve into one
  contract, and each step arrives with its `position` (`past`/`active`/
  `upcoming`) already decided, so no leaf ever does index arithmetic. Its three
  leaves answer the same contract three structurally different ways — a rail
  that keeps every step readable, a band where the active card claims the width,
  and a stage where only one step exists at a time.

## Scaffolding

One CLI (`tools/grow/`) writes every conformant file. Never scaffold by hand.

```bash
pnpm plant   motion/aurora-headline          # plant a tree (VM + fixtures + container + first leaf)
pnpm branch  motion/aurora-headline/editorial # grow a branch
pnpm leaf    motion/aurora-headline/canon minimal   # open a leaf
pnpm species narrative                        # start a new species
pnpm forest                                   # print the forest
pnpm sync                                     # regenerate src/trees/generated.ts
```

`pnpm plant … --bare` skips the starter branch and leaf.

The templates live in `tools/grow/templates/`. If a generated file is wrong, fix
the **template** — that fixes every future component too.

## The lab

```bash
pnpm dev    # → /lab/<species>/<tree>
```

Drive every leaf on a tree through every fixture. Toggle **Compare all** to see
every variant side by side on the same data, and **Run clock** to sample the
tree's `frameAt` live instead of a frozen fixture — with compare-all on, that is
the cheapest way to catch a leaf that disagrees with its siblings about what
instant it is.

## What "conformant" means here

Enforced by `src/trees/conformance.test.tsx`, which renders **every leaf against
every fixture** and greps every source file:

**A leaf may not have** — `useState`, `useEffect`, `useReducer`, `useRef`,
`useMemo`, `useCallback`, `fetch`, data hooks, raw `<img>`, `dark:` prefixes,
hardcoded colors, or any formatting of a VM value.

**A leaf must** — take the tree's VM as its props, switch on the explicit
`vm.state`, honour `vm.reducedMotion`, and use semantic tokens only.

**A VM must** — deliver every displayed value as a pre-formatted string, expose
every action as a callback, carry animation transport as a prop, and have zero
side effects.

**Fixtures must** — export `ALL_FIXTURES` and `DEFAULT_FIXTURE`, and cover empty,
long copy, many items, missing optional fields, reduced motion, and several
frozen instants along the transport.

**Fixtures should also export `frameAt(progress)`** — a pure sampler returning a
*coherent* VM for any instant, with every derived field agreeing with every
other. Frozen fixtures are samples of it, and the lab's clock drives it. Without
it the lab can only nudge `progress`, which desyncs it from whatever the
container derives (an active index, a state string, a position label) — exactly
the bug the contract exists to prevent. Omit it only for trees with no
transport.

Deriving inline from `vm.progress` (`Math.sin(vm.progress * TAU)`), inline styles
for animated transforms, and `data-*` attributes are all fine — that is
presentation, not business logic.

## Agent skills

Agents working in this repo route through `.claude/`:

| Skill | Use when |
|---|---|
| `/plant-tree` | new component, new data shape |
| `/grow-branch` | new *family* of looks on an existing tree |
| `/open-leaf` | new look, same data |
| `/harvest` | copying a leaf into a consuming app |

The `forester` agent (`.claude/agents/forester.md`) owns `src/trees/` and routes
between them.

## Verify

```bash
pnpm verify    # sync + typecheck + test + build
```

## License

MIT
