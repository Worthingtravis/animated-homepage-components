import type { SpeciesMeta } from "@/lib/forest";

/**
 * Species: Finding
 *
 * Components whose subject is retrieval — someone with a vague memory facing a
 * set too large to read. The problem is never "render a list"; it is that the
 * person cannot say what they want, and the surface has to meet them with
 * something recognisable before they have typed anything.
 *
 * Transport here is the *settle after a query changes*: results arriving is a
 * one-shot, and it repeats every keystroke. The container searches and ranks;
 * a leaf only decides what recognition looks like.
 */
export const meta: SpeciesMeta = {
  label: "Finding",
  description:
    "Components whose subject is retrieval — a vague memory against a large set. Transport is the settle after a query changes; the container searches and ranks, the leaf makes something recognisable.",
};

export default meta;
