/**
 * The site model. The cases worth testing are the ones a curator reaches by
 * accident: a stored layout from an older build, a surface that did not exist
 * when it was written, and the difference between "I made tabs" and "I actually
 * arranged this page" — which is what decides whether a visitor sees the
 * curated shape or the one the site shipped with.
 */

import { describe, expect, it } from "vitest";

import { moveSection, tabContainerId } from "./section-layout";
import {
  SURFACES,
  isCurated,
  isSurfaceId,
  mapSurface,
  reconcileSite,
  resetSurface,
  seedSite,
  setSurface,
  surfaceLayout,
} from "./site-layout";

const IDS = ["a", "b", "c"];

describe("seedSite", () => {
  it("gives every surface its named tabs and shelves everything", () => {
    const site = seedSite(IDS);
    for (const surface of SURFACES) {
      const layout = surfaceLayout(site, surface.id);
      expect(layout.tabs.map((tab) => tab.label)).toEqual(surface.seedTabs.map((tab) => tab.label));
      expect(layout.shelf).toEqual(IDS);
    }
  });

  it("starts uncurated, so a fresh visit gets the page as shipped", () => {
    const site = seedSite(IDS);
    expect(SURFACES.every((surface) => !isCurated(site, surface.id))).toBe(true);
  });
});

describe("isCurated", () => {
  it("stays false for tabs nobody put anything into", () => {
    const site = seedSite(IDS);
    // Renaming and adding tabs is not arranging a page.
    expect(isCurated(site, "home")).toBe(false);
  });

  it("turns true the moment one section lands in one tab", () => {
    const tab = SURFACES[0].seedTabs[0].id;
    const site = mapSurface(seedSite(IDS), "home", (layout) =>
      moveSection(layout, "a", tabContainerId(tab), 0),
    );
    expect(isCurated(site, "home")).toBe(true);
    // And only that surface — the two must not leak into each other.
    expect(isCurated(site, "lab")).toBe(false);
  });
});

describe("mapSurface / setSurface", () => {
  it("leaves every other surface identical", () => {
    const base = seedSite(IDS);
    const next = mapSurface(base, "home", (layout) =>
      moveSection(layout, "a", tabContainerId(SURFACES[0].seedTabs[0].id), 0),
    );
    expect(surfaceLayout(next, "lab")).toBe(surfaceLayout(base, "lab"));
  });

  it("resets one surface without touching the other", () => {
    const tab = SURFACES[0].seedTabs[0].id;
    const arranged = mapSurface(seedSite(IDS), "home", (layout) =>
      moveSection(layout, "a", tabContainerId(tab), 0),
    );
    const withLab = setSurface(arranged, "lab", surfaceLayout(arranged, "home"));
    const next = resetSurface(withLab, "home", IDS);
    expect(isCurated(next, "home")).toBe(false);
    expect(isCurated(next, "lab")).toBe(true);
  });
});

describe("reconcileSite", () => {
  it("falls back to a seeded site rather than throwing on rubbish", () => {
    for (const value of [null, undefined, 7, "layout", {}, { surfaces: 3 }]) {
      expect(() => reconcileSite(value, IDS)).not.toThrow();
      expect(reconcileSite(value, IDS).surfaces.home.shelf).toEqual(IDS);
    }
  });

  it("seeds a surface the stored value has never heard of", () => {
    const stored = { version: 1, surfaces: { home: seedSite(IDS).surfaces.home } };
    const next = reconcileSite(stored, IDS);
    expect(next.surfaces.lab.tabs.length).toBeGreaterThan(0);
    expect(next.surfaces.lab.shelf).toEqual(IDS);
  });

  it("drops sections that no longer exist, per surface", () => {
    const tab = SURFACES[0].seedTabs[0].id;
    const stored = mapSurface(seedSite(IDS), "home", (layout) =>
      moveSection(layout, "a", tabContainerId(tab), 0),
    );
    const next = reconcileSite(stored, ["b", "c"]);
    expect(next.surfaces.home.tabs[0].sectionIds).toEqual([]);
    expect(next.surfaces.home.shelf).toEqual(["b", "c"]);
  });

  it("keeps an arrangement that is still valid", () => {
    const tab = SURFACES[0].seedTabs[0].id;
    const stored = mapSurface(seedSite(IDS), "home", (layout) =>
      moveSection(layout, "a", tabContainerId(tab), 0),
    );
    expect(isCurated(reconcileSite(stored, IDS), "home")).toBe(true);
  });
});

describe("isSurfaceId", () => {
  it("accepts only the surfaces that exist", () => {
    expect(isSurfaceId("home")).toBe(true);
    expect(isSurfaceId("lab")).toBe(true);
    expect(isSurfaceId("shop")).toBe(false);
    expect(isSurfaceId(undefined)).toBe(false);
  });
});
