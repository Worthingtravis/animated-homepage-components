# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two users share one surface, and neither is a stranger.

**Travis (curator/author).** Works in this repo to plant trees, open leaves, and
decide which variant gets harvested into a consuming app
(laughingwhales.com, yapdrop.com). Uses the lab to see a leaf against every
fixture and against the clock before trusting it in production.

**Coding agents (forester, Claude Code).** The repo is a machine-readable
contract surface first: the folder layout *is* the architecture, `FOREST` is the
registry, and the conformance suite is the enforcement. Agents plant, grow, and
audit; the rendered site is the human check on their work.

Outside developers reading the public repo are a real but secondary audience —
the README and `narrative/forest-primer` serve them. No design decision here is
made for them at the expense of the two primary users.

## Product Purpose

A curated forest of animated homepage components in which a component's *look*
can be replaced without touching a line of its *logic*. Success is the invariant
holding under test:

> Any leaf on a tree can replace any other leaf on that tree, with no other change.

Every component conforms to **extract-vm**: a `*.vm.ts` contract of
pre-formatted strings, callbacks, and transport; hook-free `*.fixtures.ts`; a
single `*-connected.tsx` that may hold hooks; and pure presentation leaves three
levels down where state cannot reach them even by accident.

## Positioning

The separation is enforced by a test suite, not by convention. The conformance
suite renders every leaf against every fixture, which turns claims into passing
tests: `landing/channel-hero` carries a fixture ported from laughingwhales.com's
real `HomeHeroVM`, so portability is a green test rather than a promise, and
`forest-primer.derived.test.ts` pins the primer's own numbers to what the
repository actually contains.

The second, less common position: **theming is ambient CSS, never data.** A leaf
participates in a creator's brand by being *styled in the tokens the wrapper
moves*, not by taking a `theme` prop. That is what makes a harvest a copy rather
than a port.

## Operating Context

- Next.js 15 / React 19 / Tailwind v4, pnpm, deployed static to Cloudflare.
- Scaffolding is generated, never hand-made: `pnpm plant` / `branch` / `leaf`
  write the conformant layout from `tools/grow/templates/`. A wrong generated
  file is fixed in the template, which fixes every future component.
- `src/trees/generated.ts` is rebuilt from the filesystem by `pnpm sync`, which
  runs before `dev`, `build`, and `test`.
- Every change ends with `pnpm sync && pnpm typecheck && pnpm test`.
- The lab (`/lab/[species]/[tree]`) drives leaves with a shared clock through
  `frameAt(progress)`; frozen fixtures are samples of that same sampler.
- Slash-command routing is part of the workflow: `/plant-tree`, `/grow-branch`,
  `/open-leaf`, `/harvest`, with substantial work delegated to the `forester`
  agent.

## Capabilities and Constraints

Twelve trees across seven species (`motion`, `narrative`, `landing`, `temporal`,
`disclosure`, `chrome`, `commerce`, `finding`), 40 leaves.

Hard constraints, all four confirmed as immovable product truth:

1. **The leaf invariant.** Leaves own nothing — no hooks, no `fetch`, no raw
   `<img>`, no `dark:`, no hardcoded colors, no formatting of VM values. The
   first `useState` in a leaf ends it.
2. **Editor-mode fidelity.** `src/lib/editor-mode.ts` mirrors laughingwhales.com's
   `resolveTheme` field for field. A creator moves exactly five things —
   `--primary`, `--primary-foreground` (derived, never stored), `--accent`,
   `--ring`, `--background` — plus the font. Every leaf must reach for
   `primary`/`accent`/`ring` somewhere; a leaf styled purely in
   `card`/`border`/`muted` is deaf to the creator and fails silently.
3. **A leaf measures its own box, never the window.** Every root a leaf can
   render carries `@container`; every breakpoint is a container query. `sm:` /
   `md:` / `lg:` fail the suite. The one exception is a `fixed` viewport overlay,
   which really is the window.
4. **Navigation is derived, never configured.** `src/lib/site-nav.ts` is pure
   functions from `FOREST`. If a link is not derivable from the folder layout,
   it does not belong in the nav.

Also binding: shadcn/Radix primitives are exported bare and always used
controlled; `chrome/section-tabs` keeps sections, chrome, and motion on three
separate axes; VMs hold zero side effects.

## Brand Commitments

- Name and metaphor: the forest — species / tree / branch / leaf. The vocabulary
  is load-bearing, not decoration: it names the folder layout, the CLI verbs, and
  the slash commands.
- Voice in docs and commit messages is declarative and slightly aphoristic
  ("A leaf measures its own box, not the window").
- MIT licensed, public, in production on laughingwhales.com and yapdrop.com.

## Evidence on Hand

- 12 trees, 40 leaves, all rendered by `src/trees/conformance.test.tsx`.
- `landing/channel-hero`'s `Ported — laughingwhales home hero` fixture and
  `adaptHomeHero()`.
- `narrative/forest-primer` and its `derived.test.ts`.
- Semantic token set in `src/app/globals.css` (light + `prefers-color-scheme`
  dark), exposed to Tailwind via `@theme inline`.
- `src/lib/editor-mode-presets.ts` and the editor dock.

No testimonials, benchmarks, pricing, or user counts exist. Future work must not
invent them.

## Product Principles

1. **The folder layout is the architecture.** If a fact can be derived from
   disk, deriving it is not an optimization — it is the only correct source.
2. **Enforce by suite, not by review.** A rule nobody can break accidentally is
   a test; a rule in a document is a wish.
3. **A leaf owns nothing.** Everything stateful lives physically outside it.
4. **Theming is ambient, never a prop.** Participation is a styling choice, not
   a data-flow problem.
5. **Silent failure is the enemy.** Viewport prefixes and creator-deaf palettes
   both crash nothing — so both get a detector.

## Accessibility & Inclusion

`vm.reducedMotion` is part of every contract and honoured by every leaf; a
global `prefers-reduced-motion` rule in `globals.css` backstops it. Radix owns
the aria ids it generates and they are never overwritten. No external standard
(WCAG level, VPAT) has been committed to.
