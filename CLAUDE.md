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

Delegate substantial work to the `forester` agent.

## Never scaffold by hand

`pnpm plant` / `pnpm branch` / `pnpm leaf` write the conformant layout. A
hand-made folder is how drift starts. If a generated file is wrong, fix
`tools/grow/templates/` — that fixes every future component too.

## Hard rules

**Leaves** (`src/trees/*/*/branches/*/*/*.tsx`): no hooks, no `fetch`, no raw
`<img>`, no `dark:`, no hardcoded colors, no formatting of VM values. Semantic
tokens only. Switch on `vm.state`. Honour `vm.reducedMotion`.

**VMs** (`*.vm.ts`): pre-formatted strings only, actions as callbacks, transport
(`progress`) as a prop, zero side effects.

**Fixtures** (`*.fixtures.ts`): export `ALL_FIXTURES` + `DEFAULT_FIXTURE`, 8+
entries covering empty / long copy / many items / missing optionals / reduced
motion / frozen instants.

**Only `*-connected.tsx`** may hold hooks, clocks, media queries or fetches.

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
