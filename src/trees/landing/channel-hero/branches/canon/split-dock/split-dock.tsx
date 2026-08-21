/**
 * Split Dock — a leaf on Channel Hero / Canon.
 *
 * PURE PRESENTATION. Its props ARE ChannelHeroVM.
 *
 * Structural answer: a 60/40 split. The headline owns the left column and the
 * channel — avatar, live strip — owns the right, so the identity reads as a
 * *card sitting beside* the claim rather than as decoration on top of it. The
 * link grid spans both columns underneath, which is what lets this leaf carry a
 * long link list without the headline column getting narrow.
 *
 * This is the leaf that most closely answers laughingwhales.com's own hero, and
 * it is the one to reach for when porting that page into the forest.
 *
 * ── Why every breakpoint here is a CONTAINER query ─────────────────────────
 * A leaf is dropped into whatever column its consumer has. It is never told how
 * wide the window is, and it must not care: the lab shows two leaves side by
 * side, so on a 1440px desktop this leaf renders in 548px — where a `md:`
 * viewport rule would happily open a 60/40 split with a 303px headline column
 * carrying 60px type. `@container` measures the box the leaf was actually
 * given, which is the only width that was ever true.
 */

import Image from "next/image";

import type { LeafMeta } from "@/lib/forest";
import { cn } from "@/lib/utils";
import { staggerAt } from "../../../channel-hero.vm";
import type { ChannelHeroVM } from "../../../channel-hero.vm";

export const meta: LeafMeta = {
  label: "Split Dock",
  description:
    "60/40 split — headline left, channel card right, link grid spanning both. The closest match to laughingwhales.com's hero.",
  sizeHint: "lg",
  tags: ["split", "portable", "link-grid"],
};

/** Entrance offsets. Index order is reading order; the VM owns the curve. */
const LEAD = 0;
const HIGHLIGHT = 1;
const SUB = 2;
const ACTIONS = 3;
const CARD = 4;
const LINKS = 5;
const BANDS = 6;

function enter(vm: ChannelHeroVM, index: number) {
  const t = vm.reducedMotion ? 1 : staggerAt(vm.progress, index, BANDS);
  return {
    opacity: t,
    transform: `translateY(${((1 - t) * 14).toFixed(2)}px)`,
  };
}

