/**
 * The three obligations, asserted once per leaf.
 *
 * The forest-wide suite proves a leaf renders. It cannot prove a leaf is
 * *reachable by the morph*, because the morph is a container behaviour that
 * only works if every leaf carries the handles: the anchor on each card, the id
 * on the panel, and the resolved surface style spread onto it.
 *
 * A leaf that quietly drops one of them looks perfect in the lab on a frozen
 * fixture and does nothing at all when a person presses it — which is the exact
 * failure this tree exists to make impossible. So it is a test, and it runs
 * against every leaf on the tree automatically, including ones not written yet.
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { allLeaves, findTree } from "@/lib/forest";
import { FOREST } from "@/trees/generated";

import { BROWSING, MORPH_MID } from "./expandable-card.fixtures";

afterEach(cleanup);

const tree = findTree(FOREST, "disclosure", "expandable-card");
const leaves = tree ? allLeaves(tree) : [];

describe("every leaf carries the morph's handles", () => {
  it("found the tree and its leaves", () => {
    expect(leaves.length).toBeGreaterThan(0);
  });

  it.each(leaves.map((leaf) => [leaf.ref, leaf.Component] as const))(
    "%s anchors every card",
    (_ref, Component) => {
      const { container } = render(<Component {...BROWSING} />);
      for (const card of BROWSING.cards) {
        expect(
          container.querySelector(`[data-expandable-card="${card.id}"]`),
          `no anchor for "${card.id}" — spread {...card.anchor} on the card's outermost element`,
        ).not.toBeNull();
      }
    },
  );

  it.each(leaves.map((leaf) => [leaf.ref, leaf.Component] as const))(
    "%s wires each trigger to the panel it opens",
    (_ref, Component) => {
      const { container } = render(<Component {...BROWSING} />);
      for (const card of BROWSING.cards) {
        const trigger = container.querySelector(`#${card.triggerId}`);
        expect(trigger, `no trigger with id "${card.triggerId}"`).not.toBeNull();
        expect(trigger?.getAttribute("aria-controls")).toBe(card.panelId);
      }
    },
  );

  it.each(leaves.map((leaf) => [leaf.ref, leaf.Component] as const))(
    "%s identifies the panel so the container can measure it",
    (_ref, Component) => {
      const { container } = render(<Component {...MORPH_MID} />);
      const panel = container.querySelector(`#${MORPH_MID.panel?.id}`);
      expect(panel, "no element carrying panel.id — the container measures through it").not.toBeNull();
    },
  );

  it.each(leaves.map((leaf) => [leaf.ref, leaf.Component] as const))(
    "%s spreads the resolved surface style rather than animating itself",
    (_ref, Component) => {
      const { container } = render(<Component {...MORPH_MID} />);
      const panel = container.querySelector<HTMLElement>(`#${MORPH_MID.panel?.id}`);
      // MORPH_MID is measured, so the container resolved a real FLIP transform.
      // If it is not on the element, the leaf is not spreading motion.surface.
      expect(panel?.style.transform).toContain("translate3d");
      expect(panel?.style.transformOrigin).toBe("top left");
    },
  );

  it.each(leaves.map((leaf) => [leaf.ref, leaf.Component] as const))(
    "%s clips the surface, so counter-scaled content cannot escape it",
    (_ref, Component) => {
      const { container } = render(<Component {...MORPH_MID} />);
      const panel = container.querySelector<HTMLElement>(`#${MORPH_MID.panel?.id}`);
      expect(
        panel?.className,
        "the panel must clip (overflow-hidden) — early in the morph its content is wider than it is",
      ).toContain("overflow-hidden");
    },
  );

  it.each(leaves.map((leaf) => [leaf.ref, leaf.Component] as const))(
    "%s renders the panel from the same record as the card",
    (_ref, Component) => {
      const { container } = render(<Component {...MORPH_MID} />);
      const panel = container.querySelector<HTMLElement>(`#${MORPH_MID.panel?.id}`);
      expect(panel?.textContent).toContain(MORPH_MID.panel?.card.title);
    },
  );
});
