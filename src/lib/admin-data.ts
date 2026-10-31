// Sample figures for the admin dashboard. Swap these for real queries once orders live in a database.
import { products } from "@/lib/catalog";

export const ADMIN_NAME = "Ada";

export const stats = [
  { id: "products", label: "Total products", value: 250, change: 2.5 },
  { id: "completed", label: "Completed order", value: 124, change: 2.5 },
  { id: "canceled", label: "Canceled order", value: 14, change: -1.5 },
  { id: "top", label: "Top products", value: 119, change: 2.5 },
] as const;

export type Range = "1d" | "7d" | "30d" | "16m" | "Max";
export const ranges: Range[] = ["1d", "7d", "30d", "16m", "Max"];

export type SalesPoint = { label: string; date: string; transactions: number; products: number };

// smooth, deterministic wave so the chart looks lived-in without random flicker between renders
const wave = (i: number, seed: number, base: number, amp: number) =>
  Math.round(base + amp * (Math.sin(i * 0.9 + seed) * 0.6 + Math.sin(i * 0.37 + seed * 2) * 0.4));

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Des"];

function series(labels: string[], dates: string[], seed: number, scale = 1): SalesPoint[] {
  return labels.map((label, i) => ({
    label,
    date: dates[i] ?? label,
    transactions: Math.max(4, wave(i, seed, 190, 60) * scale),
    products: Math.max(2, wave(i, seed + 1.7, 120, 55) * scale),
  }));
}

export const sales: Record<
  Range,
  { total: number; delta: number; deltaPct: number; points: SalesPoint[] }
> = {
  "1d": {
    total: 642.4,
    delta: 118.2,
    deltaPct: 1.2,
    points: series(
      ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"],
      [
        "00:00",
        "02:00",
        "04:00",
        "06:00",
        "08:00",
        "10:00",
        "12:00",
        "14:00",
        "16:00",
        "18:00",
        "20:00",
        "22:00",
      ],
      0.4,
      0.12,
    ),
  },
  "7d": {
    total: 4435.7,
    delta: 2330,
    deltaPct: 2.5,
    points: series(
      months,
      months.map((m) => `14 ${m === "Des" ? "Dec" : m} 2026`),
      1.1,
    ),
  },
  "30d": {
    total: 18210.5,
    delta: 3104.2,
    deltaPct: 4.1,
    points: series(
      ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "30"],
      [
        "Oct 1",
        "Oct 4",
        "Oct 7",
        "Oct 10",
        "Oct 13",
        "Oct 16",
        "Oct 19",
        "Oct 22",
        "Oct 25",
        "Oct 28",
        "Oct 30",
      ],
      2.3,
      0.6,
    ),
  },
  "16m": {
    total: 96430,
    delta: 12870,
    deltaPct: 6.3,
    points: series(
      ["J", "A", "S", "O", "N", "D", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O"],
      [
        "Jul 25",
        "Aug 25",
        "Sep 25",
        "Oct 25",
        "Nov 25",
        "Dec 25",
        "Jan 26",
        "Feb 26",
        "Mar 26",
        "Apr 26",
        "May 26",
        "Jun 26",
        "Jul 26",
        "Aug 26",
        "Sep 26",
        "Oct 26",
      ],
      3.2,
      2.4,
    ),
  },
  Max: {
    total: 143980,
    delta: 26400,
    deltaPct: 9.8,
    points: series(["2023", "2024", "2025", "2026"], ["2023", "2024", "2025", "2026"], 0.8, 6),
  },
};

export type Platform = "Online store" | "Instagram" | "WhatsApp" | "Jumia";

export type Transaction = {
  id: string;
  item: string;
  slug: string;
  date: string;
  price: number;
  platform: Platform;
};

const platforms: Platform[] = [
  "Online store",
  "Instagram",
  "WhatsApp",
  "Online store",
  "Jumia",
  "Instagram",
  "WhatsApp",
  "Online store",
];

export const transactions: Transaction[] = Array.from({ length: 8 }, (_, i) => {
  const p = products[i % products.length]!;
  return {
    id: `ADA${(2914 - i * 7).toString().padStart(4, "0")}`,
    item: p.name,
    slug: p.slug,
    date: `${String(30 - i * 3).padStart(2, "0")}/10/2026`,
    price: p.price * (1 + (i % 3)),
    platform: platforms[i]!,
  };
});

/** Best sellers for the congratulations carousel. */
export const bestSellers = [
  { slug: "flap-bag-003", sold: 271 },
  { slug: "tote-004", sold: 214 },
  { slug: "flap-bag-001", sold: 188 },
  { slug: "shopper-002", sold: 162 },
  { slug: "backpack-005", sold: 97 },
];
