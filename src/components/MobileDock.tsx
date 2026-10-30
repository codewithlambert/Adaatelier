import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useCart } from "@/lib/cart";

/** Pinterest-style floating dock: separate frosted-glass buttons that tuck away while scrolling down. */
export function MobileDock({ onSearch }: { onSearch: () => void }) {
  const { hidden } = useScrollDirection();
  const { count, setOpen } = useCart();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const base =
    "glass relative grid h-[52px] w-[52px] place-items-center rounded-full text-foreground transition-[transform,background-color,color] duration-300 active:scale-90";
  const on = (match: boolean) =>
    match ? `${base} !border-foreground !bg-foreground !text-background` : base;
  const icon = "h-[19px] w-[19px]";

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center gap-2.5 transition-[transform,opacity] duration-500 ease-[var(--ease-luxe)] md:hidden ${
        hidden ? "pointer-events-none translate-y-[140%] opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <Link to="/" aria-label="Home" className={on(path === "/")}>
        <Home className={icon} strokeWidth={1.6} />
      </Link>
      <Link
        to="/shop"
        aria-label="Shop"
        className={on(path.startsWith("/shop") || path.startsWith("/product"))}
      >
        <LayoutGrid className={icon} strokeWidth={1.6} />
      </Link>
      <button onClick={onSearch} aria-label="Search" className={base}>
        <Search className={icon} strokeWidth={1.6} />
      </button>
      <button
        data-bag-target
        onClick={() => setOpen(true)}
        aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
        className={on(path === "/checkout")}
      >
        <ShoppingBag className={icon} strokeWidth={1.6} />
        {count > 0 && (
          <span
            key={count}
            className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background ring-2 ring-background animate-in zoom-in-50 duration-300"
          >
            {count}
          </span>
        )}
      </button>
      <Link to="/journal" aria-label="Journal" className={on(path.startsWith("/journal"))}>
        <BookOpen className={icon} strokeWidth={1.6} />
      </Link>
    </nav>
  );
}
