/**
 * Channel Hero — fixtures.
 *
 * Frozen instants (the buttons in the lab) plus `frameAt`, a pure function that
 * produces a *coherent* VM at any point on the entrance. `frameAt` is what the
 * lab's clock drives — overriding `progress` alone would let a leaf's stagger
 * disagree with the transport it claims to follow.
 *
 * The data here is a stand-in for twitch.tv/skillcheckk, not a copy of it. No
 * live figures, no scraped avatars — the point of the tree is the shape, and
 * the shape is what a real channel's container will fill.
 */

import {
  adaptHomeHero,
  buildAction,
  buildLink,
  clampProgress,
  formatAudience,
  formatElapsed,
  resolveChannelHeroState,
  type ChannelHeroImage,
  type ChannelHeroStatus,
  type ChannelHeroVM,
  type HomeHeroVMLike,
} from "./channel-hero.vm";

const noop = () => {};

/**
 * Local placeholder art. Kept in-repo on purpose: a fixture that reaches a CDN
 * is a fixture that can fail in CI for a reason that has nothing to do with the
 * component.
 */
const AVATAR: ChannelHeroImage = {
  src: "/forest/avatar-placeholder.svg",
  alt: "skillcheckk channel avatar",
  width: 160,
  height: 160,
};

const GAME_WORDMARK: ChannelHeroImage = {
  src: "/forest/wordmark-placeholder.svg",
  alt: "Dead by Daylight",
  width: 240,
  height: 64,
};

const CHROME = {
  channelName: "skillcheckk",
  channelHandle: "@skillcheckk",
  channelAvatar: AVATAR,
  headlineLead: "Great",
  headlineBadge: { label: "Dead by Daylight", image: GAME_WORDMARK },
  headlineHighlight: "skill check.",
  subheadline:
    "Survivor mains, killer mains, and everyone who queues at 2am. Live most nights.",
  linksEyebrow: "New here? Start anywhere.",
};

const RAW_ACTIONS = [
  {
    id: "watch",
    kind: "twitch" as const,
    label: "Watch live",
    href: "https://twitch.tv/skillcheckk",
    tooltip: "Watch skillcheckk on Twitch",
  },
  {
    id: "follow",
    kind: "primary" as const,
    label: "Follow",
    href: "https://twitch.tv/skillcheckk",
    tooltip: "Follow the channel on Twitch",
  },
  {
    id: "discord",
    kind: "discord" as const,
    label: "Discord",
    href: "https://discord.gg/example",
    tooltip: "Join the community Discord",
    eyebrow: "Where the VOD clips land",
  },
  {
    id: "youtube",
    kind: "youtube" as const,
    label: "YouTube",
    href: "https://youtube.com/@skillcheckk",
    tooltip: "YouTube — full VODs and highlight reels",
    detail: "Full VODs, twice a week",
  },
];

const RAW_LINKS = [
  {
    id: "clips",
    label: "Top clips",
    detail: "The ones people keep sending back",
    href: "/clips",
    recommended: true,
  },
  { id: "schedule", label: "Schedule", detail: "Mon, Wed, Fri — 8pm ET", href: "/schedule" },
  { id: "wheel", label: "Challenge wheel", detail: "Spin a build, suffer through it", href: "/wheel" },
  { id: "rules", label: "Chat rules", detail: "Short list. Read it once.", href: "/rules" },
  { id: "merch", label: "Merch", detail: "Two shirts and a mug", href: "/merch" },
];

const LIVE_STATUS: ChannelHeroStatus = {
  label: "LIVE",
  title: "adept nurse or bust (day 11)",
  category: "Dead by Daylight",
  audience: formatAudience(3241),
  elapsed: formatElapsed(134),
};

const OFFLINE_STATUS: ChannelHeroStatus = {
  label: "Offline",
  title: "adept nurse or bust (day 10)",
  category: "Dead by Daylight",
  audience: formatAudience(412, "followers this week"),
  elapsed: "last live 14 hours ago",
};

/**
 * The continuum. Everything below is a frozen sample of this function, so a
 * fixture can never describe a state the running component cannot reach.
 */
export function frameAt(progress: number, overrides: Partial<ChannelHeroVM> = {}): ChannelHeroVM {
  const clamped = clampProgress(progress);
  return {
    state: resolveChannelHeroState({ isLive: true, hasChannel: true, isLoading: false }),
    progress: clamped,
    reducedMotion: false,
    ...CHROME,
    status: LIVE_STATUS,
    actions: RAW_ACTIONS.map((raw) => buildAction({ ...raw, onActivate: noop })),
    links: RAW_LINKS.map((raw) => buildLink({ ...raw, onActivate: noop })),
    ...overrides,
  };
}

/** Nothing has arrived yet — the frame a leaf renders before its entrance runs. */
export const ARRIVING = frameAt(0);

export const MID_ENTRANCE = frameAt(0.45);

export const LIVE = frameAt(1);

export const OFFLINE = frameAt(1, {
  state: "offline",
  status: OFFLINE_STATUS,
  actions: RAW_ACTIONS.filter((raw) => raw.id !== "watch").map((raw) =>
    buildAction({ ...raw, onActivate: noop }),
  ),
});

/** Reduced motion arrives finished. A leaf must not animate its way here. */
export const REDUCED_MOTION = frameAt(0.3, { reducedMotion: true });

/**
 * A purely static marketing hero: no live strip, no avatar, no badge. This is
 * the shape a ported laughingwhales `HomeHeroVM` lands in, so every leaf has to
 * hold up without any of the channel furniture.
 */
