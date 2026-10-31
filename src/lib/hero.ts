import hero from "@/assets/hero.jpg";
import bag1 from "@/assets/bag1.jpg";
import bag2 from "@/assets/bag2.jpg";
import bag3 from "@/assets/bag3.jpg";

/** Hero slides; `bg` is sampled from each photo's backdrop so portrait shots fade in seamlessly. */
export const heroSlides = [
  {
    slug: "tote-004",
    img: hero,
    bg: "#c4c4c4",
    wide: true,
    alt: "Black leather tote on white linen",
  },
  {
    slug: "flap-bag-003",
    img: bag3,
    bg: "#d9d9d9",
    wide: false,
    alt: "Black saddle flap bag with tan strap",
  },
  {
    slug: "flap-bag-001",
    img: bag1,
    bg: "#cbcbcb",
    wide: false,
    alt: "Silver and onyx chain flap bag",
  },
  {
    slug: "shopper-002",
    img: bag2,
    bg: "#d6d6d8",
    wide: false,
    alt: "Black canvas shopper held by hand",
  },
];
export const SLIDE_MS = 6000;
