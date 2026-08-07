/**
 * Channel Hero — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * This is a *landing* tree: the first screen. Its transport is an entrance —
 * `progress` runs 0..1 once as the hero arrives, and never loops. A leaf reads
 * it to stagger, never to decide what exists.
 *
 * ── Portability ────────────────────────────────────────────────────────────
 * This contract is a deliberate superset of laughingwhales.com's `HomeHeroVM`
 * (`src/app/view-models/home-hero.vm.ts` over there). Everything that VM
 * carries has a home here:
 *
 *   headlineLead      → headlineLead
 *   headlineHighlight → headlineHighlight
 *   headlineGameAlt   → headlineBadge.label   (the inline wordmark's alt text)
 *   subheadline       → subheadline
 *   primaryCta        → actions[kind: "primary"]
 *   secondaryCta      → actions[kind: "secondary"]
 *   discordCta        → actions[kind: "discord"]
 *   youtubeCta        → actions[kind: "youtube"]
 *   quickStartEyebrow → linksEyebrow
 *   quickStarts       → links[]  (id → iconId, desc → detail, recommended)
 *
 * `adaptHomeHero()` below performs that mapping in one pure call, so porting a
 * laughingwhales hero into this forest — or a leaf from this forest back into
 * laughingwhales — is a function call, not a rewrite. The fields this tree adds
 * (`status`, `progress`, `reducedMotion`) all accept a null/zero value that
 * renders as the static marketing hero laughingwhales already ships.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string. No number, Date, or bigint
 *    that a leaf would have to format. Viewer counts arrive as "3.2K watching".
 *  - Every user action is a callback or an href. Never an id a leaf resolves.
 *  - Transport (progress) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

/**
 * What the channel is doing right now. Leaves switch on this — a live hero and
 * an offline hero are different compositions, not one composition with a badge
 * toggled off.
 */
export type ChannelHeroState = "live" | "offline" | "loading" | "empty";

/** Which glyph a leaf should reach for. Leaves map id → icon; the VM never ships JSX. */
export type ChannelHeroActionKind =
  | "primary"
  | "secondary"
  | "twitch"
  | "discord"
  | "youtube"
  | "custom";

export type ChannelHeroAction = {
  id: string;
  kind: ChannelHeroActionKind;
  label: string;
  href: string;
  /** Hover/aria text that says exactly where the link goes. Never null. */
  tooltip: string;
  /** Optional eyebrow above the label in dock-style leaves. */
  eyebrow: string | null;
  /** Optional one-liner beside the label. */
  detail: string | null;
  /** Set when the action opens a new context — leaves add the affordance. */
  external: boolean;
  onActivate?: () => void;
};

/** A card in the "start anywhere" grid. Mirrors laughingwhales' `HomeHeroQuickStart`. */
export type ChannelHeroLink = {
  id: string;
  /** Stable icon id a leaf maps to a glyph. Never a component. */
  iconId: string;
  label: string;
  /** Pre-formatted supporting line — "Wheel, queue, tier list". */
  detail: string;
  href: string;
  /** Exactly one link may be recommended; the container enforces it. */
  recommended: boolean;
  onActivate?: () => void;
};

/**
 * The live-channel strip. `null` for a purely static marketing hero — which is
 * how a ported laughingwhales `HomeHeroVM` renders.
 */
export type ChannelHeroStatus = {
  /** Pre-formatted state word — "LIVE", "Offline", "Starting soon". */
  label: string;
  /** Stream title, or the last stream's title when offline. */
  title: string | null;
  /** Pre-formatted category — "Dead by Daylight". */
  category: string | null;
  /** Pre-formatted audience — "3.2K watching", "412 followers today". Never a number. */
  audience: string | null;
  /** Pre-formatted duration — "live for 2h 14m", "4 days ago". */
  elapsed: string | null;
};

