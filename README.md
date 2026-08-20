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
  temporal/                                ← time itself
    countdown/                             ← transport is depletion toward a deadline
      ...
  disclosure/                              ← one thing opening into more of itself
    expandable-card/                       ← transport is a single expansion
      expandable-card.transitions.ts       ← the morph, as pure functions of two rects
      ...
  chrome/                                  ← furniture
    section-tabs/                          ← holds OTHER trees; transport is one tab change
      section-tabs.transitions.ts          ← swappable motion presets, pure functions
      ...
  commerce/                                ← something that can be bought
    product-card/                          ← transport is one add-to-bag
      product-card.vm.ts                   ← where every price, percent and measurement is made
      ...
  generated.ts                             ← registry, rebuilt from the filesystem by `pnpm sync`
```

Ten reference trees ship with the repo:

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

- **`chrome/section-tabs`** — the *composition* case, and the only tree that
  holds other trees. It puts any section behind a tab without the section
  learning anything: panel content enters the contract as an opaque
  `ReactNode`, so a hero is tabularized by being handed over, not by gaining an
  `isActive` prop. Three axes move independently — which sections are behind
  which tab (an input), how the tabs look (a leaf), and how panels change (a
  transition preset). See **Tabs, and the three axes** below.

- **`chrome/pane-dock`** — the *budget* case. It answers one question — where do
  a workspace's CLOSED panes go? — and exists because the obvious answer is
  wrong in a way that takes months to see. Faced with "a person must be able to
  reach a pane this screen did not open for them", the natural move is to leave
  a one-click strip on the edge for each one. Every strip is individually cheap
  and individually correct; the fifth one turns the screen into a frame around a
  picture nobody can find. Its four leaves spend wildly different amounts of
  screen on the same two arrays — four edges, one rail, one row, or nothing at
  all — and `canon/edge-strips` reproduces the expensive answer faithfully so
  the case against it is something you look at rather than something you are
  told. See **Docks, and the cost of a door** below.

- **`chrome/page-nav`** — the *theming* case. One nav contract covering
  laughingwhales.com's creator page tab bar and a brand · links · CTA marketing
  bar. Its two Canon track leaves are the `default` and `pill` styles the
  creator page builder already offers, so `leafForTabStyle()` maps a saved
  setting straight to a leaf ref; the other two leaves are looks that dropdown
  could not previously reach. Creator accents ride in on `vm.theme` as finished
  CSS colours — theming is data, and a leaf applies it without ever computing a
  contrast ratio.

- **`finding/clip-picker`** — the *recognition* case. It answers "what do I send
  this streamer?", and it exists because the obvious answer — a search box and a
  grid — is a demand that the viewer already knows the words. Most do not; they
  know a feeling, a game, and roughly when. So the contract carries two ways in
  on one surface: shelves the streamer pre-established (the default state, and
  the one that has to be good) and transcript search for the viewer who does
  have the words, bridged by `suggestions` — searches the *streamer* curated,
  which turn "I can't describe it" into one tap. Sending lives on the card, so
  the confirmation lands where the eye already is. See **Finding, and the words
  you don't have** below.

- **`disclosure/expandable-card`** — the *measurement* case. A grid where
  pressing a card opens it into its own detail, with the card appearing to
  become the panel. That effect is normally bought from a layout-animation
  library, and the price is that the animation, the open state, the escape key
  and the scroll lock all end up inside the component — which is to say, inside
  something that owns state, which ends a leaf. Here the morph is arithmetic on
  two rectangles in a pure function, the container takes both measurements, and
  four structurally different leaves — including one with no overlay at all —
  get the same shared element without implementing any of it. See **Morphing,
  and where a measurement belongs** below.

- **`temporal/countdown`** — the *clock* case, and the only tree that must
  re-render on a tick. Everything else in the forest is clock-free at render
  time; a countdown reopens that door, so the contract shuts it. See **Time, and
  the thing that must not tick** below.

- **`commerce/product-card`** — the *arithmetic* case. A product card looks like
  a content card and is not one: the discount badge, the struck price, the
  rating and the dimensions are all results of calculations, and every one of
  them is a bug that reaches a customer if a variant gets it wrong. So no number
  crosses into a leaf — money arrives as `"$199"`, the discount as `"− 50%"`,
  and both come out of the same call, which is why no two leaves on this tree
  can disagree about what something costs. See **Money, and the number a leaf
  must never see** below.

## Every tree, every leaf

Each tree links to its **contract** — read that first, it is the thing every
leaf on the tree answers. Leaf links go to the presentation component itself;
its props *are* the VM above it. Lab routes are local (`pnpm dev`, or
`ROUTE=/lab/<species>/<tree> pnpm review`).

### chrome — persistent furniture

**[page-nav](src/trees/chrome/page-nav/)** ·
[contract](src/trees/chrome/page-nav/page-nav.vm.ts) ·
[fixtures](src/trees/chrome/page-nav/page-nav.fixtures.ts) ·
`/lab/chrome/page-nav`

| Leaf | |
|---|---|
| [`canon/glass-track`](src/trees/chrome/page-nav/branches/canon/glass-track/glass-track.tsx) | The creator nav's `default` style — soft rounded glass track, active item filled in the page accent |
| [`canon/pill-track`](src/trees/chrome/page-nav/branches/canon/pill-track/pill-track.tsx) | The creator nav's `pill` style — full capsule track and triggers |
| [`canon/brand-bar`](src/trees/chrome/page-nav/branches/canon/brand-bar/brand-bar.tsx) | Full-width marketing bar — brand left, bare links right, one loud CTA |
| [`experimental/floating-capsule`](src/trees/chrome/page-nav/branches/experimental/floating-capsule/floating-capsule.tsx) | Detaches on scroll — a flat strip that draws in, rounds off and floats |

**[section-tabs](src/trees/chrome/section-tabs/)** ·
[contract](src/trees/chrome/section-tabs/section-tabs.vm.ts) ·
[transitions](src/trees/chrome/section-tabs/section-tabs.transitions.ts) ·
`/lab/chrome/section-tabs`

| Leaf | |
|---|---|
| [`canon/top-track`](src/trees/chrome/section-tabs/branches/canon/top-track/top-track.tsx) | Horizontal segmented track — scrolls rather than wraps, edge chevrons, portalled previews |
| [`canon/side-rail`](src/trees/chrome/section-tabs/branches/canon/side-rail/side-rail.tsx) | Tabs beside the panel with a hint line; restructures into a strip when narrow |
| [`canon/popover-menu`](src/trees/chrome/section-tabs/branches/canon/popover-menu/popover-menu.tsx) | One trigger, everything else in a disclosure — the only leaf whose footprint does not grow with the tab count |
| [`experimental/hover-dock`](src/trees/chrome/section-tabs/branches/experimental/hover-dock/hover-dock.tsx) | Markers that name themselves on hover — maximum panel, minimum standing chrome |

**[pane-dock](src/trees/chrome/pane-dock/)** ·
[contract](src/trees/chrome/pane-dock/pane-dock.vm.ts) ·
[fixtures](src/trees/chrome/pane-dock/pane-dock.fixtures.ts) ·
`/lab/chrome/pane-dock`

| Leaf | |
|---|---|
| [`canon/door-row`](src/trees/chrome/pane-dock/branches/canon/door-row/door-row.tsx) | One labelled button per docked pane, in a single row under the purpose line — one place to look, read in the reading direction |
| [`canon/edge-strips`](src/trees/chrome/pane-dock/branches/canon/edge-strips/edge-strips.tsx) | A strip on the edge of the column each pane would open into. Maximum placement information; the labels turn sideways and the content ends up ringed |
| [`canon/one-rail`](src/trees/chrome/pane-dock/branches/canon/one-rail/one-rail.tsx) | Every door in one left rail, grouped by role, labels the right way up — the only leaf where a door can explain itself without a hover |
| [`experimental/command-sheet`](src/trees/chrome/pane-dock/branches/experimental/command-sheet/command-sheet.tsx) | Zero standing chrome — one counted trigger, everything else behind it. The only leaf whose footprint does not grow with the dock |

### commerce — something that can be bought

**[product-card](src/trees/commerce/product-card/)** ·
[contract](src/trees/commerce/product-card/product-card.vm.ts) ·
[fixtures](src/trees/commerce/product-card/product-card.fixtures.ts) ·
[container](src/trees/commerce/product-card/product-card-connected.tsx) ·
`/lab/commerce/product-card`

| Leaf | |
|---|---|
| [`canon/spec-shelf`](src/trees/commerce/product-card/branches/canon/spec-shelf/spec-shelf.tsx) | **Start here.** Photograph in an inset panel, the facts a shopper compares on one chip shelf beneath it, name and price sharing the last line |
| [`canon/detail-row`](src/trees/commerce/product-card/branches/canon/detail-row/detail-row.tsx) | The card on its side, for a cart or a comparison list. Takes the pre-joined `specLine` where its sibling takes the W/H/D rows — same strings, different room |
| [`experimental/price-tag`](src/trees/commerce/product-card/branches/experimental/price-tag/price-tag.tsx) | The photograph is the card — type under a wash, the price hanging off the corner as a tag, and the commit as the whole bottom edge |

### disclosure — one item opening into more of itself

**[expandable-card](src/trees/disclosure/expandable-card/)** ·
[contract](src/trees/disclosure/expandable-card/expandable-card.vm.ts) ·
[transitions](src/trees/disclosure/expandable-card/expandable-card.transitions.ts) ·
[fixtures](src/trees/disclosure/expandable-card/expandable-card.fixtures.ts) ·
[container](src/trees/disclosure/expandable-card/expandable-card-connected.tsx) ·
`/lab/disclosure/expandable-card`

| Leaf | |
|---|---|
| [`canon/media-grid`](src/trees/disclosure/expandable-card/branches/canon/media-grid/media-grid.tsx) | **Start here.** Media tiles opening into a centred dialog — a tile and a panel are the same shape at two sizes, which is what the morph was designed for |
| [`canon/row-list`](src/trees/disclosure/expandable-card/branches/canon/row-list/row-list.tsx) | A narrow playlist column, thumbnail and action per row. Scans by title, not by picture — and puts the morph's non-uniform scale under the most stress |
| [`canon/inline-detail`](src/trees/disclosure/expandable-card/branches/canon/inline-detail/inline-detail.tsx) | No overlay at all: the detail opens as a row in the flow. Nothing is covered, the page never locks, and the source card stays visible |
| [`experimental/full-bleed`](src/trees/disclosure/expandable-card/branches/experimental/full-bleed/full-bleed.tsx) | The picture is the card — type rides on the media behind a scrim, and the panel takes most of the viewport |

### finding — retrieval, against a vague memory

**[clip-picker](src/trees/finding/clip-picker/)** ·
[contract](src/trees/finding/clip-picker/clip-picker.vm.ts) ·
[fixtures](src/trees/finding/clip-picker/clip-picker.fixtures.ts) ·
`/lab/finding/clip-picker`

| Leaf | |
|---|---|
| [`canon/one-column`](src/trees/finding/clip-picker/branches/canon/one-column/one-column.tsx) | **Start here.** Phone-first: purpose, search, curated suggestions, shelves. One card per row, full-width Send, nothing behind a hover |
| [`canon/shelf-rail`](src/trees/finding/clip-picker/branches/canon/shelf-rail/shelf-rail.tsx) | Desktop-first: each shelf is a horizontal rail, so several shelves are a glance apart. Results deliberately stay a ranked vertical list |
| [`canon/quote-first`](src/trees/finding/clip-picker/branches/canon/quote-first/quote-first.tsx) | Search-led: the sentence is the headline at reading size and the clip is the caption. For the regular who already has the words |
| [`experimental/deck`](src/trees/finding/clip-picker/branches/experimental/deck/deck.tsx) | One clip at a time, full width, swipe for the next — judging instead of comparing. Pages on native scroll-snap, so it holds no state |

### landing — the first screen

**[channel-hero](src/trees/landing/channel-hero/)** ·
[contract](src/trees/landing/channel-hero/channel-hero.vm.ts) ·
[fixtures](src/trees/landing/channel-hero/channel-hero.fixtures.ts) ·
`/lab/landing/channel-hero`

| Leaf | |
|---|---|
| [`canon/split-dock`](src/trees/landing/channel-hero/branches/canon/split-dock/split-dock.tsx) | 60/40 split — the closest match to laughingwhales.com's hero |
| [`canon/stacked-billboard`](src/trees/landing/channel-hero/branches/canon/stacked-billboard/stacked-billboard.tsx) | One centred column; status becomes a pill, links become a divided list |
| [`broadcast/live-marquee`](src/trees/landing/channel-hero/branches/broadcast/live-marquee/live-marquee.tsx) | Broadcast furniture — tally bar, lower-third slab, links on a ticker rail |

### motion — defined by movement

**[aurora-headline](src/trees/motion/aurora-headline/)** ·
[contract](src/trees/motion/aurora-headline/aurora-headline.vm.ts) ·
[fixtures](src/trees/motion/aurora-headline/aurora-headline.fixtures.ts) ·
`/lab/motion/aurora-headline`

| Leaf | |
|---|---|
| [`canon/baseline`](src/trees/motion/aurora-headline/branches/canon/baseline/baseline.tsx) | The scaffold's starting point — what `pnpm plant` writes, kept as the reference |
| [`canon/stacked-rule`](src/trees/motion/aurora-headline/branches/canon/stacked-rule/stacked-rule.tsx) | Editorial stack — the rule under the eyebrow fills as transport advances |
| [`experimental/orbit-glow`](src/trees/motion/aurora-headline/branches/experimental/orbit-glow/orbit-glow.tsx) | An aurora blob orbits behind the type; chips ride the same angle |

### narrative — defined by sequence

**[step-reveal](src/trees/narrative/step-reveal/)** ·
[contract](src/trees/narrative/step-reveal/step-reveal.vm.ts) ·
[fixtures](src/trees/narrative/step-reveal/step-reveal.fixtures.ts) ·
`/lab/narrative/step-reveal`

| Leaf | |
|---|---|
| [`canon/numbered-rail`](src/trees/narrative/step-reveal/branches/canon/numbered-rail/numbered-rail.tsx) | Vertical rail — all steps legible at once, a fill travels the spine |
| [`canon/wide-cards`](src/trees/narrative/step-reveal/branches/canon/wide-cards/wide-cards.tsx) | Horizontal band — the active card claims the width, the rest compress |
| [`experimental/stage-swap`](src/trees/narrative/step-reveal/branches/experimental/stage-swap/stage-swap.tsx) | One step owns the stage; the rest collapse to ghost ordinals |

### temporal — defined by a deadline

**[countdown](src/trees/temporal/countdown/)** ·
[contract](src/trees/temporal/countdown/countdown.vm.ts) ·
[fixtures](src/trees/temporal/countdown/countdown.fixtures.ts) ·
[container](src/trees/temporal/countdown/countdown-connected.tsx) ·
`/lab/temporal/countdown`

| Leaf | |
|---|---|
| [`canon/unit-blocks`](src/trees/temporal/countdown/branches/canon/unit-blocks/unit-blocks.tsx) | Monospaced tiles per unit, with the window drawn as one hairline underneath |
| [`canon/inline-strip`](src/trees/temporal/countdown/branches/canon/inline-strip/inline-strip.tsx) | A single dense line for banners and bars — short labels, underline as the window |
| [`canon/ring-dial`](src/trees/temporal/countdown/branches/canon/ring-dial/ring-dial.tsx) | A depleting arc with the digits inside it — the glance and the detail in one place |
| [`experimental/flip-stack`](src/trees/temporal/countdown/branches/experimental/flip-stack/flip-stack.tsx) | Split-flap cards whose hinge tilts on each unit's own cycle — no state, no jump cut |

`pnpm forest` prints this same shape from the filesystem, and is the version
that cannot go stale.

## Time, and the thing that must not tick

`temporal/countdown` is the first tree here whose whole job requires a running
clock, and a running clock is exactly what the rest of the forest avoids. A
browser clock sitting a few seconds either side of a boundary will answer
differently than the render that produced the page — so the tree splits the
problem rather than trusting the tab.

| Who | Owns |
|---|---|
| the caller | picks `endsAt` (and optionally `startsAt`) from one authoritative instant |
| the container | holds the single interval, splits the remainder, formats every string |
| the leaf | reads padded strings and one `state` — never a `Date`, an epoch or a remainder |

A leaf therefore *cannot* derive which window it is in, even by accident. It is
handed `units` — `{ id, value: "07", label: "Hours", shortLabel: "h", fraction }`
— already padded, already pluralised, and already trimmed to the magnitudes
worth showing, so the same leaf holds a 124-day drop and a 90-second window
without learning anything new.

**`state: "none"` is the load-bearing part.** A surface with no deadline — an
untimed mode, a drop with no close date — renders **nothing**. Every leaf is
tested for it. A timer that fabricates a window is lying about the premise of
the thing it sits on, and it fails silently because nothing crashes.

Four leaves ship: `unit-blocks` (monospaced tiles, one hairline for the window),
`inline-strip` (a single dense line for banners and bars — the one to drop into
`chrome/section-tabs`), `ring-dial` (a depleting arc with the digits inside it)
and the experimental `flip-stack` (split-flap cards whose hinge tilts on each
unit's own `fraction` — the trick that gets mechanical motion out of a pure
function, since a real split-flap would need to remember the previous digit).

Two things it deliberately does **not** do. It never settles anything: `expired`
is informational, and auto-failing at zero writes to somebody's ledger, which is
a different feature and a different decision. And a custom duration is not a
prop — periods that anchor to a wall-clock boundary need their length to divide
the day evenly, so "90-minute timer" is a scheduling decision the caller makes
before `endsAt` ever reaches this tree.

## Money, and the number a leaf must never see

`commerce/product-card` is the tree where the extract-vm rule about
pre-formatted strings stops being hygiene and starts being correctness.

Look at what a product card actually displays. `"− 50%"` is two amounts and a
rounding rule. `"$399"` struck through only exists when it is higher than the
price beside it. `"$199"` is minor units, a currency and a locale. `"4.9"` is a
mean with a decimal count somebody decided on. `"58 × 79 × 60 cm"` is three
measurements, a separator and a unit. Every one of those is a `toFixed`, an
`Intl.NumberFormat` or a `join` — and every one of them is a claim about a
price, which is the one kind of bug a shop cannot ship twice.

Let presentation do that arithmetic and the failure is not a crash. It is one
variant saying `$199.00` and another saying `$199`; it is a 33.4% cut advertised
as 33 in the grid and 34 on the detail page, because the two leaves reached for
different rounding. Nothing throws. The suite stays green. The card simply
contradicts itself in front of a customer.

| Who | Owns |
|---|---|
| the caller | amounts in **minor units** (`19_900`), a currency, a raw rating |
| the container | `formatMoney`, `percentOffLabel`, `compareAtPrice`, `specLine` — one call each, one answer each |
| the leaf | strings it prints verbatim, and `vm.state` to decide where they go |

The badge, the struck price and the saving line are three views of ONE
subtraction, so they cannot drift apart:

```ts
percentOffLabel(19_900, 39_900)          // "− 50%"    — the badge
compareAtPrice(19_900, 39_900, "USD")    // "$399"     — struck, only when higher
formatMoney(39_900 - 19_900, "USD")      // "$200"     — "Save $200"
```

`percentOffLabel` rounds **down**, always. 49.6% off is advertised as 49, never
50 — a designer would round the other way and a regulator reads the difference.
That rule lives in one function, which is the entire argument for the tree.

The fixtures are where it is checked. `sample()` derives every string from a raw
record through the same helpers the container uses, so a fixture cannot describe
a card the running component could not produce — and
`product-card.fixtures.test.ts` asserts the card never says two things at once:
no struck price without a badge, no `"Add to bag"` on a button that cannot be
pressed, at most one accent-filled badge.

The three leaves then prove the split is real. `canon/spec-shelf` renders the
dimensions as a W/H/D block; `canon/detail-row` renders the same dimensions as
one line; `experimental/price-tag` has room for neither and renders none. All
three take their strings from the same VM, and none of them owns a number.

## Morphing, and where a measurement belongs

`disclosure/expandable-card` is the tree for a grid whose cards open. The effect
everyone recognises is the shared element: press a card and it appears to
*become* the panel. The usual way to get it is a layout-animation library, and
the usual result is a component that owns the open state, the escape key, the
outside click, the scroll lock and the animation — five responsibilities in the
file whose job was to look good.

The claim this tree makes is smaller than it sounds:

> A shared-element morph is not an animation. It is **two rectangles and a
> subtraction**, and both rectangles are measurements.

Measurements belong to the container, everywhere else in this forest. So they
belong to the container here, and what is left for a leaf is arithmetic it
receives rather than performs:

| Axis | Lives in | Swap it by |
|---|---|---|
| which card is open | the container's state | pressing one |
| what the cards and panel **look like** | a **leaf** | `variant="canon/row-list"` |
| how the panel **arrives** | a **transition preset** | `transition="sheet"` |

```tsx
<ExpandableCardConnected
  variant="canon/media-grid"   // ← look
  transition="morph"           // ← motion
  records={clips}              // ← data
