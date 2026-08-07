/**
 * The lab's clock.
 *
 * `TreeLab` sweeps `progress` 0 → 1 over this and then loops. It lives here
 * rather than inside the lab component because a tree's `frameAt` may need to
 * know it — `temporal/countdown` samples a window exactly this long so that one
 * second of wall clock is one second of countdown. If this constant moved and
 * the sampler could not see it, that tree would silently go back to running at
 * a few thousand times real speed.
 */
export const LAB_CYCLE_MS = 6000;