/** Avatar / thumbnail. Pre-resolved dimensions so a leaf never measures. */
export type ChannelHeroImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ChannelHeroVM = {
  /** Explicit visual state. Leaves switch on this — never on derived checks. */
  state: ChannelHeroState;

  /**
   * Entrance transport, normalized 0..1, monotonic. The container drives it from
   * a clock / IntersectionObserver; fixtures pin it to a reproducible instant.
   */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** Pre-formatted channel identity — "skillcheckk", already cased for display. */
  channelName: string;
  /** Pre-formatted handle including its sigil — "@skillcheckk". */
  channelHandle: string;
  channelAvatar: ChannelHeroImage | null;

  /** First line of the headline — "BUILT FOR". */
  headlineLead: string;
  /**
   * The inline badge between the two headline lines — a game wordmark, a tag.
   * `null` renders a two-line headline with nothing between.
   */
  headlineBadge: { label: string; image: ChannelHeroImage | null } | null;
  /** The emphasised closing word — "STREAMERS.". Leaves gradient/underline this. */
  headlineHighlight: string;
  subheadline: string | null;

  /** Live strip. `null` for a static marketing hero. */
  status: ChannelHeroStatus | null;

  /** Ordered call-to-action row. Order IS render order. May be empty. */
  actions: ChannelHeroAction[];

  /** Eyebrow above the link grid. `null` hides the grid's header. */
  linksEyebrow: string | null;
  /** "Start anywhere" cards. Empty renders no grid — not an empty frame. */
  links: ChannelHeroLink[];
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER or in fixtures, never in a leaf.
 * ------------------------------------------------------------------ */

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Per-element entrance offset. The container and every fixture call this, so a
 * hero's stagger is one decision, made once, rather than a magic number copied
 * into each leaf.
 *
 * Returns 0..1 for element `index` given overall transport. `reducedMotion`
 * collapses the whole stagger to "arrived".
 */
export function staggerAt(progress: number, index: number, count: number): number {
  if (count <= 0) return 1;
  const clamped = clampProgress(progress);
  // Each element gets a window that overlaps its neighbour by half — the hero
  // reads as one movement rather than a queue of separate ones.
  const span = 1 / (count + 1);
  const start = index * span;
  return clampProgress((clamped - start) / (span * 2));
}

/** Collapse raw inputs to the discrete state so leaves never branch on numbers. */
export function resolveChannelHeroState(
  input: { isLive: boolean; hasChannel: boolean; isLoading: boolean },
): ChannelHeroState {
  if (input.isLoading) return "loading";
  if (!input.hasChannel) return "empty";
  return input.isLive ? "live" : "offline";
}

/** Pre-format an audience count. Runs in the container — never in a leaf. */
export function formatAudience(viewers: number | null, verb = "watching"): string | null {
  if (viewers === null || !Number.isFinite(viewers) || viewers < 0) return null;
  const rounded =
    viewers >= 1_000_000
      ? `${(viewers / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : viewers >= 1_000
        ? `${(viewers / 1_000).toFixed(1).replace(/\.0$/, "")}K`
        : String(viewers);
  return `${rounded} ${verb}`;
}

/** Pre-format an uptime. Runs in the container — never in a leaf. */
export function formatElapsed(minutes: number | null): string | null {
  if (minutes === null || !Number.isFinite(minutes) || minutes < 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = Math.floor(minutes % 60);
  return hours > 0 ? `live for ${hours}h ${rest}m` : `live for ${rest}m`;
}

/**
 * The one place a raw action becomes a VM action. Fixtures, the container and
 * `adaptHomeHero` all go through it, so they cannot drift apart.
 */
export function buildAction(raw: {
  id: string;
  kind: ChannelHeroActionKind;
  label: string;
  href: string;
  tooltip?: string;
  eyebrow?: string | null;
  detail?: string | null;
  onActivate?: () => void;
}): ChannelHeroAction {
  return {
    id: raw.id,
    kind: raw.kind,
    label: raw.label,
    href: raw.href,
    tooltip: raw.tooltip ?? raw.label,
    eyebrow: raw.eyebrow ?? null,
    detail: raw.detail ?? null,
    external: /^https?:\/\//.test(raw.href),
    onActivate: raw.onActivate,
  };
}

export function buildLink(
  raw: {
    id: string;
    label: string;
    detail: string;
    href: string;
    iconId?: string;
    recommended?: boolean;
    onActivate?: () => void;
  },
): ChannelHeroLink {
  return {
    id: raw.id,
    iconId: raw.iconId ?? raw.id,
    label: raw.label,
    detail: raw.detail,
    href: raw.href,
    recommended: raw.recommended ?? false,
    onActivate: raw.onActivate,
  };
}

/* ------------------------------------------------------------------ *
 * The port. Structural — it never imports from laughingwhales, so this file
 * stays dependency-free, but any object shaped like `HomeHeroVM` satisfies it.
 * ------------------------------------------------------------------ */

/** Structural mirror of laughingwhales' `HomeHeroCta`. */
export type HomeHeroCtaLike = {
  label: string;
  href: string;
  tooltip: string;
  dockDescription?: string;
  dockEyebrow?: string;
};

/** Structural mirror of laughingwhales' `HomeHeroVM`. */
export type HomeHeroVMLike = {
  headlineLead: string;
  headlineGameAlt: string;
  headlineHighlight: string;
  subheadline: string;
  primaryCta: HomeHeroCtaLike;
  secondaryCta: HomeHeroCtaLike;
  discordCta: HomeHeroCtaLike;
  youtubeCta: HomeHeroCtaLike;
  quickStartEyebrow: string;
  quickStarts: Array<{
    id: string;
    label: string;
    desc: string;
    href: string;
    recommended?: boolean;
  }>;
};

/**
 * Lift a laughingwhales `HomeHeroVM` into this contract. Pure — safe in a
 * fixture, a server component, or a container.
 *
 * The result renders as the static marketing hero it already was: `status` is
 * null, `progress` is whatever the caller's transport says, and every leaf on
 * this tree can render it. That is the whole portability claim, and
 * `LAUGHINGWHALES_PORT` in the fixtures keeps it honest under test.
 */
export function adaptHomeHero(
  home: HomeHeroVMLike,
  extras: {
    channelName: string;
    channelHandle: string;
    channelAvatar?: ChannelHeroImage | null;
    headlineBadgeImage?: ChannelHeroImage | null;
    progress?: number;
    reducedMotion?: boolean;
    status?: ChannelHeroStatus | null;
  },
): ChannelHeroVM {
  const ctas: Array<[ChannelHeroActionKind, HomeHeroCtaLike]> = [
    ["primary", home.primaryCta],
    ["secondary", home.secondaryCta],
    ["discord", home.discordCta],
    ["youtube", home.youtubeCta],
  ];

  return {
    state: extras.status ? "live" : "offline",
    progress: clampProgress(extras.progress ?? 1),
    reducedMotion: extras.reducedMotion ?? false,

    channelName: extras.channelName,
    channelHandle: extras.channelHandle,
    channelAvatar: extras.channelAvatar ?? null,

    headlineLead: home.headlineLead,
    headlineBadge: home.headlineGameAlt
      ? { label: home.headlineGameAlt, image: extras.headlineBadgeImage ?? null }
      : null,
    headlineHighlight: home.headlineHighlight,
    subheadline: home.subheadline,

    status: extras.status ?? null,

    actions: ctas.map(([kind, cta]) =>
      buildAction({
        id: kind,
        kind,
        label: cta.label,
        href: cta.href,
        tooltip: cta.tooltip,
        eyebrow: cta.dockEyebrow ?? null,
        detail: cta.dockDescription ?? null,
      }),
    ),

    linksEyebrow: home.quickStartEyebrow,
    links: home.quickStarts.map((quick) =>
      buildLink({
        id: quick.id,
        iconId: quick.id,
        label: quick.label,
        detail: quick.desc,
        href: quick.href,
        recommended: quick.recommended,
      }),
    ),
  };
}

export const CHANNEL_HERO_EMPTY: ChannelHeroVM = {
  state: "empty",
  progress: 0,
  reducedMotion: false,
  channelName: "",
  channelHandle: "",
  channelAvatar: null,
  headlineLead: "",
  headlineBadge: null,
  headlineHighlight: "",
  subheadline: null,
  status: null,
  actions: [],
  linksEyebrow: null,
  links: [],
};
