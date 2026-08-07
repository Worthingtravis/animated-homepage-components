"use client";

/**
 * shadcn/ui — Hover Card (Radix primitive).
 *
 * Hover intent is genuinely hard: open delay, close delay, a safe triangle
 * between trigger and card, pointer-vs-touch detection, and never opening for
 * keyboard users who only tabbed past. Radix does all of it, and it does it
 * without the leaf owning a timer — which is what makes hover previews
 * expressible at all under this repo's no-hooks rule.
 *
 * Uncontrolled on purpose. A hover preview is transient pointer feedback, not
 * application state: routing it through the VM would mean a re-render of every
 * panel each time the pointer crossed a tab, and would put a `hoveredTabId`
 * field in a contract that has no use for one. The VM still decides *whether*
 * there is anything to preview (`tab.preview`) and *what it says* — only the
 * open/closed instant is left to the primitive.
 */

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export const HoverCardPortal = HoverCardPrimitive.Portal;
export const HoverCardContent = HoverCardPrimitive.Content;
export const HoverCardArrow = HoverCardPrimitive.Arrow;
