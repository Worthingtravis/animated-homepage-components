/**
 * Product Card — ViewModel contract.
 *
 * THE CONTRACT IS THE TREE. Every leaf under every branch renders from exactly
 * this type and nothing else.
 *
 * ── What this tree is for ──────────────────────────────────────────────────
 * One purchasable thing, on a card: a picture, what it is, what it costs, and
 * the two presses a card is allowed to own — save it, and put it in the bag.
 *
 * ── Why it is its own tree, and not a leaf on `disclosure/expandable-card` ──
 * Because of the money. A product card looks like a content card and is not
 * one: almost every value on it is the *result of arithmetic that must not
 * happen in presentation*.
 *
 *   "− 50%"           two amounts and a rounding rule
 *   "$ 399" struck    a compare-at price that only exists when it is higher
 *   "$ 199"           minor units, a currency, a locale, and possibly tax
 *   "4.9"             a mean with a fixed number of decimal places
 *   "58 × 79 × 60"    three measurements, a separator and a unit
 *
 * Every one of those is a `toFixed`, an `Intl.NumberFormat` or a `join` — and
 * every one of them is a bug that reaches a customer if a leaf gets it wrong.
 * Prices rendered by presentation are how a card ends up saying "$ 199.00" in
 * one variant and "$199" in another, and how a 33% discount becomes 34% in the
 * variant that rounds the other way. So the contract carries them **finished**:
 * a leaf on this tree receives strings it is not allowed to touch, and the one
 * place the arithmetic lives is `formatMoney` / `percentOffLabel` / `specLine`
 * below, running in the container.
 *
 * The conformance suite already bans `toFixed` and `toLocaleString` on a VM
 * value inside a leaf. This tree is the one where that rule earns its keep.
 *
 * ── Transport ──────────────────────────────────────────────────────────────
 * `progress` runs 0..1 across ONE add-to-bag — press to confirmed — and settles
 * at 1. It is not a loop and not a scroll position. A resting card sits at 0.
 * That is the only motion this tree has, because it is the only moment on a
 * product card where something actually happens.
 *
 * Rules (from the extract-vm skill — do not relax them here):
 *  - Every displayed value is a PRE-FORMATTED string.
 *  - Every user action is a callback. Never an id a leaf resolves against state.
 *  - Transport (`progress`) is a VM prop. The container owns the clock.
 *  - Branching is an explicit state string, never a derived `a && !b` check.
 *  - No hooks, no fetches, no side effects in this file.
 */

/**
 * Explicit visual state. Leaves switch on this — never on `add.disabled` and
 * never on `progress > 0`.
 *
 *  - `available`   the resting card, and the state that has to be good.
 *  - `adding`      the commit is in flight. `progress` is moving.
 *  - `added`       it is in the bag. `progress` has settled at 1.
 *  - `unavailable` sold out, unreleased, not shippable here. The card still
 *                  renders in full — see `note`.
 */
export type ProductCardState = "available" | "adding" | "added" | "unavailable";

/**
 * Ready for `next/image`. Dimensions travel with the source because a leaf may
 * not measure and must not guess — an intrinsic size is the difference between
 * a grid that settles and a grid that reflows on every load.
 */
export type ProductCardMedia = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * A badge over the picture — `"− 50%"`, `"Oak"`, `"New"`.
 *
 * `tone` is the only thing a leaf is told about importance, because a leaf
 * cannot know that 50% off matters more than the wood finish. `promo` earns
 * the creator's accent fill; at most one per card, enforced by the container.
 */
export type ProductCardBadge = {
  id: string;
  label: string;
  tone: "promo" | "quiet";
};

/**
 * Money, finished. Every field is a string a leaf prints verbatim.
 *
 * `compareAt` is null unless it is genuinely higher than `current` — a leaf
 * must never decide whether a strikethrough is warranted, because "is this a
 * discount" is a pricing question, not a styling one.
 */
export type ProductCardPrice = {
  /** What it costs now. `"$ 199"`. */
  current: string;
  /** What it cost before, already known to be higher. `"$ 399"`, or null. */
  compareAt: string | null;
  /** `"− 50%"`, or null when there is nothing off. */
  discountLabel: string | null;
  /** `"Save $ 200"`, or null. Separate from `discountLabel` so a leaf can pick. */
  savingLabel: string | null;
  /** Delivery, tax or unit line — `"incl. VAT"`, `"per m²"`. Pre-formatted. */
  note: string | null;
};

