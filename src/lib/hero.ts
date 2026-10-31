import { findProduct } from "@/lib/catalog";

/** Hero slides: each bag's cut-out on its own backdrop, in front of a giant ADA wordmark. */
const picks = [
  { slug: "tote-004", bg: "#d8d3cc", alt: "Black leather tote" },
  { slug: "flap-bag-003", bg: "#c9b39b", alt: "Black saddle flap bag with tan strap" },
  { slug: "flap-bag-001", bg: "#c6cad0", alt: "Silver and onyx chain flap bag" },
  { slug: "shopper-002", bg: "#d4cfc2", alt: "Black canvas shopper" },
  { slug: "backpack-005", bg: "#b9bfb6", alt: "Black nylon backpack" },
];

export const heroSlides = picks.map((p) => ({ ...p, cut: findProduct(p.slug)!.model.src }));
export const SLIDE_MS = 6000;
