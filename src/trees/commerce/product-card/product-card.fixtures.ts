/**
 * Product Card — fixtures.
 *
 * `sample` is the coherence engine: hand it a raw product record — amounts in
 * minor units, a stock flag, where the add has got to — and every string on the
 * card is derived through the SAME helpers the container uses. So the badge
 * agrees with the struck price, the struck price agrees with the discount, and
 * the button's copy agrees with `state`. A fixture cannot describe a card the
 * running component could not produce.
 *
 * That matters more here than anywhere else in the forest, because these
 * fixtures are the only place the money arithmetic is ever checked. Type them
 * by hand — `discountLabel: "− 50%"` next to a price that is 60% off — and the
 * suite starts asserting against a lie.
 *
 * Every string is frozen on purpose: `formatMoney` runs at module load with an
 * explicit locale, so the same run happens on every machine.
 */

import { LAB_CYCLE_MS } from "@/lib/lab-clock";

import {
  clampProgress,
  compareAtPrice,
  formatMoney,
  normaliseBadges,
  percentOffLabel,
  resolveAdd,
  resolveFavorite,
  resolveProductCardState,
  specLine,
  type ProductCardBadge,
  type ProductCardChoice,
  type ProductCardCommitPhase,
  type ProductCardMedia,
  type ProductCardSpec,
  type ProductCardVM,
} from "./product-card.vm";

const noop = () => {};

const PHOTO: ProductCardMedia = {
  src: "/forest/product-placeholder.svg",
  alt: "Merano Chair in oak, three-quarter view",
  width: 480,
  height: 480,
};

/** The raw record. Everything on the card is derived from this. */
type Record_ = {
  id: string;
  brand: string | null;
  title: string;
  href: string | null;
  media: ProductCardMedia;
  currency: string;
  /** Minor units — cents. Never a decimal; see `formatMoney`. */
  priceMinor: number;
  compareAtMinor: number | null;
  priceNote: string | null;
  badges: ProductCardBadge[];
  rating: { value: string; count: string | null; outOf: string } | null;
  specs: ProductCardSpec[];
  specUnit: string | null;
  option: { label: string; choices: Array<{ id: string; label: string; available: boolean }>; selectedId: string } | null;
  note: string | null;
};

const MERANO: Record_ = {
  id: "merano-chair",
  brand: "TON",
  title: "Merano Chair",
  href: "/shop/merano-chair",
  media: PHOTO,
  currency: "USD",
  priceMinor: 19_900,
  compareAtMinor: 39_900,
  priceNote: null,
  badges: [{ id: "sale", label: "", tone: "promo" }],
  rating: { value: "4.9", count: "218", outOf: "5" },
  specs: [
    { id: "w", label: "W", value: "58" },
    { id: "h", label: "H", value: "79" },
    { id: "d", label: "D", value: "60" },
  ],
  specUnit: "cm",
  option: {
    label: "Material",
    selectedId: "oak",
    choices: [
      { id: "oak", label: "Oak", available: true },
      { id: "walnut", label: "Walnut", available: true },
      { id: "ash", label: "Ash", available: false },
    ],
  },
  note: null,
};

type SampleInput = {
  record?: Record_;
  phase?: ProductCardCommitPhase;
  progress?: number;
  inStock?: boolean;
  favorited?: boolean;
  reducedMotion?: boolean;
};

/**
 * One coherent card at one instant.
 *
 * The order here is the container's order: state first, because the button's
 * copy, its disabled flag and the transport all hang off it.
 */
