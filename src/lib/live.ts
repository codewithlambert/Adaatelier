// What the admin controls on the live site: store settings and each product's price, stock,
// availability and colourways. Loaded once per visit on the client; the bundled catalogue
// stays the fallback whenever the database isn't reachable.
import { useEffect, useState } from "react";
import {
  bagColors,
  products as bundled,
  type Category,
  type ColorId,
  type Product,
} from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

export type LiveSettings = {
  maintenance: boolean;
  announcement_enabled: boolean;
  announcement: string;
};
type LiveProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  colors: string[];
  image_url: string | null;
  focus: string | null;
  tagline: string;
  description: string;
  details: string[];
  is_new: boolean;
};
const PRODUCT_COLUMNS =
  "id, name, category, price, stock, colors, image_url, focus, tagline, description, details, is_new";
type Live = {
  settings: LiveSettings | null;
  products: Record<string, LiveProduct> | null;
  /** bundled bags the admin archived or drafted */
  hidden: Set<string>;
};

let loading: Promise<Live> | undefined;

function load(): Promise<Live> {
  loading ??= (async () => {
    if (!supabase) return { settings: null, products: null, hidden: new Set<string>() };
    const [s, p, h] = await Promise.all([
      supabase
        .from("store_settings")
        .select("maintenance, announcement_enabled, announcement")
        .eq("id", 1)
        .maybeSingle(),
      // shoppers can only read active products, so anything missing here is hidden
      supabase.from("products").select(PRODUCT_COLUMNS).order("sort_order").order("created_at"),
      supabase.rpc("hidden_product_ids"),
    ]);
    return {
      settings: s.error ? null : (s.data as LiveSettings | null),
      products: p.error
        ? null
        : Object.fromEntries(
            (p.data as LiveProduct[]).map((r) => [r.id, { ...r, price: Number(r.price) }]),
          ),
      hidden: new Set(h.error ? [] : (h.data as string[])),
    };
  })().catch(() => ({ settings: null, products: null, hidden: new Set<string>() }));
  return loading;
}

export function useLive(): Live | null {
  const [live, setLive] = useState<Live | null>(null);
  useEffect(() => {
    let alive = true;
    void load().then((v) => alive && setLive(v));
    return () => {
      alive = false;
    };
  }, []);
  return live;
}

const knownColor = (c: string): c is ColorId => bagColors.some((b) => b.id === c);

/** A product with the admin's latest name and price, plus its stock and allowed colours. */
export function useLiveProduct(p: Product) {
  const live = useLive();
  const row = live?.products?.[p.slug];
  return {
    product: row ? { ...p, name: row.name, price: row.price } : p,
    /** null until known, or when the database isn't connected */
    stock: row ? row.stock : null,
    colors: row ? row.colors.filter(knownColor) : null,
  };
}

/** A product added in the admin (no bundled photo, mask or 3D model): shown from its uploaded photo. */
function fromRow(r: LiveProduct): Product | null {
  if (!r.image_url) return null;
  return {
    slug: r.id,
    name: r.name,
    price: Number(r.price),
    cat: r.category as Category,
    img: r.image_url,
    tagline: r.tagline,
    description: r.description,
    details: r.details,
    isNew: r.is_new,
    ...(r.focus ? { focus: r.focus } : {}),
  };
}

const bundledSlugs = new Set(bundled.map((p) => p.slug));

/** The shop's catalogue: bundled bags the admin still has active, plus any added in the admin. */
export function useCatalog(list: Product[]) {
  const live = useLive();
  const rows = live?.products;
  if (!rows) return list;
  const extra = Object.values(rows)
    .filter((r) => !bundledSlugs.has(r.id))
    .map(fromRow)
    .filter((p): p is Product => !!p);
  // a bundled bag shows unless the admin hid it, so new bags appear before the database knows them
  return [...list.filter((p) => !live.hidden.has(p.slug)), ...extra];
}

/** Looks up a product that only exists in the database (for direct links to its page). */
export async function fetchDbProduct(slug: string): Promise<Product | undefined> {
  if (!supabase) return undefined;
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", slug)
    .maybeSingle();
  return (data && fromRow(data as LiveProduct)) ?? undefined;
}