/>
```

### The whole morph

The panel is laid out where it finally belongs, then transformed so that at t=0
it exactly covers the card, relaxing to identity as t→1. Both ends are known up
front, so every frame in between is arithmetic — no library, no keyframes, and
nothing that has to observe a DOM node while it animates.

```ts
const scaleX = lerp(origin.width / target.width, 1, t);
const dx     = lerp(origin.x - target.x, 0, t);
// transformOrigin: "top left" — so the composite is offset + scale·p
```

That is `flip()` in
[`expandable-card.transitions.ts`](src/trees/disclosure/expandable-card/expandable-card.transitions.ts),
and it is the piece worth copying out of this repo on its own. The scale is
non-uniform — a wide card into a tall panel is not a zoom — so the content
inside is counter-scaled by the reciprocal, which keeps type undistorted and
makes the content briefly wider than the surface. Hence the one thing a leaf
must do: **clip the panel**. There is a test for it.

Three obligations, and they are all a leaf has:

1. spread `{...card.anchor}` on each card — that is the rect the morph starts
   from, and it is a `data-*` attribute, not behaviour;
2. put `panel.id` on the panel and spread `panel.motion.surface` there;
3. clip that surface.

[`expandable-card.leaves.test.tsx`](src/trees/disclosure/expandable-card/expandable-card.leaves.test.tsx)
asserts all three against **every leaf on the tree, including ones not written
yet** — because a leaf that quietly drops one looks perfect in the lab on a
frozen fixture and does nothing at all when a person presses it.

### Both rectangles are allowed to be missing

`origin` and `target` are nullable, and that is the load-bearing part rather
than defensive typing. On the server, in a test, and on the very first frame of
the very first opening there is nothing to measure. A preset that needed the
numbers would emit `NaN` into a transform — which fails silently, on first paint
only, on machines that are not yours. So `morph` degrades to `lift`, and the
degradation is what allows it to be the default. `resolveMotion` is also where
reduced motion short-circuits, *before* the preset runs, so a new preset cannot
forget it.

Measuring the panel deserves its own sentence: the morph transforms the panel,
so measuring it while transformed measures the transform. The container
neutralises the transform, reads the rect and puts it back inside one
synchronous layout effect — the classic FLIP read, and the reason nothing
flickers.

### The proof it is not modal-shaped

`canon/inline-detail` renders no overlay. The detail opens as a row in the flow,
the page never locks, nothing is covered, and the source card stays visible —
and it gets the identical measured morph, because a panel laid out in flow is
just a different `target`. It is handed `motion.backdrop` like every other leaf
and renders no backdrop at all. A field a leaf does not need is a field a leaf
does not render; that is the difference between a contract and a component with
options.

What the container deliberately does **not** do: trap focus. It moves focus into
the panel and returns it to the card on close — the part that is always right —
but a trap written at the container would be guessing at a structure each leaf
owns. A leaf that needs one should use a Radix dialog from `src/components/ui/`,
held controlled, like `chrome/section-tabs` does.

## Tabs, and the three axes

`chrome/section-tabs` is the tree you reach for when the page has more sections
than screen. A normal tab component fuses three unrelated decisions into one
file; this one keeps them apart, and each is swapped without touching the other
two.

| Axis | Lives in | Swap it by |
|---|---|---|
| which sections are behind which tab | the caller's layout | passing different `tabs` |
| how the tabs **look** | a **leaf** | `variant="canon/side-rail"` |
| how panels **change** | a **transition preset** | `transition="slide-x"` |

```tsx
<SectionTabsConnected
  variant="canon/side-rail"     // ← chrome
  transition="slide-x"          // ← motion
  tabs={[{ id: "home", label: "Home", content: <ChannelHero {...vm} /> }]}
