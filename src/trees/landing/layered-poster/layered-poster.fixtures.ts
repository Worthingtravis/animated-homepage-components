/**
 * Layered Poster — fixtures.
 *
 * One fixture per visual state, driveable with zero hooks and zero network.
 * These are the *only* inputs the lab uses, and every leaf must survive all of
 * them.
 *
 * The plate art is local placeholder vector, not the artwork the original
 * block streams from its own CDN. The contract takes `src` as a plain string,
 * so a consumer points it at whatever illustration they actually own — the
 * fixtures only have to prove the depth mechanic, which flat shapes do better
 * than photographs anyway.
 */

import {
  clampProgress,
  normalizeDepths,
  resolveLayeredPosterState,
  type LayeredPosterLayer,
  type LayeredPosterVM,
} from "./layered-poster.vm";

const noop = () => {};

/**
 * Plates as an illustrator hands them over: a file and the overscan it was
 * composed at. `normalizeDepths` is what turns that into the contract's 0..1,
 * and running it HERE rather than typing depths by hand is the point — the
 * fixture proves the container's own normalization step.
 */
const PLATES = normalizeDepths([
  { file: "poster-plate-1-sky", name: "Sunset sky", initialScale: 1.24, revealAt: 0.06 },
  { file: "poster-plate-2-skyline", name: "Skyline", initialScale: 1.46, revealAt: 0.13 },
  { file: "poster-plate-3-palms", name: "Palms", initialScale: 1.72, revealAt: 0.2 },
  { file: "poster-plate-4-road", name: "Road", initialScale: 1.98, revealAt: 0.27 },
  { file: "poster-plate-5-car", name: "Car", initialScale: 2.34, revealAt: 0.34 },
  { file: "poster-plate-6-figure", name: "Figure", initialScale: 2.72, revealAt: 0.41 },
  { file: "poster-plate-7-frame", name: "Frame", initialScale: 3.1, revealAt: 0.48 },
  { file: "poster-plate-8-hole", name: "Logo hole", initialScale: 3.31, revealAt: 0.6 },
]);

const LAYERS: LayeredPosterLayer[] = [
  ...PLATES.map((plate) => ({
    id: plate.file,
    image: { src: `/forest/${plate.file}.svg`, alt: plate.name, width: 1000, height: 1000 },
    depth: plate.depth,
    revealAt: plate.revealAt,
    reveal: "fade" as const,
    focusPull: false,
  })),
  // The logo is last and it is the only plate that pulls focus. It wipes up
  // out of blur into a hole the art already left for it.
  {
    id: "poster-plate-9-logo",
    image: {
      src: "/forest/poster-plate-9-logo.svg",
      alt: "Late Nights wordmark",
      width: 1000,
      height: 1000,
    },
    depth: 0,
    revealAt: 0.7,
    reveal: "wipe-up",
    focusPull: true,
  },
];

const BASE: LayeredPosterVM = {
  state: "arriving",
  progress: 0,
  reducedMotion: false,
  title: "Late Nights — season three key art",
  caption: "Late Nights · season three · streaming now",
  layers: LAYERS,
  cameraScale: 1.14,
  fit: 0.96,
  replay: { label: "Replay", onActivate: noop },
};

const fixture = (overrides: Partial<LayeredPosterVM>): LayeredPosterVM => ({
  ...BASE,
  ...overrides,
});

/**
 * The continuum: a coherent VM at any point on the transport.
 *
 * `state` is derived through the same helper the container uses, so a leaf that
 * reads "settled" in the lab reads "settled" in production at the same instant.
 */
export function frameAt(
  progress: number,
  overrides: Partial<LayeredPosterVM> = {},
): LayeredPosterVM {
  const clamped = clampProgress(progress);
  return fixture({
    progress: clamped,
    state: resolveLayeredPosterState({
      layerCount: BASE.layers.length,
      isLoading: false,
      progress: clamped,
    }),
    ...overrides,
  });
}

/** The camera has only just started: everything is overscanned and absent. */
const ARRIVING = frameAt(0.04);
/** Mid-entrance — the art is landing, the logo has not arrived. */
const MID_ENTRANCE = frameAt(0.42);
/** The instant the logo starts its wipe. The frame this tree exists for. */
const LOGO_LANDING = frameAt(0.74);
/** Fully arrived. */
const SETTLED = frameAt(1);

/** Reduced motion: the resting frame, immediately. No entrance at all. */
const REDUCED_MOTION = frameAt(0, { reducedMotion: true, state: "settled" });

/** No caption, no replay — the sheet on its own. */
const BARE = frameAt(1, { caption: null, replay: null });

/** A long caption. Poster furniture has to wrap without moving the art. */
const LONG_COPY = frameAt(1, {
  caption:
    "Late Nights · season three · shot across four cities over eleven months with a crew that never once agreed about the ending, streaming now, everywhere, probably later than advertised",
  title:
    "Late Nights — season three key art, a sunset skyline with a car in the foreground and the wordmark cut through the middle",
});

/** Two plates. A stack this shallow must still read as a stack, not a picture. */
const SHALLOW = frameAt(1, { layers: LAYERS.slice(0, 2) });

/** Every plate flat on the sheet: depth 0 throughout. The camera is all there is. */
const NO_DEPTH = frameAt(0.5, {
  layers: LAYERS.map((layer) => ({ ...layer, depth: 0 })),
});

/** A hard camera move — the caller pushed the overscan well past the default. */
const DEEP_CAMERA = frameAt(0.3, { cameraScale: 1.6, fit: 0.8 });

/** The sheet held small inside whatever box it was handed. */
const TIGHT_FIT = frameAt(1, { fit: 0.62 });

const LOADING = fixture({ state: "loading", progress: 0, layers: [] });
const EMPTY = fixture({ state: "empty", progress: 0, layers: [], caption: null, replay: null });

export const ALL_FIXTURES: Record<string, LayeredPosterVM> = {
  Arriving: ARRIVING,
  "Mid entrance": MID_ENTRANCE,
  "Logo landing": LOGO_LANDING,
  Settled: SETTLED,
  "Reduced motion": REDUCED_MOTION,
  "Bare — no optionals": BARE,
  "Long copy": LONG_COPY,
  "Shallow stack": SHALLOW,
  "No depth": NO_DEPTH,
  "Deep camera": DEEP_CAMERA,
  "Tight fit": TIGHT_FIT,
  Loading: LOADING,
  Empty: EMPTY,
};

export const DEFAULT_FIXTURE = "Logo landing";
