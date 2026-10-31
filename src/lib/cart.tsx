import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ColorId } from "@/lib/catalog";

export type CartLine = {
  id: string;
  /** catalogue slug; checkout sends this, never the price */
  productId: string;
  name: string;
  price: number;
  img: string;
  note: string;
  qty: number;
  /** colourway + mask so the bag and checkout can show the tinted photo */
  color?: ColorId;
  mask?: string | undefined;
  /** up to three initials for made-to-order pieces */
  monogram?: string;
};

type CartState = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Adds a line; pass `open: false` to update the bag without sliding the drawer open. */
  add: (line: Omit<CartLine, "qty">, qty?: number, open?: boolean) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "ada-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Restore after mount so server and client render the same empty bag first
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // drop lines saved by older versions of the bag that lack a product id
      if (saved) setLines((JSON.parse(saved) as CartLine[]).filter((l) => !!l.productId));
    } catch {
      // storage unavailable or corrupt: start empty
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable: keep the bag in memory only
    }
  }, [lines, loaded]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1, openBag = true) => {
    setLines((c) => {
      const hit = c.find((l) => l.id === line.id);
      return hit
        ? c.map((l) => (l === hit ? { ...l, qty: l.qty + qty } : l))
        : [...c, { ...line, qty }];
    });
    if (openBag) setOpen(true);
  }, []);

  const setQty = useCallback(
    (id: string, qty: number) =>
      setLines((c) =>
        qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty } : l)),
      ),
    [],
  );

  const value = useMemo<CartState>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
      open,
      setOpen,
      add,
      setQty,
      clear: () => setLines([]),
    }),
    [lines, open, add, setQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