function sample({
  record = MERANO,
  phase = "idle",
  progress,
  inStock = true,
  favorited = false,
  reducedMotion = false,
}: SampleInput): ProductCardVM {
  const state = resolveProductCardState(inStock, phase);
  const settled = phase === "added" ? 1 : phase === "idle" ? 0 : 0.5;

  const discountLabel = percentOffLabel(record.priceMinor, record.compareAtMinor);
  const compareAt = compareAtPrice(
    record.priceMinor,
    record.compareAtMinor,
    record.currency,
  );
  const saving =
    record.compareAtMinor !== null && record.compareAtMinor > record.priceMinor
      ? `Save ${formatMoney(record.compareAtMinor - record.priceMinor, record.currency)}`
      : null;

  // The discount badge is not typed anywhere — it is the same computation the
  // price uses, so the two can never disagree.
  const badges = normaliseBadges(
    record.badges
      .map((badge) =>
        badge.id === "sale" ? { ...badge, label: discountLabel ?? "" } : badge,
      )
      .filter((badge) => badge.label !== ""),
  );

  const option = record.option
    ? {
        label: record.option.label,
        selectedLabel:
          record.option.choices.find((choice) => choice.id === record.option?.selectedId)
            ?.label ?? record.option.choices[0]?.label ?? "",
        choices: record.option.choices.map<ProductCardChoice>((choice) => {
          const selected = choice.id === record.option?.selectedId;
          return {
            id: choice.id,
            label: choice.label,
            selected,
            available: choice.available,
            onSelect: selected || !choice.available ? null : noop,
          };
        }),
      }
    : null;

  return {
    state,
    progress: clampProgress(progress ?? settled),
    reducedMotion,
    brand: record.brand,
    title: record.title,
    href: record.href,
    media: record.media,
    badges,
    price: {
      current: formatMoney(record.priceMinor, record.currency),
      compareAt,
      discountLabel,
      savingLabel: saving,
      note: record.priceNote,
    },
    rating: record.rating
      ? {
          value: record.rating.value,
          label: record.rating.count
            ? `${record.rating.value} out of ${record.rating.outOf} — ${record.rating.count} reviews`
            : `${record.rating.value} out of ${record.rating.outOf}`,
          count: record.rating.count,
        }
      : null,
    specs: record.specs,
    specLine: specLine(record.specs, record.specUnit),
    option,
    add: resolveAdd(state, record.title, noop),
    favorite: resolveFavorite(favorited, noop),
    note: record.note,
  };
}

/* ------------------------------------------------------------------ *
 * The frozen fixtures.
 * ------------------------------------------------------------------ */

/** The card at rest — the design this tree was drawn from, and the state that has to be good. */
export const AVAILABLE = sample({});

/** Mid-commit. `progress` is moving and the button cannot be pressed twice. */
export const ADDING = sample({ phase: "adding", progress: 0.45 });

/** Just landed. The commit settled at 1 and stays there. */
export const ADDED = sample({ phase: "added" });

/**
 * Sold out. The card renders in FULL — picture, price, specs — because a card
 * that collapses to a grey box is a card the customer cannot compare against
 * the one next to it, and comparing is why they are still on the page.
 */
export const UNAVAILABLE = sample({
  inStock: false,
  record: { ...MERANO, note: "Back in stock in March", compareAtMinor: null, badges: [] },
});

/** No discount at all: no badge, no strikethrough, no saving line. */
export const FULL_PRICE = sample({
  record: { ...MERANO, priceMinor: 39_900, compareAtMinor: null, badges: [] },
});

/** Saved. The only reversible press on the card, on its other side. */
export const SAVED = sample({ favorited: true });

/** Reduced motion, mid-commit — every leaf must render the settled frame. */
export const REDUCED_MOTION = sample({ phase: "adding", progress: 0.45, reducedMotion: true });

/**
 * A price with cents, a tax note and a saving line. `formatMoney` keeps two
 * decimals here and none on `$ 199` — the rule is the amount, not the card.
 */
export const FRACTIONAL_PRICE = sample({
  record: {
    ...MERANO,
    priceMinor: 129_950,
    compareAtMinor: 149_900,
    priceNote: "incl. VAT · free delivery",
    // Two badges both asking to be the loud one. `normaliseBadges` demotes the
    // second, so the card keeps both facts and still has exactly one signal.
    badges: [
      { id: "sale", label: "", tone: "promo" },
      { id: "new", label: "New", tone: "promo" },
    ],
  },
});

