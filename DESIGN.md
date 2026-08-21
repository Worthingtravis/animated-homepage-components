---
name: Animated Homepage Components
description: A field guide to a forest of swappable homepage components — the plate is neutral so the specimen can be loud.
colors:
  signal-indigo: "oklch(0.55 0.19 265)"
  signal-indigo-dark: "oklch(0.72 0.16 270)"
  understory-green: "oklch(0.72 0.16 165)"
  understory-green-dark: "oklch(0.78 0.15 165)"
  plate-white: "oklch(0.99 0.003 250)"
  plate-black: "oklch(0.16 0.015 265)"
  card-white: "oklch(1 0 0)"
  card-black: "oklch(0.2 0.018 265)"
  specimen-ink: "oklch(0.21 0.02 260)"
  specimen-ink-inverse: "oklch(0.96 0.005 255)"
  muted-plate: "oklch(0.96 0.005 255)"
  muted-ink: "oklch(0.53 0.02 258)"
  hairline: "oklch(0.9 0.008 258)"
  hairline-dark: "oklch(0.32 0.02 265)"
  destructive: "oklch(0.58 0.21 27)"
  success: "oklch(0.65 0.16 150)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
  micro:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
components:
  button-primary:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.plate-white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.plate-white}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  card-specimen:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.specimen-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  chip-species:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  chip-species-selected:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.plate-white}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  chip-count:
    backgroundColor: "{colors.understory-green}"
    textColor: "{colors.specimen-ink}"
    rounded: "{rounded.full}"
    padding: "2px 6px"
  rail-item:
    backgroundColor: "transparent"
    textColor: "{colors.specimen-ink}"
    rounded: "{rounded.lg}"
    padding: "6px 8px"
  rail-item-current:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "{colors.signal-indigo}"
    rounded: "{rounded.lg}"
    padding: "6px 8px"
  input-field:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.specimen-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
---

# Design System: Animated Homepage Components

## Overview

**Creative North Star: "The Field Guide"**

This is a naturalist's catalogue, not a product. The site is a neutral plate on which specimens are mounted, labelled, and looked at — and the specimens are forty leaves that each argue loudly for their own look. Every decision in the chrome follows from that division: the plate is flat, hairline-ruled, small-capped, and almost entirely uncoloured, so that a brutalist poster leaf and a glass page-nav leaf can sit two cards apart without the page taking a side. The vocabulary is load-bearing rather than decorative — species, tree, branch, leaf name the folders, the CLI verbs, and the slash commands — but the visual language stays out of botanical costume. There is one conifer, and it is the favicon.

The unusual constraint here is that **the palette does not belong to this site.** Five values — `--primary`, `--primary-foreground` (derived, never stored), `--accent`, `--ring`, `--background` — plus the font are ambient CSS on a wrapper, and a creator moves them. Everything in the frontmatter above is a *resting* value: what the platform looks like before anyone has touched it. A component styled only in `card` / `border` / `muted` is not neutral, it is deaf to the creator, and it fails without crashing. So the system is designed to be repainted, and the conformance suite fails any leaf that cannot be.

Density is high and unapologetic. Body copy is 14px, labels are 11px, and a lab page lists every tree in the repository down the left gutter rather than making anyone visit a page to find one. This is a working surface for two people who already know the vocabulary — a curator and a coding agent — and the readability budget is spent on getting more of the forest on screen, not on marketing air. It is explicitly **not** a design system site (it documents no tokens for outside consumption and grows no swatch grids or copy-the-class-name affordances), **not** a component-library showcase (no gradient hero, no marketing gloss, no landing page for itself), and it has **no dark-mode toggle** — the theme follows `prefers-color-scheme` and nothing else, because a stored preference is one more thing a visitor could see that the repository does not describe.

**Key Characteristics:**

- Flat plate, hairline structure — 1px borders and tonal steps, no shadows in the chrome
- A repaintable palette: five movable values, everything else fixed
- Small-caps labels at 11px with 0.14em tracking as the recurring signal of "this is chrome, not content"
- Rounded-xl cards, rounded-full chips, generous internal padding, nothing lifted
- Derived everything — no stored nav, no arrangeable sections, no hand-written list of species
- Motion driven by reading position, never by a clock