/** A rating, already rounded. `value` is a string for exactly that reason. */
export type ProductCardRating = {
  /** `"4.9"`. Never a number — the decimal count is a product decision. */
  value: string;
  /** `"4.9 out of 5 — 218 reviews"`. What a screen reader gets. */
  label: string;
  /** `"218"`, or null when the count is not shown. */
  count: string | null;
};

/** One measurement. `"W"` / `"58"`. The unit lives on the group, not the row. */
export type ProductCardSpec = {
  id: string;
  label: string;
  value: string;
};

/**
 * One choice of a variant — a wood, a size, a colourway.
 *
 * `onSelect` is null when the choice is the current one or cannot be taken;
 * `available` says which. An unavailable choice is kept rather than dropped,
 * because a card that loses a swatch when it sells out is a card that changes
 * width while somebody is reading it.
 */
export type ProductCardChoice = {
  id: string;
  label: string;
  selected: boolean;
  available: boolean;
  onSelect: (() => void) | null;
};

export type ProductCardOption = {
  /** `"Material"`. The group's name, for the label a leaf may or may not show. */
  label: string;
  /** `"Oak"` — the selected choice, pre-resolved so no leaf runs `.find()`. */
  selectedLabel: string;
  choices: ProductCardChoice[];
};

/**
 * The commit. `label` is resolved by the container per state
 * (`resolveAddLabel`) so no leaf writes the copy for "Adding…" — that string
 * belongs to the shop, not to a variant.
 */
export type ProductCardCommit = {
  label: string;
  /** What a screen reader gets — includes the product. `"Add Merano Chair to bag"`. */
  a11yLabel: string;
  onActivate: (() => void) | null;
  disabled: boolean;
};

/** The reversible press. A heart, and nothing more consequential than a heart. */
export type ProductCardToggle = {
  label: string;
  active: boolean;
  onToggle: (() => void) | null;
};

export type ProductCardVM = {
  /** Explicit visual state. Leaves switch on this. */
  state: ProductCardState;

  /** 0..1 across the current add-to-bag. Rests at 0, settles at 1. */
  progress: number;

  /** True when the viewer asked for reduced motion. Leaves must honour it. */
  reducedMotion: boolean;

  /** `"TON"`. Null for an own-brand shop where repeating it is noise. */
  brand: string | null;
  title: string;
  /** The product page. Null when the card is the whole surface (a quick-shop). */
  href: string | null;

  media: ProductCardMedia;
  /** Over the picture, in order. May be empty. */
  badges: ProductCardBadge[];

  price: ProductCardPrice;
  rating: ProductCardRating | null;

  /** `[{ label: "W", value: "58" }, …]`. May be empty. */
  specs: ProductCardSpec[];
  /** The same specs as one line — `"58 × 79 × 60 cm"`. Built by `specLine`. */
  specLine: string | null;

  option: ProductCardOption | null;

  add: ProductCardCommit;
  favorite: ProductCardToggle;

  /** Stock or delivery line — `"Only 2 left"`, `"Back in stock in March"`. */
  note: string | null;
};

/* ------------------------------------------------------------------ *
 * Pure helpers. These run in the CONTAINER (or in fixtures), never in a leaf.
 * ------------------------------------------------------------------ */

/** Clamp arbitrary transport input into the 0..1 the contract promises. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Where the add-to-bag has got to. The container's own bookkeeping. */
export type ProductCardCommitPhase = "idle" | "adding" | "added";

/**
 * Collapse stock and the commit into one state string.
 *
 * `unavailable` beats everything: a commit in flight against something that
 * just sold out is a failed commit, not an animation, and a leaf that had to
 * work that out from two booleans would get it wrong in one variant out of
 * four.
 */
export function resolveProductCardState(
  inStock: boolean,
  phase: ProductCardCommitPhase,
): ProductCardState {
  if (!inStock) return "unavailable";
  if (phase === "adding") return "adding";
  if (phase === "added") return "added";
  return "available";
}