export function ChannelHeroSplitDock(vm: ChannelHeroVM) {
  if (vm.state === "empty") {
    return (
      <section className="@container rounded-lg border border-dashed border-border p-8 text-center @md:p-12">
        <p className="text-sm text-muted-foreground">No channel to introduce yet.</p>
      </section>
    );
  }

  if (vm.state === "loading") {
    return (
      <section aria-busy="true" className="@container grid grid-cols-1 gap-8 py-10 @3xl:grid-cols-12">
        <div className="space-y-4 @3xl:col-span-7">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-14 w-full rounded bg-muted" />
          <div className="h-14 w-4/5 rounded bg-muted" />
          <div className="h-4 w-3/5 rounded bg-muted" />
        </div>
        <div className="@3xl:col-span-5">
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
        <span className="sr-only">Loading channel…</span>
      </section>
    );
  }

  return (
    <section data-state={vm.state} className="@container py-8">
      {/* The split opens at 48rem of CONTAINER, not of window. Below that the
          claim and the channel card stack, which is the same answer a phone
          gets and the same answer a narrow sidebar gets. */}
      <div className="grid grid-cols-1 items-start gap-8 @3xl:grid-cols-12 @3xl:gap-10">
        {/* LEFT — the claim */}
        <div className="flex min-w-0 flex-col gap-6 @3xl:col-span-7">
          <p
            style={enter(vm, LEAD)}
            /* A handle is one unbreakable token. Long ones ("@skillcheckk_official_backup_account")
               overflowed a phone-width column and scrolled the whole page sideways — the fixture
               was right about the input, so the leaf has to be right about the width. */
            className="max-w-full truncate font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground transition-none"
          >
            {vm.channelHandle}
          </p>

          <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-foreground @sm:text-4xl @xl:text-5xl @4xl:text-6xl">
            <span style={enter(vm, LEAD)} className="block">
              {vm.headlineLead}
            </span>
            {vm.headlineBadge ? (
              <span
                style={enter(vm, LEAD)}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 align-middle text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                {vm.headlineBadge.image ? (
                  <Image
                    unoptimized
                    src={vm.headlineBadge.image.src}
                    alt={vm.headlineBadge.image.alt}
                    width={vm.headlineBadge.image.width}
                    height={vm.headlineBadge.image.height}
                    className="h-4 w-auto opacity-70"
                  />
                ) : null}
                {vm.headlineBadge.label}
              </span>
            ) : null}
            {/*
              The highlight owns its own line here, so the marker plate the
              other canon leaf uses would paint a whole display row. The rule
              is the same fix by a different route: the letterform stays in
              `text-foreground`, which is contrast-guaranteed, and the
              creator's colour moves into a NON-TEXT element underneath it,
              where no contrast ratio is owed. `decoration-clone` is not needed
              — a border is drawn once around the block, not per line.
            */}
            <span
              style={enter(vm, HIGHLIGHT)}
              className="mt-1 block w-fit border-b-[0.12em] border-primary pb-1"
            >
              {vm.headlineHighlight}
            </span>
          </h1>

          {vm.subheadline ? (
            <p
              style={enter(vm, SUB)}
              className="max-w-xl text-pretty text-base text-muted-foreground @xl:text-lg"
            >
              {vm.subheadline}
            </p>
          ) : null}

          {vm.actions.length > 0 ? (
            <div style={enter(vm, ACTIONS)} className="flex flex-wrap items-center gap-3">
              {vm.actions.map((action, index) => (
                <a
                  key={action.id}
                  href={action.href}
                  title={action.tooltip}
                  onClick={action.onActivate}
                  rel={action.external ? "noreferrer" : undefined}
                  target={action.external ? "_blank" : undefined}
                  data-kind={action.kind}
                  className={cn(
                    "inline-flex flex-col rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    index === 0
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border text-muted-foreground hover:border-ring hover:text-foreground",
                  )}
                >
                  {action.eyebrow ? (
                    <span className="text-[0.625rem] font-medium uppercase tracking-[0.16em] opacity-70">
                      {action.eyebrow}
                    </span>
                  ) : null}
                  <span>{action.label}</span>
                  {action.detail ? (
                    <span className="text-xs font-normal opacity-70">{action.detail}</span>
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {/* RIGHT — the channel card */}
        <aside style={enter(vm, CARD)} className="min-w-0 @3xl:col-span-5">
          <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
            <div className="flex items-center gap-4">
              {vm.channelAvatar ? (
                <Image
                  unoptimized
                  src={vm.channelAvatar.src}
                  alt={vm.channelAvatar.alt}
                  width={vm.channelAvatar.width}
                  height={vm.channelAvatar.height}
                  className="size-14 shrink-0 rounded-full"
                />
              ) : (
                <span
                  aria-hidden
                  className="size-14 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{vm.channelName}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {vm.channelHandle}
                </p>
              </div>
            </div>

            {vm.status ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full",
                      vm.state === "live" ? "bg-destructive" : "bg-muted-foreground",
                      // The pulse is the one moving thing in this leaf, and it
                      // only exists while the channel is actually live.
                      vm.state === "live" && !vm.reducedMotion && "animate-pulse",
                    )}
                  />
                  <span className={vm.state === "live" ? "text-destructive" : "text-muted-foreground"}>
                    {vm.status.label}
                  </span>
                </p>
                {vm.status.title ? (
                  <p className="mt-2 text-pretty text-sm font-medium">{vm.status.title}</p>
                ) : null}
                <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {vm.status.category ? (
                    <div className="flex gap-1">
                      <dt className="sr-only">Category</dt>
                      <dd>{vm.status.category}</dd>
                    </div>
                  ) : null}
                  {vm.status.audience ? (
                    <div className="flex gap-1">
                      <dt className="sr-only">Audience</dt>
                      <dd>{vm.status.audience}</dd>
                    </div>
                  ) : null}
                  {vm.status.elapsed ? (
                    <div className="flex gap-1">
                      <dt className="sr-only">Elapsed</dt>
                      <dd>{vm.status.elapsed}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {vm.links.length > 0 ? (
        <div style={enter(vm, LINKS)} className="mt-12">
          {vm.linksEyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {vm.linksEyebrow}
            </p>
          ) : null}
          <ul className="mt-4 grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
            {vm.links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  onClick={link.onActivate}
                  data-icon={link.iconId}
                  data-recommended={link.recommended}
                  className={cn(
                    "flex h-full flex-col rounded-xl border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    link.recommended
                      ? "border-ring bg-card"
                      : "border-border hover:border-ring hover:bg-card",
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">{link.label}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{link.detail}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default ChannelHeroSplitDock;
