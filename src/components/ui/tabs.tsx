"use client";

/**
 * shadcn/ui — Tabs (Radix primitive, unstyled here on purpose).
 *
 * ── Why these are bare ─────────────────────────────────────────────────────
 * shadcn normally ships opinionated classes on these exports. In this repo the
 * *look* is the leaf's job — four leaves style the same primitive four
 * different ways — so styling baked in here would be a fifth opinion competing
 * with all of them, and it would live outside `src/trees/`, where nothing
 * enforces token discipline.
 *
 * What the primitive is actually here for is the part nobody should hand-roll:
 * roving tabindex, arrow-key and Home/End navigation, correct `role`/
 * `aria-controls`/`aria-selected` wiring, and typeahead.
 *
 * ── How a leaf stays pure while using this ─────────────────────────────────
 * Every piece is used CONTROLLED. `value` and `onValueChange` come from the VM,
 * and `forceMount` keeps mounting under the container's control rather than
 * Radix's — so a leaf renders exactly the panels the VM told it to, in exactly
 * the phase the VM resolved. No state crosses into the leaf.
 */

import * as TabsPrimitive from "@radix-ui/react-tabs";

export const Tabs = TabsPrimitive.Root;
export const TabsList = TabsPrimitive.List;
export const TabsTrigger = TabsPrimitive.Trigger;
export const TabsContent = TabsPrimitive.Content;
