/**
 * Step Reveal — fixtures.
 *
 * Frozen instants (the buttons in the lab) plus `frameAt`, a pure function that
 * produces a *coherent* VM at any point on the transport. `frameAt` is what the
 * lab's clock drives — overriding `progress` alone would desync it from
 * `activeIndex`, which is exactly the bug this contract exists to prevent.
 */

import {
  buildSteps,
  clampProgress,
  formatPositionLabel,
  resolveStepCursor,
  resolveStepRevealState,
  type StepRevealVM,
} from "./step-reveal.vm";

const noop = () => {};

const RAW_STEPS = [
  {
    id: "connect",
    title: "Connect your channel",
    description: "One OAuth hop. We read your VODs, never your chat logs.",
    meta: "30 sec",
  },
  {
    id: "pick",
    title: "Pick the moments",
    description: "Search the transcript, or let the ranker propose the cuts for you.",
    meta: "2 min",
  },
  {
    id: "shape",
    title: "Shape the cut",
    description: "Trim, reorder, reframe to vertical. Undo goes all the way back.",
    meta: "5 min",
  },
  {
    id: "ship",
    title: "Ship it",
    description: "Render once, publish everywhere, keep the source project.",
    meta: "Included",
  },
];

const CHROME = {
  eyebrow: "How it works",
  headline: "Four steps from VOD to short",
  body: "Every step is reversible, and nothing is uploaded until you say so.",
};

/**
 * The continuum. Everything below is a frozen sample of this function, so a
 * fixture can never describe a state the running component cannot reach.
 */
export function frameAt(progress: number, overrides: Partial<StepRevealVM> = {}): StepRevealVM {
  const clamped = clampProgress(progress);
  const { activeIndex, stepProgress } = resolveStepCursor(clamped, RAW_STEPS.length);
  return {
    state: resolveStepRevealState(RAW_STEPS.length, clamped),
    progress: clamped,
    steps: buildSteps(RAW_STEPS, activeIndex),
    activeIndex,
    stepProgress,
    positionLabel: formatPositionLabel(activeIndex, RAW_STEPS.length),
    reducedMotion: false,
    ...CHROME,
    onSelectStep: noop,
    cta: { label: "Start free", href: "#", onActivate: noop },
    ...overrides,
  };
}

export const IDLE = frameAt(0);

export const STEP_ONE = frameAt(0.12);

export const STEP_TWO = frameAt(0.38);

export const STEP_THREE = frameAt(0.62);

export const STEP_FOUR = frameAt(0.88);

export const COMPLETE = frameAt(1);

/** Passive variant: no steering. Leaves must render read-only, not fake a button. */
export const PASSIVE = frameAt(0.38, { onSelectStep: null });

export const REDUCED_MOTION = frameAt(0.62, { reducedMotion: true });

export const NO_CHROME = frameAt(0.38, { eyebrow: null, body: null, cta: null });

export const LONG_COPY = frameAt(0.38, {
  headline:
    "Four steps from a six-hour VOD to a vertical short your audience actually finishes watching",
  steps: buildSteps(
    RAW_STEPS.map((step, index) =>
      index === 1
        ? {
            ...step,
            title: "Pick the moments worth keeping, by search or by ranker",
            description:
              "Search the whole transcript for a phrase, scrub the audio-event track for laughter and crowd spikes, or hand the whole thing to the ranker and edit its proposal. Whichever you pick, the selection stays editable.",
          }
        : step,
    ),
    1,
  ),
});

export const MANY_STEPS = (() => {
  const raw = Array.from({ length: 7 }, (_, i) => ({
    id: `step-${i}`,
    title: `Stage ${i + 1}`,
    description: "A stage in a longer sequence, to prove the layout holds up.",
    meta: i % 2 === 0 ? `${i + 1} min` : null,
  }));
  const { activeIndex, stepProgress } = resolveStepCursor(0.5, raw.length);
  return {
    ...frameAt(0.5),
    steps: buildSteps(raw, activeIndex),
    activeIndex,
    stepProgress,
    positionLabel: formatPositionLabel(activeIndex, raw.length),
  } satisfies StepRevealVM;
})();

export const TWO_STEPS = (() => {
  const raw = RAW_STEPS.slice(0, 2);
  const { activeIndex, stepProgress } = resolveStepCursor(0.75, raw.length);
  return {
    ...frameAt(0.75),
    steps: buildSteps(raw, activeIndex),
    activeIndex,
    stepProgress,
    positionLabel: formatPositionLabel(activeIndex, raw.length),
  } satisfies StepRevealVM;
})();

export const EMPTY = frameAt(0, {
  state: "empty",
  steps: [],
  activeIndex: -1,
  positionLabel: null,
  body: null,
  cta: null,
});

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Idle": IDLE,
  "Step 1": STEP_ONE,
  "Step 2": STEP_TWO,
  "Step 3": STEP_THREE,
  "Step 4": STEP_FOUR,
  "Complete": COMPLETE,
  "Passive — no steering": PASSIVE,
  "Reduced motion": REDUCED_MOTION,
  "No chrome": NO_CHROME,
  "Long copy": LONG_COPY,
  "Many steps": MANY_STEPS,
  "Two steps": TWO_STEPS,
  "Empty": EMPTY,
} satisfies Record<string, StepRevealVM>;

export type StepRevealFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: StepRevealFixtureName = "Step 2";
