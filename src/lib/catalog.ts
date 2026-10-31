import hero from "@/assets/hero.jpg";
import bag1 from "@/assets/bag1.jpg";
import bag2 from "@/assets/bag2.jpg";
import bag3 from "@/assets/bag3.jpg";
import blog1 from "@/assets/blog1.jpg";
import bag1Mask from "@/assets/bag1-mask.png";
import bag2Mask from "@/assets/bag2-mask.png";
import bag3Mask from "@/assets/bag3-mask.png";
import heroMask from "@/assets/hero-mask.png";
import blog1Mask from "@/assets/blog1-mask.png";
import bag13d from "@/assets/bag1-3d.png";
import bag13dMask from "@/assets/bag1-3d-mask.png";
import bag13dBody from "@/assets/bag1-3d-body.png";
import bag23d from "@/assets/bag2-3d.png";
import bag23dMask from "@/assets/bag2-3d-mask.png";
import bag23dBody from "@/assets/bag2-3d-body.png";
import bag33d from "@/assets/bag3-3d.png";
import bag33dMask from "@/assets/bag3-3d-mask.png";
import bag33dBody from "@/assets/bag3-3d-body.png";
import hero3d from "@/assets/hero-3d.png";
import hero3dMask from "@/assets/hero-3d-mask.png";
import hero3dBody from "@/assets/hero-3d-body.png";
import blog13d from "@/assets/blog1-3d.png";
import blog13dMask from "@/assets/blog1-3d-mask.png";
import blog13dBody from "@/assets/blog1-3d-body.png";

/** Colourways. Onyx is the photographed original; the rest are tinted onto the bag mask. */
export const bagColors = [
  { id: "onyx", name: "Onyx", hex: "#151515" },
  { id: "cognac", name: "Cognac", hex: "#9a5328" },
  { id: "bordeaux", name: "Bordeaux", hex: "#6e1f2c" },
  { id: "forest", name: "Forest", hex: "#33503f" },
  { id: "sand", name: "Sand", hex: "#cdb796" },
  { id: "silver", name: "Silver", hex: "#c2c3c7" },
] as const;
export type BagColor = (typeof bagColors)[number];
export type ColorId = BagColor["id"];
export const colorName = (id: ColorId) => bagColors.find((c) => c.id === id)?.name ?? "Onyx";

/** Masks for photos used outside the product list (e.g. the customizer tote). */
export const masks = { bag2: bag2Mask };

/** Cut-out of the bag for the 3D viewer, plus where a monogram sits on its front panel. */
export type BagModel = {
  src: string;
  mask: string;
  /** solid body only (no straps or chains): the part that gets depth */
  body: string;
  /** cut-out width / height */
  aspect: number;
  /** extrusion depth in px at a 420px-tall render */
  depth: number;
  /** monogram centre as fractions of the cut-out */
  monogram: [x: number, y: number];
};

export type Product = {
  slug: string;
  name: string;
  price: number;
  cat: Category;
  img: string;
  /** RGBA mask of the recolourable bag body in `img`; absent for photo-only products */
  mask?: string;
  /** 3D cut-out; absent for products added in the admin, which show as photos */
  model?: BagModel;
  /** object-position for the card crop, so wide shots still centre the bag */
  focus?: string;
  tagline: string;
  description: string;
  details: string[];
  isNew?: boolean;
};

export const categories = [
  "Backpack",
  "Bucket Bag",
  "Flap Bag",
  "Shopper",
  "Tote",
  "Ankara",
  "African Craft",
  "Designer",
] as const;
export type Category = (typeof categories)[number];

