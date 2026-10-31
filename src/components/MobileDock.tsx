import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, Search, ShoppingBag, Store } from "lucide-react";
import type { ReactNode } from "react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useCart } from "@/lib/cart";

/** Pinterest-style floating dock: separate frosted-glass buttons, each labelled, tucked away while scrolling down. */
export function MobileDock({ onSearch }: { onSearch: () => void }) {
  const { hidden } = useScrollDirection();
  const { count, setOpen } = useCart();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const base =
    "glass relative flex h-[58px] w-[60px] flex-col items-center justify-center gap-1 rounded-[20px] text-foreground transition-[transform,background-color,color] duration-300 active:scale-90";
  const on = (match: boolean) =>
    match ? `${base} !border-foreground !bg-foreground !text-background` : base;
  const item = (icon: ReactNode, label: string) => (
    <>
      {icon}
      <span className="text-[10px] font-medium leading-none tracking-[0.02em]">{label}</span>
    </>
  );
  const icon = "h-[18px] w-[18px]";

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center gap-2 transition-[transform,opacity] duration-500 ease-[var(--ease-luxe)] md:hidden ${
        hidden ? "pointer-events-none translate-y-[140%] opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <Link to="/" className={on(path === "/")}>
        {item(<Home className={icon} strokeWidth={1.7} />, "Home")}
      </Link>
      <Link to="/shop" className={on(path.startsWith("/shop") || path.startsWith("/product"))}>
        {item(<Store className={icon} strokeWidth={1.7} />, "Shop")}
      </Link>
      <button onClick={onSearch} className={base}>
        {item(<Search className={icon} strokeWidth={1.7} />, "Search")}
      </button>
      <button
        data-bag-target
        onClick={() => setOpen(true)}
        aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
        className={on(path === "/checkout")}
      >
        {item(<ShoppingBag className={icon} strokeWidth={1.7} />, "Bag")}
        {count > 0 && (
          <span
            key={count}
            className="absolute right-1.5 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background ring-2 ring-background animate-in zoom-in-50 duration-300"
          >
            {count}
          </span>
        )}
      </button>
      <Link to="/journal" className={on(path.startsWith("/journal"))}>
        {item(<BookOpen className={icon} strokeWidth={1.7} />, "Journal")}
      </Link>
    </nav>
  );
}
