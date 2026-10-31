import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, Search, ShoppingBag, Store, type LucideIcon } from "lucide-react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useCart } from "@/lib/cart";

/**
 * Floating mobile dock with no tiles: each button is its own icon's shape (a house, a
 * magnifier, a bag), outlined at rest and filled solid when it's the current page. A soft
 * halo in the page colour keeps the shapes readable over photos. Tucks away while scrolling down.
 */
export function MobileDock({ onSearch }: { onSearch: () => void }) {
  const { hidden } = useScrollDirection();
  const { count, setOpen } = useCart();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const button =
    "relative flex w-16 flex-col items-center gap-1 py-1.5 text-foreground transition-transform duration-300 active:scale-90";
  const shape = (Icon: LucideIcon, label: string, active: boolean) => (
    <>
      <Icon
        aria-hidden
        className={`h-[30px] w-[30px] transition-[fill,transform] duration-500 ease-[var(--ease-luxe)] [filter:drop-shadow(0_0_6px_var(--color-background))_drop-shadow(0_2px_6px_rgb(0_0_0/0.18))] ${
          active ? "-translate-y-0.5 fill-current" : "fill-transparent"
        }`}
        strokeWidth={active ? 1.4 : 1.6}
      />
      <span
        className={`text-[10px] leading-none tracking-[0.02em] [text-shadow:0_0_6px_var(--color-background),0_0_2px_var(--color-background)] ${
          active ? "font-semibold" : "font-medium"
        }`}
      >
        {label}
      </span>
    </>
  );

  const shopping = path.startsWith("/shop") || path.startsWith("/product");

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-center gap-1 transition-[transform,opacity] duration-500 ease-[var(--ease-luxe)] md:hidden ${
        hidden ? "pointer-events-none translate-y-[140%] opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <Link to="/" className={button} aria-current={path === "/" ? "page" : undefined}>
        {shape(Home, "Home", path === "/")}
      </Link>
      <Link to="/shop" className={button} aria-current={shopping ? "page" : undefined}>
        {shape(Store, "Shop", shopping)}
      </Link>
      <button onClick={onSearch} className={button}>
        {shape(Search, "Search", false)}
      </button>
      <button
        data-bag-target
        onClick={() => setOpen(true)}
        aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
        className={button}
      >
        {shape(ShoppingBag, "Bag", path === "/checkout")}
        {count > 0 && (
          <span
            key={count}
            className="absolute right-2.5 top-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background ring-2 ring-background animate-in zoom-in-50 duration-300"
          >
            {count}
          </span>
        )}
      </button>
      <Link
        to="/journal"
        className={button}
        aria-current={path.startsWith("/journal") ? "page" : undefined}
      >
        {shape(BookOpen, "Journal", path.startsWith("/journal"))}
      </Link>
    </nav>
  );
}
