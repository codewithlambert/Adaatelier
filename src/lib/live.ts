// What the admin controls on the live site: store settings and each product's price, stock,
// availability and colourways. Loaded once per visit on the client; the bundled catalogue
// stays the fallback whenever the database isn't reachable.
import { useEffect, useState } from "react";
import { bagColors, type ColorId, type Product } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

export type LiveSettings = {
  maintenance: boolean;
  announcement_enabled: boolean;
  announcement: string;
};
type LiveProduct = { id: string; name: string; price: number; stock: number; colors: string[] };
type Live = { settings: LiveSettings | null; products: Record<string, LiveProduct> | null };

let loading: Promise<Live> | undefined;

function load(): Promise<Live> {
  loading ??= (async () => {
    if (!supabase) return { settings: null, products: null };
    const [s, p] = await Promise.all([
      supabase
        .from("store_settings")
        .select("maintenance, announcement_enabled, announcement")
        .eq("id", 1)
        .maybeSingle(),
      // shoppers can only read active products, so anything missing here is hidden
      supabase.from("products").select("id, name, price, stock, colors"),
    ]);
    return {
      settings: s.error ? null : (s.data as LiveSettings | null),
      products: p.error
        ? null
        : Object.fromEntries(
            (p.data as LiveProduct[]).map((r) => [r.id, { ...r, price: Number(r.price) }]),
          ),
    };
  })().catch(() => ({ settings: null, products: null }));
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

/** Drops products the admin has set to draft or archived (once the database answers). */
export function useAvailable(list: Product[]) {
  const products = useLive()?.products;
  return products ? list.filter((p) => p.slug in products) : list;
}
