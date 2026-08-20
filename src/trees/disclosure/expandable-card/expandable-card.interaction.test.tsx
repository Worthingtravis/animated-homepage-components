/**
 * The container's job, asserted once.
 *
 * Everything here is a behaviour a leaf is forbidden from owning — opening,
 * closing, escape, outside-click, the scroll lock — so this file is the only
 * place in the tree where any of them can be tested. If one of these breaks,
 * all four leaves break together, which is the point.
 *
 * jsdom lays nothing out, so every rect measures zero and the morph degrades to
 * its unmeasured fallback. That is deliberate coverage: it is the same path the
 * server and the first frame take, and a container that only worked once it had
 * rectangles would hang exactly there.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ExpandableCardConnected,
  type ExpandableCardRecord,
} from "./expandable-card-connected";

afterEach(cleanup);

const RECORDS: ExpandableCardRecord[] = [
  {
    id: "fish",
    title: "The fish incident",
    subtitle: "Stardew Valley · Feb 12",
    meta: "6 min",
    media: { src: "/forest/clip-thumb-placeholder.svg", alt: "Fish", width: 640, height: 360 },
    body: ["The chair did not survive."],
    facts: [{ label: "Length", value: "6 min" }],
    action: { label: "Play", onActivate: () => {} },
  },
  {
    id: "cat",
    title: "The cat takes the mic",
    subtitle: "Just Chatting · Jan 22",
    media: { src: "/forest/clip-thumb-placeholder.svg", alt: "Cat", width: 640, height: 360 },
    body: ["Three minutes of a cat asleep on the boom arm."],
  },
];

function renderTree(props: Partial<React.ComponentProps<typeof ExpandableCardConnected>> = {}) {
  return render(
    <ExpandableCardConnected
      variant="canon/media-grid"
      records={RECORDS}
      durationMs={0}
      headline="Clips"
      {...props}
    />,
  );
}

async function open(title: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(title, "i") }));
  });
  return waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
}

async function settle() {
  // Let the rAF-driven exit finish. With durationMs=0 that is a single frame.
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

describe("ExpandableCardConnected", () => {
  it("opens the pressed card into a panel carrying the same record", async () => {
    renderTree();
    expect(screen.queryByRole("dialog")).toBeNull();

    await open("The fish incident");

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("The fish incident");
    expect(dialog.textContent).toContain("The chair did not survive.");
    // The detail is the card, so its subtitle is the card's subtitle verbatim.
    expect(dialog.textContent).toContain("Stardew Valley · Feb 12");
  });

  it("closes on escape", async () => {
    renderTree();
    await open("The fish incident");

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await settle();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes on a pointer down outside the panel, and not on one inside it", async () => {
    renderTree();
    await open("The fish incident");

    await act(async () => {
      fireEvent.pointerDown(screen.getByRole("dialog"));
    });
    await settle();
    expect(screen.queryByRole("dialog")).not.toBeNull();

    await act(async () => {
      fireEvent.pointerDown(document.body);
    });
    await settle();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps every card in the grid while one is open", async () => {
    renderTree();
    await open("The fish incident");

    // The other card is still mounted — dimmed, not removed. A grid that drops
    // cards reflows behind the scrim, and the reflow shows on the way out.
    expect(screen.getByRole("button", { name: /the cat takes the mic/i })).toBeTruthy();
  });

  it("locks page scroll while open, and restores exactly what was there", async () => {
    document.body.style.overflow = "scroll";
    renderTree();

    await open("The fish incident");
    expect(document.body.style.overflow).toBe("hidden");

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await settle();

    await waitFor(() => expect(document.body.style.overflow).toBe("scroll"));
    document.body.style.overflow = "";
  });

  it("leaves scroll alone for an in-flow leaf", async () => {
    renderTree({ variant: "canon/inline-detail", lockScroll: false });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /the fish incident/i }));
    });
    await waitFor(() => expect(screen.getByRole("region")).toBeTruthy());

    expect(document.body.style.overflow).toBe("");
  });

  it("moves focus into the panel and returns it to the card", async () => {
    renderTree();
    const trigger = screen.getByRole("button", { name: /the fish incident/i });
    trigger.focus();

    await open("The fish incident");
    expect(document.activeElement).toBe(screen.getByRole("dialog"));

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await settle();

    // Not a trap — but a keyboard user must never be left at the top of the
    // document holding the card they were reading.
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("reports what opened and what closed", async () => {
    const seen: Array<string | null> = [];
    renderTree({ onOpenChange: (id) => seen.push(id) });

    await open("The fish incident");
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await settle();

    expect(seen).toEqual(["fish", null]);
  });
});
