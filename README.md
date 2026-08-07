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
  landing/                                 ← the first screen
    channel-hero/                          ← transport is a one-shot entrance
      ...
  generated.ts                             ← registry, rebuilt from the filesystem by `pnpm sync`
```

Four reference trees ship with the repo:

- **`motion/aurora-headline`** — the minimal case. Passive, no callbacks, one
  transport value.
- **`narrative/step-reveal`** — the full case. A steerable "how it works"
  sequence: autoplay, click-to-jump and reduced motion all resolve into one
  contract, and each step arrives with its `position` (`past`/`active`/
  `upcoming`) already decided, so no leaf ever does index arithmetic. Its three
  leaves answer the same contract three structurally different ways — a rail
  that keeps every step readable, a band where the active card claims the width,
  and a stage where only one step exists at a time.
- **`landing/channel-hero`** — the portable case. A streamer's first screen:
  identity, a live/offline strip, an action row, and a "start anywhere" grid.
  Its contract is a deliberate superset of laughingwhales.com's `HomeHeroVM`, so
  `adaptHomeHero()` lifts that page's hero into this forest in one pure call —
  and the `Ported — laughingwhales home hero` fixture renders through every leaf
  in the conformance suite, which makes the portability claim a passing test
  rather than a promise.

- **`chrome/page-nav`** — the *theming* case. One nav contract covering
  laughingwhales.com's creator page tab bar and a brand · links · CTA marketing
  bar. Its two Canon track leaves are the `default` and `pill` styles the
  creator page builder already offers, so `leafForTabStyle()` maps a saved
  setting straight to a leaf ref; the other two leaves are looks that dropdown
  could not previously reach. Creator accents ride in on `vm.theme` as finished
  CSS colours — theming is data, and a leaf applies it without ever computing a
  contrast ratio.

## Porting a hero in from a consuming app

`landing/channel-hero` is the worked example. A hero VM that already exists in a
Next.js app does not have to be rewritten to enter the forest — it has to be
*lifted*:

```ts
import { adaptHomeHero } from "@/trees/landing/channel-hero/channel-hero.vm";
import { BASE } from "laughingwhales/src/app/view-models/home-hero.fixtures";

const vm = adaptHomeHero(BASE, {
  channelName: "laughingwhales",
  channelHandle: "@laughingwhales",
});
```

`adaptHomeHero` takes a *structural* type (`HomeHeroVMLike`), so this repo never
imports from the consuming app — anything shaped like that VM satisfies it. The
fields the forest adds (`status`, `progress`, `reducedMotion`) all accept a
null/zero value that renders as the static marketing hero the app already ships.
Going the other way, `/harvest` copies a leaf out; the leaf's props are the VM,
so the app supplies the same object it already had.

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

## Editor mode

One **editor mode** decides how every variant looks. It is a transcription of
laughingwhales.com's creator page builder: the same fields, the same merge
rules, the same derived values.

It lives at the **root**, not in the lab, and themes every route edge to edge —
header, index pages, lab chrome and leaves all inherit the same `--primary`.
That is deliberate: a creator page does not theme its hero differently from its
nav, so chrome that kept the platform's colours while the preview wore the
creator's would be showing a comparison nobody will ever see. Upstream tints the
owner's editor rail with the owner's own accent for the same reason.

The dock floats bottom-right on every page and persists to `localStorage`.

The important part is what it *isn't*. Editor mode is **ambient CSS variables on
a wrapper**, not a VM field:

```tsx
<div className="creator-page creator-style-default" style={cssVars}>
```

Because it is inherited CSS, a leaf needs no prop to participate — it only has
to be styled in the tokens the wrapper moves. That is what makes a harvest a
copy rather than a port: a leaf that themes correctly in the lab themes
correctly on a creator page, with no adapter in between.

A creator can move exactly five variables and a font:

| variable | from | note |
|---|---|---|
| `--primary` | `themeAccent` | the brand colour |
| `--primary-foreground` | *derived* | `readableTextOn(accent)` — never stored |
| `--accent` | `themeAccentDark` | hover / glow |
| `--ring` | `themeAccent` | focus |
| `--background` | `themeBackground` | optional; null keeps the platform's |
| `font-family` | `fontFamily` | a Google Font name, not a stack |

Everything else — `--card`, `--border`, `--muted`, `--foreground`, `--radius` —
stays at the platform's values, because upstream never sets them either. So a
leaf styled purely in neutrals is not *theme-neutral*, it is **deaf to the
creator**: it renders identically no matter what they pick, and it fails
silently because nothing crashes.

That failure is real and it is upstream right now — on laughingwhales.com every
section title header, plus all of support, FAQ, recommended and screenshots,
contains zero accent references. `conformance.test.tsx` renders all 13 leaves
against 5 presets and fails any leaf that would join them.

One preset is a trap on purpose. `readableTextOn` exists because a lime accent
(`#9CCB1A`) put white text on a primary CTA at 1.91:1 — effectively invisible.
Worth knowing: the platform's own **default pink (`#FF69B4`) needs black text
too**, so a leaf that hardcodes a light foreground breaks on a stock page.

## Desktop shortcut

```bash
pnpm review                      # start the dev server and open the forest
ROUTE=/lab PORT=3000 pnpm review # ...or a specific route/port
```

`scripts/review.sh` backs both that script and a desktop launcher
(`assets/animated-homepage-components.desktop`). It installs dependencies on
first run, starts the dev server, waits for it to actually answer, then opens a
browser. If a server is already on the port it attaches instead of starting a
second one — and in that case it leaves the existing server alone on exit.

To install the launcher on another machine:

```bash
cp assets/animated-homepage-components.desktop ~/Desktop/
chmod +x ~/Desktop/animated-homepage-components.desktop
gio set ~/Desktop/animated-homepage-components.desktop metadata::trusted true
cp assets/animated-homepage-components.desktop ~/.local/share/applications/   # menu entry
```

Edit the absolute paths in the `.desktop` file if the repo lives elsewhere. The
launcher has a secondary **Open the lab** action (right-click the icon) that
lands on `/lab` instead of the forest index.

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
