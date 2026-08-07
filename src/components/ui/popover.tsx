"use client";

/**
 * shadcn/ui — Popover (Radix primitive).
 *
 * Bare for the same reason as `tabs.tsx`: the look belongs to the leaf. What
 * this buys is the part a leaf must not do — collision-aware placement, focus
 * trapping, dismiss on outside-click and Escape, and the `data-side` /
 * `data-state` attributes leaves animate against.
 *
 * Placement is *requested* by the VM (`overlay.side` / `overlay.align`) and
 * *resolved* by Radix against the real viewport. That split is deliberate: the
 * intent is data, the measurement is not a leaf's business.
 */

import * as PopoverPrimitive from "@radix-ui/react-popover";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverPortal = PopoverPrimitive.Portal;
export const PopoverContent = PopoverPrimitive.Content;
export const PopoverArrow = PopoverPrimitive.Arrow;
export const PopoverClose = PopoverPrimitive.Close;
