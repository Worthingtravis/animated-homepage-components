# CLAUDE.md

Curation repo for animated homepage components. Every component conforms to the
**extract-vm** pattern. Read `README.md` for the full vocabulary.

## The invariant you are protecting

> Any leaf on a tree can replace any other leaf on that tree, with no other change.

It holds only because leaves own nothing. The first `useState` in a leaf ends it.

## Route the request before touching anything

| Request | Action |
|---|---|
| New component / new data shape | `/plant-tree <species>/<tree>` |
| New *family* of looks on an existing tree | `/grow-branch <species>/<tree>/<branch>` |
| New look, same data | `/open-leaf <species>/<tree>/<branch> <leaf>` |
| Move a component into a consuming app | `/harvest` |
| Put existing sections behind tabs | use `chrome/section-tabs` — do NOT build tabs into the section |

Delegate substantial work to the `forester` agent.

## Never scaffold by hand

`pnpm plant` / `pnpm branch` / `pnpm leaf` write the conformant layout. A
hand-made folder is how drift starts. If a generated file is wrong, fix
`tools/grow/templates/` — that fixes every future component too.

## Hard rules

**Leaves** (`src/trees/*/*/branches/*/*/*.tsx`): no hooks, no `fetch`, no raw
`<img>`, no `dark:`, no hardcoded colors, no formatting of VM values. Semantic
tokens only. Switch on `vm.state`. Honour `vm.reducedMotion`.

**Editor mode** (`src/lib/editor-mode.ts`): the ONE surface that decides how
every variant looks, mirroring laughingwhales.com's creator page. It is
**ambient CSS on a wrapper, never a VM field** — a leaf participates by being
styled in the tokens the wrapper moves, not by taking a prop. Never add a
`theme` field to a VM; never invent a `--my-component-accent` variable.

A creator can move exactly five things: `--primary`, `--primary-foreground`
(derived, never stored), `--accent`, `--ring`, `--background`, plus the font.
So every leaf must reach for `primary`/`accent`/`ring` somewhere — a leaf
styled purely in `card`/`border`/`muted`/`foreground` is not neutral, it is
**deaf to the creator**, and it fails silently because nothing crashes. A
primary fill is always `bg-primary` + `text-primary-foreground`; `bg-foreground`
and `text-background` are banned.

**VMs** (`*.vm.ts`): pre-formatted strings only, actions as callbacks, transport
(`progress`) as a prop, zero side effects.

**Fixtures** (`*.fixtures.ts`): export `ALL_FIXTURES` + `DEFAULT_FIXTURE`, 8+
entries covering empty / long copy / many items / missing optionals / reduced
motion / frozen instants. Also export `frameAt(progress)` — a pure sampler
returning a coherent VM at any instant, deriving through the same `.vm.ts`
helpers the container uses. Frozen fixtures are samples of it; the lab's clock
drives it.

**Section tabs** (`chrome/section-tabs`): the tree that holds other trees. Three
axes stay separate — sections behind a tab (an input), chrome (a **leaf**), and
motion (a **transition preset** in `section-tabs.transitions.ts`). Never fuse
them: no `orientation` prop on a leaf, no transition name a leaf switches on. A
preset is a pure `(phase, progress, direction) => CSSProperties`; the container
resolves it into `panel.motion.style` and a leaf only spreads it. Reduced motion
is handled in `resolveMotion`, before the preset runs — never inside a preset.

**shadcn/Radix** (`src/components/ui/`): exported bare, unstyled — the look is
the leaf's job. Always use them CONTROLLED, with open state and value from the
VM, so no state crosses into a leaf. Radix owns the aria ids it generates; do
not stamp `tab.triggerId` over them.

**Only `*-connected.tsx`** may hold hooks, clocks, media queries or fetches.
The organizer (`src/app/organize/`) is app-layer and may hold state, but every
layout mutation must go through a pure function in `src/lib/section-layout.ts`.

Deriving inline from `vm.progress`, inline styles for animated transforms, and
`data-*` layout attributes are all allowed.

## `src/trees/generated.ts` is generated

Never edit it. It is rebuilt from the folder layout by `pnpm sync`, which runs
automatically before `dev`, `build` and `test`.

## Finish every change with

```bash
pnpm sync && pnpm typecheck && pnpm test
```

The conformance suite renders every leaf against every fixture. Do not report
done before it is green.

## When a leaf fails a fixture

The fixture is usually right and the leaf is usually wrong. Only change a
fixture when you can name the real input it was misrepresenting — and then
re-run every leaf on that tree, because you just changed their shared contract.
