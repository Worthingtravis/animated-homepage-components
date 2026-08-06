/**
 * Naming rules for the forest. Every generated identifier flows through here so
 * a leaf's export name is always derivable from its path — and vice versa.
 */

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSlug(kind, value) {
  if (!SLUG_RE.test(value)) {
    throw new Error(
      `Invalid ${kind} name "${value}". Use kebab-case: lowercase letters, digits and single hyphens (e.g. "aurora-headline").`,
    );
  }
  return value;
}

export function pascal(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function camel(slug) {
  const p = pascal(slug);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

export function screaming(slug) {
  return slug.replace(/-/g, "_").toUpperCase();
}

export function title(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** `motion/aurora-headline` -> { species, tree } */
export function parseTreeRef(ref) {
  const parts = String(ref ?? "").split("/").filter(Boolean);
  if (parts.length !== 2) {
    throw new Error(`Expected <species>/<tree>, got "${ref}".`);
  }
  return { species: assertSlug("species", parts[0]), tree: assertSlug("tree", parts[1]) };
}

/** `motion/aurora-headline/canon` -> { species, tree, branch } */
export function parseBranchRef(ref) {
  const parts = String(ref ?? "").split("/").filter(Boolean);
  if (parts.length !== 3) {
    throw new Error(`Expected <species>/<tree>/<branch>, got "${ref}".`);
  }
  return {
    species: assertSlug("species", parts[0]),
    tree: assertSlug("tree", parts[1]),
    branch: assertSlug("branch", parts[2]),
  };
}

/** The exported component name for a leaf: tree + leaf, PascalCase. */
export function leafExportName(tree, leaf) {
  return `${pascal(tree)}${pascal(leaf)}`;
}
