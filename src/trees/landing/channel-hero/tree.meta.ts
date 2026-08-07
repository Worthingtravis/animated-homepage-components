import type { TreeMeta } from "@/lib/forest";

export const meta: TreeMeta = {
  label: "Channel Hero",
  description:
    "The first screen of a streamer's page: identity, a live/offline strip, a row of actions, and a 'start anywhere' grid. A deliberate superset of laughingwhales.com's HomeHeroVM — `adaptHomeHero()` lifts that contract into this one, and the 'Ported' fixture keeps the mapping under test.",
  tags: ["hero", "twitch", "landing", "portable"],
};

export default meta;