/>
```

**Chrome** is four leaves today: `top-track` (a scrolling segmented bar),
`side-rail` (tabs beside the panel, with room for a hint line), `popover-menu`
(one trigger, everything else in a disclosure — the only leaf whose footprint
does not grow with the tab count) and the experimental `hover-dock` (markers
that name themselves on hover). They use Radix under `src/components/ui/`, held
**controlled** so no state crosses into a leaf, which is what buys roving
tabindex and collision-aware popovers without breaking purity.

**Motion** lives in `section-tabs.transitions.ts`. A preset is a pure function
of an instant:

```ts
(phase, progress, direction, reducedMotion) → CSSProperties
```

Not a class and not a keyframe — which is why every preset composes with every
leaf, why the lab can freeze a change at t=0.35 and see all four leaves agree,
and why a preset is tested by calling it. `resolveMotion` short-circuits on
reduced motion *before* the preset runs, so a new preset cannot forget it.

Every panel arrives at a leaf with its motion already resolved into
`panel.motion.style`. A leaf spreads it. A leaf never computes it.

### Responsiveness

Most of it is plain CSS in the leaf. `vm.layout` (`"wide" | "narrow"`) exists
only for the cases where narrow means a *different element* rather than a
smaller one — `side-rail` genuinely restructures into a strip and moves its
hint into a hover card, and a breakpoint cannot move text between two elements
that are never both present. Hover and popover content is always **portalled**,
because a card rendered inside the `overflow-x-auto` track that holds it is the
most common way a working popover ships clipped.

## Docks, and the cost of a door

`chrome/pane-dock` is the only tree here whose subject is *what a screen does
not show you*. It was planted after reading a real workspace whose layout table
had, over five weeks, been corrected four separate times — each correction
turning a pane from "not mounted here" into "collapsed to a strip here", and
each defended with the same sentence, which is a good one:

> A posture says what you LAND on, not what you may reach.

Every one of those corrections was right. The aggregate was a send page — one
job, one button that mattered — carrying five collapsed strips on four edges, a
nine-item icon rail, and three labels rotated ninety degrees. Forty per cent of
the controls on screen did nothing but move furniture.

The error is not in the principle. It is one word underneath it:

> Reachability is a **door**, not a **strip**.

"You may reach this pane" is a claim about what happens when someone asks. It
does not, by itself, buy a permanently visible affordance — and a permanently
visible affordance is not free, because its real cost is not the pixels it
occupies but the ranking it demands from the reader. Five equally-weighted edges
say five equally important things on a screen whose job is one thing.

So the tree splits the two decisions that had been fused:

1. **Which panes are open** — the caller's posture. An input. Still a preset,
   still says what you land on.
2. **How the closed ones are offered** — a leaf. A budget.

Three things in the contract keep that split honest:

- **`PaneDockDoor` has no `content`.** A docked pane is *not mounted*. The door
  is a button that asks for the pane, never a wrapper around a hidden subtree —
  so "collapsed" cannot quietly decay into "rendered, then hidden with CSS",
  which is the state where the strips cost everything and buy nothing.
- **`purpose.title` is not nullable.** A surface that cannot say in one line
  what it is for has no way to rank anything on it, and the failure is silent:
  every pane looks locally reasonable and the sentence that would have sorted
  them was never written down.
- **`state: "solo"`** is its own string. When nothing is docked, a leaf renders
  no dock at all — and it gets there by switching on a state rather than asking
  `docked.length === 0`, because a derived check is how an empty rail survives
  its own emptiness.

`canon/edge-strips` implements the expensive answer faithfully, rotated labels
and all. It is not a straw man: placement-as-affordance is real information and
the gesture is symmetrical with putting a pane away. It is there so that
"compare all 4" on one fixture settles the argument with a picture instead of a
paragraph — and so that a surface which genuinely wants four edges can have
them, on the same VM, by changing one string.

## Finding, and the words you don't have

`finding/clip-picker` starts from a claim: **a search box is a demand that the
person already knows the words.** On a send page that demand is close to fatal.
The viewer arrived from a Twitch panel, has watched this streamer for a month,
and remembers "the bit where he screamed at the fish" — which is not a query,
because they do not know whether he said "fish", "it", or nothing at all.

So the contract carries two ways in and refuses to make them two screens:

1. **Shelves the streamer curated.** `browse` is the default state, not a
   fallback. Zero typing, and the thing that has to be good.
2. **Transcript search**, for the viewer who does have the words.

The piece that makes it one surface is `search.suggestions` — **searches the
streamer curated**. "the fish incident · 12 moments" is not a chip that filters
a list; it is a query someone else already wrote, and tapping it moves a person
who could not describe what they wanted directly into `results`. It is the only
control on the screen that works for the state everybody actually arrives in.

Three decisions in the VM are load-bearing:

- **A match is a data structure.** `quote: TranscriptSegment[]` arrives already
  split into matched and unmatched runs, so a leaf maps and styles and never
  sees the query, never runs a regex, never calls `.split()`. Four leaves
  highlight identically for free, and accent-folding or stemming becomes one
  change in `splitTranscript` rather than four.
- **`state` separates "no query" from "no results".** `browse` and `empty` look
  nothing alike and mean opposite things — one is the front door, one is a dead
  end that must offer a way out. A leaf deriving this from `results.length === 0`
  would render the dead end on first paint, which is the exact bug.
- **Send lives on the card.** There is no selected-item field anywhere in this
  VM. A picker with a selection has two places to look at once, which is the
  failure `chrome/pane-dock` documents; here you press Send on the thing you are
  looking at, and *that thing* changes to say so. `ClipSendAction` carries its
  own state, its own label and a `null` callback the moment it is unavailable,
  so "says Sent but is still pressable" cannot be written four times.

The leaves disagree about who is arriving, which is a real product choice and
therefore one prop: `one-column` bets on a stranger on a phone, `shelf-rail` on
a desktop viewer who reads rails fluently, `quote-first` on a regular who has
the words, and `experimental/deck` on someone who will bounce before they finish
reading a grid. The deck holds no state at all — its position lives in the DOM's
scroll offset via `snap-x snap-mandatory`, which is the whole reason a stateless
one-at-a-time pager is possible on a tree whose leaves may not own state.

### Lifting it into an app that already has a send panel

Three tiers, and they are not the same kind of work.

**Copy the file.** `clip-picker.vm.ts` imports nothing — no `@/`, no React, no
DOM. `splitTranscript`, `resolveSendAction`, `resolveClipPickerState`,
`formatClipDuration` and `formatResultLabel` are portable by being pasted, and
[`clip-picker.vm.test.ts`](src/trees/finding/clip-picker/clip-picker.vm.test.ts)
is what makes that safe rather than optimistic: it pins the edges that bite —
overlapping self-repeating queries, regex metacharacters (it never builds a
regex), a trailing space that would otherwise kill a match, a match at the very
first or last character, and the invariant that no query may ever add or drop a
character of the line. Take the tests with the function; they are most of the
value.

**Adapt the shape.** `adaptSendPanel()` takes a *structural* type
(`SendPanelVMLike`), so this repo never imports the consuming app — anything
with those fields satisfies it. Same play as `adaptHomeHero` below, and the
`Ported — yapdrop send panel` fixture puts a real panel's shape through the
conformance suite, so "your shortlist renders through four leaves with no
selection step" is a passing test rather than a claim.

**Expect the adapter to be wrong somewhere, and say where.** The first version
of `adaptSendPanel` mapped every un-sendable step — including a streamer who
simply has drops paused — onto `offline`, which every leaf renders as one
sentence with the shelves gone. That deleted the shortlist at the exact moment
it is the reason to come back later, and it contradicted the source product's
own note about why the picks exist. The fix separates two things the first
version had fused: **`state` is what there is to show; permission is a
`notice`.** A paused panel now browses, carries the streamer's sentence as a
banner, and blocks every card with "Paused" rather than "Queue full" — pinned by
[`clip-picker.paused.test.tsx`](src/trees/finding/clip-picker/clip-picker.paused.test.tsx),
which asserts it once per leaf because a leaf could otherwise swallow the notice
and still pass conformance.

**Decide the product question.** The mapping deliberately has no field for a
selected clip, and that is the one thing an adapter cannot smuggle in. Worth
noticing before that argument starts: in yapdrop's own `QuickPickVM`, every row
already carries `onSend: (() => void) | null`. **The curated path there never
had a chooser step** — only the paste-a-URL path does. So the question is not
"should we remove the selection step", it is "why does the typed path need one
when the curated path never did", which is a much smaller thing to answer.

## The organizer

```bash
pnpm dev    # → /organize
```

Every leaf in the forest is a draggable card. Drop one on a tab and it moves
behind that tab; the live result underneath rebuilds through the real container
with the real chrome. Tab chrome, transition and duration are dropdowns, so the
axes above are something you feel rather than read.

The rules are not in the drag handlers. Every mutation goes through a pure
function in `src/lib/section-layout.ts` — which is why the keyboard-friendly
"Move to…" select is a peer of dragging rather than a degraded fallback, and
why "a tab deleted while active" is a unit test instead of a thing you find by
dragging. Layouts persist to `localStorage` and are reconciled against the
forest on load, so a stale entry drops sections that no longer exist instead of
rendering a blank page.

### It arranges this site, not a mock of it

The organizer edits a **surface** — a named page whose shape is a value.
`src/lib/site-layout.ts` holds one `SectionLayout` per surface (`home`, `lab`)
and every write is still one of `section-layout.ts`'s pure moves lifted onto
exactly one of them. `SiteLayoutProvider` at the root owns that value, because
`/organize` writes it and `/` and `/lab` read it, so no single route can own it.
Each page mounts `<CuratedSurface>` around the content it ships with, and the
"Live result" panel on the organizer is that same component reading that same
value — not a preview of the page, the page.

Two properties keep this from being a way to break the site:

- **A page with nothing in any tab renders the design it shipped with.** Empty
  tabs are not curation, they are a page someone opened the organizer on and
  walked away from. The shipped design is passed in as children, so the server
  renders it, the static export contains it, and an unreadable `localStorage`
  entry degrades to the site as shipped rather than to an empty tab bar.
- **This site's own parts are sections too.** The forest index, the stats row
  and the lab list are `builtin` entries in the catalog (`src/app/site-sections.tsx`),
  so arranging a page can never delete its navigation — the tree list goes to
  the shelf, and comes back.

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