## Colors

A cool, near-monochrome plate carrying exactly two chromatic voices, both of which a creator can overwrite.

### Primary

- **Signal Indigo** (`{colors.signal-indigo}`): the one saturated voice in the chrome. It is links, the focus ring, the current item in the forest rail, and the single filled action on a card ("Open lab"). It is *not* a surface tint, a heading colour, or a decorative wash. In dark mode it steps lighter (`{colors.signal-indigo-dark}`) rather than changing hue. This is the value a creator most often replaces, so anything painted in it must survive being lime, ember, or hot pink.

### Secondary

- **Understory Green** (`{colors.understory-green}`): the quiet second voice, used almost exclusively for counts — the leaf-count pill on a rail item, badges, small quantitative furniture. Its job is to be readable at 10px against a chip fill, not to compete with the indigo. Foreground on it is ink, never white.

### Neutral

- **Plate White** (`{colors.plate-white}`): the page ground. Very slightly cool, never pure white, so a `card-white` surface can sit on top of it and still read as a distinct plane.
- **Card White** (`{colors.card-white}`): pure white, and the only pure value in the light palette. Every mounted surface — tree card, rail, dock, step link — is this on top of Plate White.
- **Specimen Ink** (`{colors.specimen-ink}`): all primary text. A deep blue-black, not neutral grey-black; it shares the plate's cool cast.
- **Muted Ink** (`{colors.muted-ink}`): descriptions, counts in prose, breadcrumbs, dt labels — everything secondary. Tinted from the same hue as the foreground rather than dropped to grey.
- **Muted Plate** (`{colors.muted-plate}`): hover fills and inert wells. It is a *tonal step*, never a border.
- **Hairline** (`{colors.hairline}`): every border in the system. One value, one pixel.

Dark mode is a token swap under `prefers-color-scheme: dark` in `globals.css` — Plate Black, Card Black, inverse ink, `{colors.hairline-dark}` — and nothing else changes. No component carries a `dark:` variant; the suite fails any leaf that does.

### Named Rules

**The Five Movable Things Rule.** A creator can move exactly `--primary`, `--primary-foreground` (derived from the accent, never stored), `--accent`, `--ring`, and `--background`, plus the font. Never add a sixth. Never invent a component-scoped variable (`--my-thing-accent`) to get around it — theming is inherited, and a component that defines its own theming variable has re-invented the mechanism the wrapper already provides.

**The Deaf Leaf Rule.** Every component must reach for `primary`, `accent`, or `ring` somewhere. One styled purely in `card` / `border` / `muted` / `foreground` is not tastefully restrained — it is invisible to the creator's brand, and it fails silently because nothing crashes. This is a test, not a guideline.

**The Derived Foreground Rule.** A primary fill is always `bg-primary` + `text-primary-foreground`. `bg-foreground` and `text-background` are banned outright: they name tokens editor mode never touches, so a call to action painted in them stays platform-coloured on every creator page. White-on-accent is not safe to assume — a lime accent puts white text at 1.91:1, and even the platform's own default pink needs black.

**The Raw Letterform Rule.** Never paint a letterform in the creator's raw colour: `bg-clip-text` + `text-transparent` is banned, because `--primary-foreground` is derived against a *ground* and clipped text has no ground at all. The single exception is a wordmark that draws its own keyline around every glyph, which has given the gradient a known ground by construction.

## Typography