/**
 * Money, in one place.
 *
 * Amounts arrive in MINOR UNITS (cents) because that is the only representation
 * that survives arithmetic — `19.99 + 0.01` is not `20` in binary floating
 * point, and a cart that adds prices as decimals is a cart that eventually
 * charges a penny wrong.
 *
 * `maximumFractionDigits: 0` when the amount is whole is deliberate: the design
 * this tree was drawn from shows `$ 199`, not `$ 199.00`, and a trailing `.00`
 * on every price is the tell of a card that formatted late.
 */
export function formatMoney(
  amountMinor: number,
  currency: string,
  locale = "en-US",
): string {
  const amount = amountMinor / 100;
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

/**
 * `"− 50%"`, or null when there is nothing off.
 *
 * Rounds toward the *shop's* claim rather than the customer's: a 49.6% cut is
 * advertised as 49%, never 50%, because the second one is a number a regulator
 * reads differently from a designer. One rounding rule, one place.
 */
export function percentOffLabel(
  currentMinor: number,
  compareAtMinor: number | null,
): string | null {
  if (compareAtMinor === null) return null;
  if (compareAtMinor <= currentMinor) return null;
  const off = Math.floor(((compareAtMinor - currentMinor) / compareAtMinor) * 100);
  if (off <= 0) return null;
  return `− ${off}%`;
}

/**
 * The compare-at price, kept only when it is genuinely higher.
 *
 * This is the function that stops a leaf ever asking "should I strike this
 * through?" — by the time the VM exists, a struck price and a discount badge
 * are the same decision, already made.
 */
export function compareAtPrice(
  currentMinor: number,
  compareAtMinor: number | null,
  currency: string,
  locale?: string,
): string | null {
  if (compareAtMinor === null || compareAtMinor <= currentMinor) return null;
  return formatMoney(compareAtMinor, currency, locale);
}

/**
 * `"58 × 79 × 60 cm"` from the same rows a leaf shows as a labelled block.
 *
 * Both forms ship, because the two shapes of leaf on this tree genuinely need
 * different ones — a tile has room for a W/H/D header row, a list row has room
 * for one line — and if only the rows shipped, the list-row leaf would join
 * them itself, with its own separator, and the two variants would disagree.
 */
export function specLine(specs: ProductCardSpec[], unit: string | null): string | null {
  if (specs.length === 0) return null;
  const line = specs.map((spec) => spec.value).join(" × ");
  return unit ? `${line} ${unit}` : line;
}

/** The commit's copy, per state. The shop's words, not a variant's. */
export type ProductCardAddLabels = {
  available: string;
  adding: string;
  added: string;
  unavailable: string;
};

export const DEFAULT_ADD_LABELS: ProductCardAddLabels = {
  available: "Add to bag",
  adding: "Adding…",
  added: "In your bag",
  unavailable: "Sold out",
};

export function resolveAddLabel(
  state: ProductCardState,
  labels: ProductCardAddLabels = DEFAULT_ADD_LABELS,
): string {
  return labels[state];
}

/**
 * The commit, assembled. `disabled` covers three different reasons — sold out,
 * already in the bag, mid-flight — so a leaf renders one unpressable button
 * rather than three.
 */
export function resolveAdd(
  state: ProductCardState,
  title: string,
  onAdd: (() => void) | null,
  labels: ProductCardAddLabels = DEFAULT_ADD_LABELS,
): ProductCardCommit {
  const label = resolveAddLabel(state, labels);
  const disabled = state !== "available" || onAdd === null;
  return {
    label,
    a11yLabel: state === "available" ? `${label}: ${title}` : `${label} — ${title}`,
    onActivate: disabled ? null : onAdd,
    disabled,
  };
}

/** The heart's copy, per side of the toggle. */
export function resolveFavorite(
  active: boolean,
  onToggle: (() => void) | null,
  labels: { save: string; saved: string } = { save: "Save", saved: "Saved" },
): ProductCardToggle {
  return { label: active ? labels.saved : labels.save, active, onToggle };
}

/**
 * At most one `promo` badge.
 *
 * A card with three accent-filled badges has none — they stop being a signal
 * the moment they are a set. The container demotes the extras rather than
 * dropping them, so the wood finish still shows up next to the discount.
 */
export function normaliseBadges(badges: ProductCardBadge[]): ProductCardBadge[] {
  let promoUsed = false;
  return badges.map((badge) => {
    if (badge.tone !== "promo") return badge;
    if (promoUsed) return { ...badge, tone: "quiet" as const };
    promoUsed = true;
    return badge;
  });
}