export const products: Product[] = [
  {
    slug: "flap-bag-001",
    name: "Flap Bag No. 001",
    price: 30.99,
    cat: "Flap Bag",
    img: bag1,
    mask: bag1Mask,
    model: {
      src: bag13d,
      mask: bag13dMask,
      body: bag13dBody,
      aspect: 298 / 640,
      depth: 26,
      monogram: [0.5, 0.88],
    },
    tagline: "Silver flap, onyx body, chain strap.",
    description:
      "A compact evening bag with a metallic flap and a polished push-lock. The chain strap drops to the hip or doubles up for the shoulder.",
    details: [
      "Metallic coated leather flap",
      "Smooth onyx body",
      "Detachable chain strap",
      "W 22 × H 15 × D 7 cm",
    ],
    isNew: true,
  },
  {
    slug: "shopper-002",
    name: "Shopper No. 002",
    price: 24.99,
    cat: "Shopper",
    img: bag2,
    mask: bag2Mask,
    model: {
      src: bag23d,
      mask: bag23dMask,
      body: bag23dBody,
      aspect: 349 / 640,
      depth: 10,
      monogram: [0.5, 0.66],
    },
    tagline: "Heavy canvas for every day.",
    description:
      "Our everyday canvas shopper, cut from a dense cotton weave that keeps its shape when full and folds flat when empty.",
    details: [
      "Heavyweight cotton canvas",
      "Reinforced X-stitched handles",
      "Fits a 14-inch laptop",
      "W 38 × H 42 cm",
    ],
    isNew: true,
  },
  {
    slug: "flap-bag-003",
    name: "Flap Bag No. 003",
    price: 34.99,
    cat: "Flap Bag",
    img: bag3,
    mask: bag3Mask,
    model: {
      src: bag33d,
      mask: bag33dMask,
      body: bag33dBody,
      aspect: 374 / 640,
      depth: 30,
      monogram: [0.5, 0.9],
    },
    tagline: "The one from the Surprise Box.",
    description:
      "A rounded saddle-flap in smooth leather with a brushed-gold push-lock and an adjustable tan strap. Our signature piece.",
    details: [
      "Smooth calf-grain leather",
      "Brushed-gold hardware",
      "Adjustable tan strap",
      "W 26 × H 18 × D 8 cm",
    ],
  },
  {
    slug: "tote-004",
    name: "Tote No. 004",
    price: 39.99,
    cat: "Tote",
    img: hero,
    mask: heroMask,
    model: {
      src: hero3d,
      mask: hero3dMask,
      body: hero3dBody,
      aspect: 491 / 607,
      depth: 44,
      monogram: [0.5, 0.72],
    },
    focus: "50% 70%",
    tagline: "Structured leather, open top.",
    description:
      "A clean-lined leather tote with angled side panels and long handles that sit comfortably on the shoulder.",
    details: [
      "Full-grain leather",
      "Angled side gussets",
      "Interior slip pocket",
      "W 34 × H 28 × D 14 cm",
    ],
  },
  {
    slug: "backpack-005",
    name: "Backpack No. 005",
    price: 49.99,
    cat: "Backpack",
    img: blog1,
    mask: blog1Mask,
    model: {
      src: blog13d,
      mask: blog13dMask,
      body: blog13dBody,
      aspect: 459 / 632,
      depth: 60,
      monogram: [0.62, 0.55],
    },
    tagline: "Water-resistant nylon, tonal zips.",
    description:
      "A minimal daypack in water-resistant nylon with a padded laptop sleeve and tonal matte zips that disappear into the body.",
    details: [
      "Water-resistant nylon",
      "Padded 15-inch laptop sleeve",
      "Front zip pocket",
      "Capacity 18 L",
    ],
  },
];

export const findProduct = (slug: string) => products.find((p) => p.slug === slug);

export type Post = {
  slug: string;
  tag: string;
  date: string;
  title: string;
  excerpt: string;
  img: string;
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "backpacks-for-students",
    tag: "Guide",
    date: "Oct 24, 2026",
    title: "Backpacks suitable for students",
    excerpt: "Our recommendations for backpacks that carry a full day of classes.",
    img: blog1,
    body: [
      "A student's bag works harder than most. It carries a laptop, notebooks, a water bottle and often a change of clothes, then gets dropped on lecture-hall floors and stuffed under bus seats.",
      "Look first at the base. A reinforced bottom panel keeps the bag standing and protects the stitching where it wears fastest. Our Backpack No. 005 uses a doubled nylon base for exactly this reason.",
      "Next, the laptop sleeve. It should be padded on all sides and sit slightly above the bottom of the bag, so the laptop never takes the impact when the bag is set down.",
      "Finally, weight. A good empty backpack weighs under a kilogram. Every gram you save on the bag is a gram you can spend on books.",
    ],
  },
  {
    slug: "ten-best-backpacks",
    tag: "Edit",
    date: "Oct 18, 2026",
    title: "10 best backpacks",
    excerpt: "For those of you who carry a lot of stuff, and still want it to look good.",
    img: blog1,
    body: [
      "Carrying a lot doesn't have to mean looking like you're about to climb a mountain. The best city backpacks hide their capacity behind clean lines.",
      "We picked our favourites for structure, materials and how well they age. Tonal hardware, minimal logos and a shape that holds when half empty were non-negotiable.",
      "Whatever you choose, pick a colour you will wear with everything. Black still wins.",
    ],
  },
  {
    slug: "best-product-of-the-week",
    tag: "Product",
    date: "Oct 12, 2026",
    title: "The best product of this week",
    excerpt: "The best price and the best materials, picked for you.",
    img: bag1,
    body: [
      "This week's pick is Flap Bag No. 001: a silver metallic flap over a smooth onyx body, finished with a polished push-lock.",
      "It's small enough for an evening out and holds a phone, cardholder and keys without bulging. The chain strap can be worn long or doubled.",
    ],
  },
  {
    slug: "discounts-this-week",
    tag: "Offers",
    date: "Oct 06, 2026",
    title: "Discounts for this week",
    excerpt: "There are many discounts this week. Let's choose.",
    img: hero,
    body: [
      "Selected totes and shoppers are reduced this week while stock lasts.",
      "Every order still ships in our recyclable Ada Atelier box, and returns stay free for 30 days.",
    ],
  },
];

export const findPost = (slug: string) => posts.find((p) => p.slug === slug);

export const money = (n: number) => `$${n.toFixed(2)}`;

/** Products with a 3D cut-out: the ones the customizer, surprise box and hero can stage. */
export type ModelledProduct = Product & { model: BagModel; mask: string };
export const modelled = products.filter((p): p is ModelledProduct => !!p.model && !!p.mask);