**Display / Body Font:** the platform sans stack (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`) — one face for everything.
**Label/Mono Font:** `ui-monospace, SFMono-Regular, Menlo, monospace`, for paths, class names, and CLI verbs only.

**Character:** deliberately voiceless. There is no self-hosted display face and there should not be one, because the *font is a movable value too* — a creator supplies a Google Font family and it lands on this page as ambient CSS. A branded house face in the chrome would be the one thing on screen that refuses to become theirs. Hierarchy is therefore carried entirely by weight, size, and tracking.

### Hierarchy

- **Display** (900, up to 3rem, tracking -0.025em): leaves only. The chrome never goes above Headline; this row of the scale exists because posters, heroes, and countdowns need it.
- **Headline** (600, 1.875rem): the page h1. One per page, and the only place the chrome uses a large size.
- **Title** (600, 1.25rem): a species heading. Also the largest type inside any card.
- **Body** (400, 0.875rem): everything readable — descriptions, prose, card copy. Prose columns hold a 65–75ch measure; card copy runs to its own container width.
- **Label** (600, 0.6875rem, 0.14em tracking, uppercase): the recurring "this is chrome" signal — rail species headings, eyebrow rows, metadata. Sizes below this (down to 0.55rem) exist inside leaves for dense furniture and carry a hard constraint: see the target-size rule.
- **Micro** (500, 0.625rem, `leading-none`): the smallest real step — the figure inside a count chip, and dense numeric furniture inside leaves. It is a *label on a fill*, never a line of prose, and it never carries anything a reader has to parse. Below it, nothing.
- **Code** (400, 0.75rem): file paths, tokens, CLI commands. Monospace is for *code, data, and measurement only* — never as a costume for "technical".

### Named Rules

**The Tracking-Follows-Size Rule.** Small caps get looser as they get smaller: 0.14em at label size, 0.18em–0.3em for the tiniest eyebrows inside leaves. Large type goes the other way — `tracking-tight` at Title and above, never wider.

**The Tabular Numeral Rule.** Any figure that changes in place — a count, a countdown, a scrubbing tally — is `tabular-nums`. Numerals that reflow while they animate read as a bug.

## Layout

The page is full-bleed and the *page* decides its own width, because the lab needs a rail in the gutter beside a column that prose pages still want narrowed. `<main>` carries only `px-6 py-10`.

- **Prose and index shell:** a centred column at `max-w-6xl`, stepping to `88rem` at `xl` and `104rem` at `2xl`.
- **Lab shell:** `max-w-[120rem]` with a `gap-8` split — a `w-60` sticky rail in the left gutter, the page beside it. The rail sits *outside* the column the page would otherwise occupy, which is the entire reason it can afford to list every tree: it costs the page no width and no height.
- **Header:** `max-w-[120rem]`, `px-6 py-4`, baseline-aligned, so the brand and the rail's left edge line up.
- **Card grid:** two columns from `sm` up, `gap-4`. Tree cards are equal-height flex columns with the action pinned to the bottom.

**Rhythm.** Sections separate at `space-y-10` (40px), groups inside a section at `space-y-4` (16px), and related items at `gap-2`/`gap-3` (8/12px). Card padding is 20px; panel padding is 24–32px. More space above a heading than below it, always.

### Named Rules

**The Own-Box Rule.** This is the system's hardest layout law and it applies to every component that can be dropped into a consuming app. **A leaf measures its own box, never the window.** Every root a leaf can render carries `@container`, and every breakpoint is a container query — `sm:` / `md:` / `lg:` fail the conformance suite by shape, not by list. A component is dropped into whatever column its consumer has (half a compare row, a sidebar, a full page) and is never told how wide the window is; a viewport rule fails *silently*, answering a question nobody asked. The house conversion subtracts the ~128px of page chrome a leaf sits inside:

| viewport | container | | viewport | container |
|---|---|---|---|---|
| `sm:` 640 | `@lg:` 512 | | `xl:` 1280 | `@5xl:` 1024 |
| `md:` 768 | `@2xl:` 672 | | `2xl:` 1536 | `@6xl:` 1152 |
| `lg:` 1024 | `@4xl:` 896 | | | |

Deviate when the component's own geometry says so, and say why in a comment. The one exception is a `fixed` viewport overlay — a lightbox that covers the screen really *is* the window — which keeps viewport prefixes for its own sizing and gets `@container` too, so everything inside it measures the overlay.

The site's own chrome (`src/app/**`) is the other side of this rule: it *is* the page, it knows the window, and it uses viewport breakpoints freely.

## Elevation & Depth

**The chrome is flat.** There is no shadow vocabulary at the system level and none should be invented. Depth comes from two things only: a 1px Hairline border, and a tonal step between Plate and Card. A tree card is white on near-white with a hairline around it; a rail is the same; the editor dock is the same. Hover does not lift, focus does not glow, and nothing floats.

Shadows do exist inside a handful of leaves (`shadow-sm` through `shadow-2xl`). That is deliberate and stays a **leaf's** decision, part of its own look — a glass page-nav or a layered poster may build whatever depth its aesthetic requires. It is not a house scale, other leaves are not expected to match it, and it never migrates into the chrome.

### Named Rules

**The Flat-Plate Rule.** If a chrome surface needs to read as separated, give it a border or a tonal step. If that is not enough separation, the layout is wrong — reach for space before reaching for a shadow.

## Shapes

One family of soft rectangles, sized by role rather than by taste:

- **12px (`{rounded.xl}`)** — the default mounted surface: tree cards, the forest rail, step links, dock panels. If you are drawing a card, this is the radius.
- **16px (`{rounded.2xl}`)** — larger panels and full-width wells inside leaves.
- **8px (`{rounded.lg}`)** — actions and rail items; anything you press.
- **6px (`{rounded.md}`)** — inputs, selects, and small inline controls.
- **Full (`{rounded.full}`)** — chips, pills, and count badges. A pill means "this is a token of something enumerable" (a species, a count, a tag), never "this is a button".

Borders are 1px and Hairline, or they are `transparent` and become Signal Indigo at 40% on hover — which keeps a hover state from changing an element's size. There is no dashed border except on genuinely empty states, where it says "something belongs here and does not exist yet".

### Named Rules

**The No-Coloured-Slab Rule.** No `border-left` accents above 1px, no hard offset shadows, no gradient fills in the chrome. A surface is a hairline rectangle on a tonal ground; if it needs emphasis, it gets an indigo border, not a costume.

## Components

Components are **precise and unhurried**: confident geometry, generous internal padding, and nothing bouncy. Feedback is a colour change or a 2px travel — never a lift, never a scale.

### Buttons

- **Shape:** gently rounded (8px), `text-sm`, `font-medium`.
- **Primary:** `bg-primary` + `text-primary-foreground`, `px-4 py-2`, with an arrow glyph after the label. There is normally exactly **one** filled action on a card or panel.
- **Hover / Focus:** hover drops opacity to 90% — the fill is the creator's colour and must not be recomputed into a different one. Focus-visible is a 2px `ring-ring` with no outline.
- **Ghost / secondary:** unfilled, `text-muted-foreground`, going `text-primary` on hover. Most actions in the chrome are this.

### Chips

- **Style:** fully rounded, `px-3 py-1.5`, `text-sm`, on a Card White fill with a Hairline border.
- **State:** unselected is muted ink with a hairline border, going indigo border + indigo text on hover; selected is a solid `bg-primary` fill with `border-ring`.
- **Count chips** are a distinct species: `bg-accent` + `text-accent-foreground`, `px-1.5 py-0.5`, Micro, `leading-none`. They are labels, never interactive.

### Cards / Containers

- **Corner style:** 12px.
- **Background:** Card White on Plate White.
- **Shadow strategy:** none — see Elevation & Depth.
- **Border:** 1px Hairline, going Signal Indigo on hover and `border-ring` on focus-within.
- **Internal padding:** 20px for a tree card, 12px for a rail, 16–32px for panels.
- **Behaviour:** a card carries **one** link whose hit area is stretched over the whole card with `after:inset-0`, and that link's accessible name carries the subject (`Open lab: Countdown`). A list of identical "Open lab" links is unusable with a screen reader.

### Inputs / Fields

- **Style:** Card White fill, 1px Hairline, 6px radius, `text-sm`, `px-2 py-1.5`.
- **Focus:** `ring-ring`, matching every other focus in the system.
- Browser surfaces are themed globally rather than per-field: `accent-color`, `caret-color`, `::selection`, `scrollbar-color`, and `:focus-visible` outline all resolve to the creator's tokens in `globals.css`.

### Navigation

- **Header:** a baseline row of `text-sm` links. The current page is Signal Indigo; the rest are Muted Ink going Specimen Ink on hover. It carries `HEADER_LINKS` only and does not grow with the forest.
- **Forest rail:** a sticky, scrollable panel of species (11px uppercase labels) each over its trees (a `text-sm font-medium` name, a green count chip, and a two-line clamped description). The current tree is `border-primary/40` + `bg-primary/10`. Below `lg` there is no gutter, so the rail is replaced by species chips rather than crushing the content.
- **Breadcrumb:** 11–12px muted, `·` separated, current item in ink and not a link.
- **Prev/next:** two hairline cards, the next one right-aligned, labelled `← previous` / `next →` in 12px uppercase at 0.18em.

### Motion

- **The reading-position law.** Motion on this site is driven by where the reader is, not by a clock. Nothing autoplays: the primer scrubs its chapters against a reading line a little below viewport centre, and the front page's tally and reveals run on CSS `view()` timelines. Any new chrome animation joins that law or does not ship.
- **Scrubbed motion is `linear` when it is a measurement** (a count) and `ease-out` when it is an arrival (a reveal), so it resolves early rather than still arriving while it is being read.
- **Timed feedback is 150ms**, `ease-out`, and moves at most 2px. Discrete transitions elsewhere sit in the 150–300ms band; a `cubic-bezier(0.16, 1, 0.3, 1)` decel is the house curve for anything larger.
- **The arrived state is the static state.** Every keyframe in the chrome is a `from`; the implicit `to` is whatever the element already was. Reduced motion, an unsupported browser, or a stylesheet that never loads all land on a finished page.
- **Reduced motion is a request about movement, not about feedback.** The global backstop kills travel, autoscroll, and repetition while keeping colour and opacity transitions, because those are the ones carrying meaning. Components resolve `vm.reducedMotion` in their own transitions module before any preset runs, so they still honour it when harvested into an app that never loads this stylesheet.

### Signature: the specimen card

The recurring unit of the whole site and the clearest statement of the world: a hairline white rectangle, a leading glyph, a Title-weight name, a Body description, a 12px muted metadata line (`2 branches · 4 leaves · 18 fixtures`), and a single indigo action pinned to the bottom of a flex column so that cards in a row end together. Everything the card says is counted off disk. Nothing in it is stored.

## Do's and Don'ts

### Do:

- **Do** style every component in `primary` / `accent` / `ring` somewhere, so a creator's colour can reach it.
- **Do** pair a primary fill with `text-primary-foreground`, always — it is derived for contrast against whatever the creator picked.
- **Do** measure a component's own box with `@container` queries and the house viewport→container mapping; give a `fixed` overlay `@container` too.
- **Do** carry structure with a 1px Hairline border and a tonal step, and reach for space before reaching for a shadow.
- **Do** use the 11px / 0.14em uppercase label as the signal that a piece of type is chrome rather than content.
- **Do** put exactly one filled action on a surface, and give its accessible name the subject.
- **Do** set `tabular-nums` on any figure that changes in place.
- **Do** let motion be driven by reading position, and make the arrived state the static state.

### Don't:

- **Don't** add a sixth movable value, a `theme` prop, or a component-scoped CSS variable. Theming is inherited ambient CSS.
- **Don't** paint a fill in `bg-foreground` or text in `text-background`; don't clip a gradient into a letterform without a drawn keyline.
- **Don't** use `dark:`, a hex literal, or a Tailwind palette colour (`text-slate-500`) anywhere a semantic token exists.
- **Don't** use `sm:` / `md:` / `lg:` in a component that can be harvested — those are the site's chrome's privilege alone.
- **Don't** introduce a shadow, gradient, or coloured slab into the site's chrome; leaf-level depth stays inside the leaf.
- **Don't** grow the marketing furniture of a design system site or a component-library showcase: no swatch grids, no gradient hero, no "trusted by", no copy-the-class-name affordances.
- **Don't** add a dark-mode toggle. The theme follows `prefers-color-scheme` and nothing else.
- **Don't** hand-write a list of species, a stored layout, or a curation surface. If a link is not derivable from the folder layout, it does not belong in the nav.
- **Don't** put an interactive target below 24px: text under `text-xs` on a control needs an explicit height or a hit area carried past the drawn box.
- **Don't** ship an interactive element without a `focus-visible` treatment — the UA outline does not look broken, which is exactly why it gets missed.