export const NO_STATUS = frameAt(1, {
  state: "offline",
  status: null,
  channelAvatar: null,
  headlineBadge: null,
  subheadline: null,
});

/** Nothing optional present at all — the minimum a leaf must survive. */
export const BARE = frameAt(1, {
  state: "offline",
  status: null,
  channelAvatar: null,
  headlineBadge: null,
  subheadline: null,
  linksEyebrow: null,
  links: [],
  actions: [buildAction({ id: "watch", kind: "twitch", label: "Watch live", href: "https://twitch.tv/skillcheckk" })],
});

export const LONG_COPY = frameAt(1, {
  channelName: "skillcheckk_official_backup_account",
  channelHandle: "@skillcheckk_official_backup_account",
  headlineLead: "Consistently, reliably, against all available evidence",
  headlineHighlight: "a great skill check every single time.",
  subheadline:
    "Survivor mains, killer mains, and everyone who queues at 2am with one hand on the keyboard and a strong opinion about map offerings. Live most nights, sometimes twice, occasionally for longer than anyone involved would describe as healthy.",
  status: {
    ...LIVE_STATUS,
    title:
      "adept nurse or bust (day 11) — no perks, no addons, no dignity, we go until the achievement pops or the sun does",
  },
});

export const MANY_LINKS = frameAt(1, {
  links: Array.from({ length: 9 }, (_, index) =>
    buildLink({
      id: `link-${index}`,
      label: `Destination ${index + 1}`,
      detail: "A place to go, to prove the grid holds its shape.",
      href: `/link-${index}`,
      recommended: index === 0,
      onActivate: noop,
    }),
  ),
});

/** One action only — leaves must not depend on a row of them for balance. */
export const SINGLE_ACTION = frameAt(1, {
  actions: [
    buildAction({
      id: "watch",
      kind: "twitch",
      label: "Watch live",
      href: "https://twitch.tv/skillcheckk",
      tooltip: "Watch skillcheckk on Twitch",
      onActivate: noop,
    }),
  ],
});

/** Status resolved, channel not — the skeleton frame. */
export const LOADING = frameAt(0.2, {
  state: "loading",
  status: null,
  actions: [],
  links: [],
});

export const EMPTY = frameAt(0, {
  state: "empty",
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
});

/* ------------------------------------------------------------------ *
 * The portability fixture.
 * ------------------------------------------------------------------ */

/**
 * A verbatim copy of laughingwhales.com's `BASE` home-hero fixture, lifted
 * through `adaptHomeHero`. It is here to be *rendered*: the conformance suite
 * runs every leaf on this tree against it, so "we can port laughingwhales'
 * hero into this forest" is a passing test rather than a claim.
 *
 * Keep this in sync with `src/app/view-models/home-hero.fixtures.ts` over
 * there. If that file drifts, this fixture is the alarm.
 */
export const LAUGHINGWHALES_HOME_HERO: HomeHeroVMLike = {
  headlineLead: "Twitch streamer",
  headlineGameAlt: "Dead by Daylight",
  headlineHighlight: "tools.",
  subheadline:
    "Overlays, challenge wheels, creator pages, and a stream dashboard. Free to use.",
  primaryCta: {
    label: "Login",
    href: "/api/web/auth?features=&returnTo=%2F",
    tooltip: "Log in with Twitch",
  },
  secondaryCta: {
    label: "Yapdrop",
    href: "https://yapdrop.com",
    tooltip: "Yapdrop — Twitch VOD transcript search and video rendering",
    dockEyebrow: "Bookmark this one",
    dockDescription: "My Twitch VOD transcript search/video rendering service",
  },
  discordCta: {
    label: "Discord",
    href: "https://discord.gg/laughingwhales",
    tooltip: "Join our Discord server",
  },
  youtubeCta: {
    label: "YouTube — building creator tools",
    href: "https://www.youtube.com/@ThatWasKindaFunny",
    tooltip: "YouTube — watch us build these tools",
  },
  quickStartEyebrow: "New here? Start anywhere.",
  quickStarts: [
    {
      id: "overlay",
      label: "Streamer Overlays",
      desc: "Wheel, queue, tier list, Mog Cam",
      href: "/settings/overlay",
      recommended: true,
    },
    { id: "creator", label: "Creator Page", desc: "Build your brand page", href: "/creators" },
    {
      id: "bots",
      label: "Bot Setup",
      desc: "StreamElements, Nightbot, Streamlabs",
      href: "/settings/overlay/bots",
    },
    { id: "setup", label: "Quick Setup", desc: "One-click reward setup links", href: "/setup" },
    { id: "challenges", label: "Challenges", desc: "Wheels, adept, loadouts", href: "/wheels?mode=killer" },
  ],
};

export const LAUGHINGWHALES_PORT = adaptHomeHero(LAUGHINGWHALES_HOME_HERO, {
  channelName: "laughingwhales",
  channelHandle: "@laughingwhales",
});

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Arriving": ARRIVING,
  "Mid entrance": MID_ENTRANCE,
  "Live": LIVE,
  "Offline": OFFLINE,
  "Reduced motion": REDUCED_MOTION,
  "No status": NO_STATUS,
  "Bare — no optionals": BARE,
  "Long copy": LONG_COPY,
  "Many links": MANY_LINKS,
  "Single action": SINGLE_ACTION,
  "Loading": LOADING,
  "Empty": EMPTY,
  "Ported — laughingwhales home hero": LAUGHINGWHALES_PORT,
} satisfies Record<string, ChannelHeroVM>;

export type ChannelHeroFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: ChannelHeroFixtureName = "Live";
