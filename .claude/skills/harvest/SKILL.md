---
name: harvest
description: Copy a leaf out of this forest into a consuming app (laughingwhales.com, yapdrop.com, any Next.js project). Use when the user says "use this component in X", "port the hero to the site", "harvest orbit-glow".
user_invocable: true
argument-hint: <species>/<tree>/<branch>/<leaf> [target-repo-path]
---

# Harvest a Leaf

This forest is a curation repo, not a published package. Harvesting is a
deliberate copy — the consuming app owns its copy afterwards.

## What travels together

A leaf alone is useless. A harvest is always **four files minimum**:

```
<tree>.vm.ts             ← the contract          → app/view-models/
<tree>.fixtures.ts       ← every state           → app/view-models/
<leaf>.tsx               ← the look              → app/components/<domain>/
<tree>-connected.tsx     ← the wiring            → app/components/<domain>/
```

Take the fixtures. They are not test scaffolding — they are the reason a
designer can drive the component in the target app without a backend.

## Steps

1. **Confirm the leaf is green here first.** `pnpm test` and open
   `/lab/<species>/<tree>`. Never harvest something failing at home.

2. **Copy the four files** into the target repo's layout. Match the target's
   conventions over this repo's — if it uses `src/app/view-models/`, use that.

3. **Rewrite the imports.** `@/lib/forest` and `@/lib/use-forest-leaf` do not
   exist in the target. In the target, the container imports the leaf directly:

   ```tsx
   // here (registry-driven)
   const Leaf = useForestLeaf<AuroraHeadlineVM>("motion", "aurora-headline", variant);
   // there (direct)
   import { AuroraHeadlineOrbitGlow } from "./aurora-headline-orbit-glow";
   ```

   Drop `LeafMeta` and the `meta` export unless the target has its own registry.

4. **Reconcile tokens.** The leaf uses `text-foreground`, `bg-card`,
   `border-border`, `bg-primary`. If the target lacks one, map it to the
   target's equivalent — do **not** substitute a hardcoded color. If the target
   is a branded surface with fixed literals, note the exception in a comment at
   the top of the leaf (this is the documented extract-vm carve-out).

5. **Bring an experiments page.** The target's fixture-driven page for this
   component, wired to `ALL_FIXTURES`. If the target has no `experiments/`
   convention, add a `/<route>/lab` sibling to the component's own route.

6. **Verify in the target repo:** `npx tsc --noEmit`, its lint, its tests,
   then look at every fixture on the experiments page.

## Report back here

If the target revealed a gap — a state the fixtures did not cover, a token that
did not exist, a layout that broke at a width the lab never showed — fix it
**in this forest too**, or the next harvest hits the same wall. Add the missing
fixture here and say so in the report.

```
🧺 harvested motion/aurora-headline/experimental/orbit-glow → laughingwhales.com
   files: 4 copied, imports rewritten, tokens mapped 1:1
   fed back: added NARROW_COLUMN fixture (broke at 384px in the target)
```