/**
 * A discount that rounds DOWN. 33.4% off is advertised as 33%, and the badge,
 * the struck price and the saving line all come out of the same call — which is
 * the entire argument for this tree.
 */
export const ROUNDING = sample({
  record: { ...MERANO, priceMinor: 19_900, compareAtMinor: 29_900 },
});

/** Long copy everywhere. Nothing may be silently truncated. */
export const LONG_COPY = sample({
  record: {
    ...MERANO,
    brand: "Thonet & Söhne Möbelmanufaktur",
    title: "Merano Bentwood Dining Chair with Upholstered Seat and Solid Oak Frame",
    note: "Only 2 left at this price — made to order, ships in 6–8 weeks",
    option: {
      label: "Material and finish",
      selectedId: "oak",
      choices: [
        { id: "oak", label: "European oak, natural oil", available: true },
        { id: "walnut", label: "American walnut, satin lacquer", available: true },
      ],
    },
  },
});

/** Eight choices. A swatch row that only works at three is a swatch row that does not work. */
export const MANY_OPTIONS = sample({
  record: {
    ...MERANO,
    option: {
      label: "Material",
      selectedId: "walnut",
      choices: [
        { id: "oak", label: "Oak", available: true },
        { id: "walnut", label: "Walnut", available: true },
        { id: "ash", label: "Ash", available: false },
        { id: "beech", label: "Beech", available: true },
        { id: "maple", label: "Maple", available: true },
        { id: "cherry", label: "Cherry", available: true },
        { id: "black", label: "Black stain", available: true },
        { id: "white", label: "White stain", available: false },
      ],
    },
  },
});

/**
 * Missing optionals: no brand, no rating, no specs, no option, no link. The
 * card must not grow a placeholder for any of them.
 */
export const MISSING_OPTIONALS = sample({
  record: {
    ...MERANO,
    brand: null,
    href: null,
    rating: null,
    specs: [],
    specUnit: null,
    option: null,
    compareAtMinor: null,
    badges: [],
  },
});

/** The bare minimum the contract allows: a picture, a name, a price, a button. */
export const MINIMAL = sample({
  record: {
    ...MERANO,
    brand: null,
    href: null,
    title: "Stool",
    rating: null,
    specs: [],
    specUnit: null,
    option: null,
    compareAtMinor: null,
    priceNote: null,
    badges: [],
    note: null,
  },
});

/**
 * The lab's clock. One complete add per cycle: rest, commit, confirmed, rest.
 * Sweeping `progress` alone would leave the card adding forever, which is the
 * one thing a real add never does.
 */
export function frameAt(progress: number): ProductCardVM {
  const p = clampProgress(progress);
  if (p < 0.15) return sample({});
  if (p < 0.5) return sample({ phase: "adding", progress: (p - 0.15) / 0.35 });
  if (p < 0.85) return sample({ phase: "added", progress: 1 });
  return sample({});
}

/** How long one add cycle takes in the lab. */
export const CYCLE_MS = LAB_CYCLE_MS;

/** Label -> fixture. The lab renders one button per entry, in this order. */
export const ALL_FIXTURES = {
  "Available": AVAILABLE,
  "Adding — t=0.45": ADDING,
  "Added": ADDED,
  "Saved": SAVED,
  "Reduced motion": REDUCED_MOTION,
  "Full price": FULL_PRICE,
  "Cents and tax": FRACTIONAL_PRICE,
  "Rounding — 33% off": ROUNDING,
  "Long copy": LONG_COPY,
  "Many options — 8": MANY_OPTIONS,
  "Missing optionals": MISSING_OPTIONALS,
  "Minimal": MINIMAL,
  "Unavailable": UNAVAILABLE,
} satisfies Record<string, ProductCardVM>;

export type ProductCardFixtureName = keyof typeof ALL_FIXTURES;

export const DEFAULT_FIXTURE: ProductCardFixtureName = "Available";
