import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Facebook, Instagram, Minus, Plus, Search, Twitter } from "lucide-react";
import { MobileDock } from "@/components/MobileDock";
import { Logo, LogoMark } from "@/components/site/Logo";
import { TintedImage, TintFilters } from "@/components/site/Tint";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { categories, money, products } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { loadGsap, markIntroDone, prefersReducedMotion } from "@/lib/motion";

const wrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12";

const navLinks = [
  { to: "/shop", label: "Shop" },
  { to: "/customize", label: "Customize" },
  { to: "/about", label: "About" },
  { to: "/journal", label: "Journal" },
] as const;

/** Storefront chrome for every page except the admin, which brings its own shell. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return path.startsWith("/admin") ? <>{children}</> : <Storefront>{children}</Storefront>;
}

/** Header, footer, preloader, cursor, mobile dock, search and bag. */
function Storefront({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { hidden, scrolled } = useScrollDirection();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    const cleanups: Array<() => void> = [];
    if (prefersReducedMotion()) {
      root.current
        ?.querySelector<HTMLElement>("[data-preloader]")
        ?.style.setProperty("display", "none");
      markIntroDone();
      return;
    }
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: "expo.out" }, onComplete: markIntroDone })
          .from("[data-pl-mark]", { scale: 0.6, opacity: 0, duration: 0.8 })
          .from("[data-pl-letter]", { yPercent: 110, stagger: 0.05, duration: 0.9 }, "<0.15")
          .to("[data-pl-bar]", { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, "<")
          .to(
            "[data-pl-letter], [data-pl-mark]",
            { yPercent: -110, opacity: 0, stagger: 0.03, duration: 0.5, ease: "expo.in" },
            "+=0.05",
          )
          .to(
            "[data-preloader]",
            { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" },
            "-=0.2",
          )
          .set("[data-preloader]", { display: "none" });

        // reading progress hairline
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => gsap.set("[data-progress]", { scaleX: self.progress }),
        });

        // grids lean into fast scrolls, then settle
        const clampSkew = gsap.utils.clamp(-5, 5);
        const proxy = { skew: 0 };
        const applySkew = () => gsap.set("[data-skew]", { skewY: proxy.skew, force3D: true });
        ScrollTrigger.create({
          onUpdate: (self) => {
            const skew = clampSkew(self.getVelocity() / -400);
            if (Math.abs(skew) > Math.abs(proxy.skew)) {
              proxy.skew = skew;
              gsap.to(proxy, {
                skew: 0,
                duration: 0.8,
                ease: "power3",
                overwrite: true,
                onUpdate: applySkew,
              });
            }
          },
        });

        // footer mark tumbles in
        gsap.from("[data-foot-mark]", {
          yPercent: 30,
          rotate: -12,
          opacity: 0,
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-foot-mark]", start: "top 98%" },
        });

        if (!window.matchMedia("(pointer: fine)").matches) return;

        // product images tilt toward the pointer
        let tilted: HTMLElement | null = null;
        const tilt = (e: PointerEvent) => {
          const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-tilt]") ?? null;
          if (tilted && tilted !== el) {
            gsap.to(tilted, { rotationX: 0, rotationY: 0, duration: 0.9, ease: "power3.out" });
          }
          tilted = el;
          if (!el) return;
          const r = el.getBoundingClientRect();
          gsap.to(el, {
            rotationY: ((e.clientX - r.left) / r.width - 0.5) * 10,
            rotationX: -((e.clientY - r.top) / r.height - 0.5) * 10,
            transformPerspective: 900,
            duration: 0.6,
            ease: "power3.out",
          });
        };
        window.addEventListener("pointermove", tilt);
        cleanups.push(() => window.removeEventListener("pointermove", tilt));

        // cursor that grows into a "View" disc over [data-cursor="view"]
        const cursor = root.current?.querySelector<HTMLElement>("[data-cursor-dot]");
        const label = cursor?.querySelector("[data-cursor-label]");
        if (cursor && label) {
          gsap.set(cursor, { xPercent: -50, yPercent: -50 });
          const xTo = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" });
          const yTo = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });
          let shown = false;
          const move = (e: PointerEvent) => {
            xTo(e.clientX);
            yTo(e.clientY);
            if (!shown) {
              shown = true;
              gsap.to(cursor, { opacity: 1, duration: 0.4 });
            }
          };
          const over = (e: PointerEvent) => {
            const onView = !!(e.target as HTMLElement).closest?.("[data-cursor='view']");
            gsap.to(cursor, {
              width: onView ? 84 : 10,
              height: onView ? 84 : 10,
              duration: 0.6,
              ease: "expo.out",
            });
            gsap.to(label, { opacity: onView ? 1 : 0, duration: 0.3 });
          };
          window.addEventListener("pointermove", move);
          document.addEventListener("pointerover", over);
          cleanups.push(() => {
            window.removeEventListener("pointermove", move);
            document.removeEventListener("pointerover", over);
          });
        }

        // magnetic buttons, delegated so elements on any page pick it up
        let active: HTMLElement | null = null;
        const magnet = (e: PointerEvent) => {
          const el = (e.target as HTMLElement).closest?.<HTMLElement>("[data-magnetic]") ?? null;
          if (active && active !== el) {
            gsap.to(active, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" });
          }
          active = el;
          if (!el) return;
          const r = el.getBoundingClientRect();
          gsap.to(el, {
            x: (e.clientX - r.left - r.width / 2) * 0.25,
            y: (e.clientY - r.top - r.height / 2) * 0.35,
            duration: 0.6,
            ease: "power3.out",
          });
        };
        window.addEventListener("pointermove", magnet);
        cleanups.push(() => window.removeEventListener("pointermove", magnet));
      }, root);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
      cleanups.forEach((f) => f());
    };
  }, []);

  // curtain wipe between pages (skipped on first load, where the preloader runs)
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    let tl: { kill: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      tl = gsap
        .timeline()
        .set("[data-curtain]", { display: "flex", clipPath: "inset(0% 0% 0% 0%)" })
        .fromTo(
          "[data-curtain-mark]",
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" },
        )
        .to(
          "[data-curtain-mark]",
          { yPercent: -60, opacity: 0, duration: 0.35, ease: "power2.in" },
          "+=0.05",
        )
        .to(
          "[data-curtain]",
          { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8, ease: "expo.inOut" },
          "-=0.2",
        )
        .set("[data-curtain]", { display: "none" });
    });
    return () => tl?.kill();
  }, [path]);

  return (
    <div
      ref={root}
      className="min-h-screen overflow-x-clip bg-background font-sans text-foreground"
    >
      <TintFilters />

      {/* Film grain over everything; purely decorative */}
      <div aria-hidden className="grain pointer-events-none fixed z-[60]" />

      {/* Scroll progress */}
      <div
        data-progress
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left scale-x-0 bg-foreground"
      />

      {/* Page-change curtain */}
      <div
        data-curtain
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[95] hidden items-center justify-center bg-ink text-ink-foreground"
      >
        <span data-curtain-mark>
          <LogoMark className="h-14 w-14" />
        </span>
      </div>

      {/* Preloader */}
      <div
        data-preloader
        aria-hidden
        className="preloader-fallback fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink text-ink-foreground"
        style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      >
        <span data-pl-mark className="block">
          <LogoMark className="h-12 w-12" />
        </span>
        <div className="headline mt-6 flex overflow-hidden text-5xl tracking-[0.3em] sm:text-7xl">
          {"ADA".split("").map((l, i) => (
            <span key={i} data-pl-letter className="inline-block">
              {l}
            </span>
          ))}
        </div>
        <div className="mt-8 h-px w-40 bg-ink-foreground/20">
          <div data-pl-bar className="h-full origin-left scale-x-0 bg-ink-foreground" />
        </div>
      </div>

      {/* Cursor (fine pointers only) */}
      <div
        data-cursor-dot
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] hidden h-2.5 w-2.5 place-items-center rounded-full bg-foreground opacity-0 md:grid"
      >
        <span
          data-cursor-label
          className="text-[10px] uppercase tracking-[0.2em] text-background opacity-0"
        >
          View
        </span>
      </div>

      {/* Header: floating glass pill */}
      <header
        className={`fixed inset-x-3 top-3 z-40 mx-auto max-w-[1100px] transition-[transform,opacity] duration-700 ease-[var(--ease-luxe)] md:inset-x-6 md:top-5 ${
          hidden ? "pointer-events-none -translate-y-[160%] opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div
          className={`glass flex h-14 items-center justify-between rounded-full pl-5 pr-2 transition-shadow duration-700 md:h-[60px] md:pl-6 ${
            scrolled ? "" : "!shadow-[0_8px_24px_-14px_rgb(0_0_0/0.25)]"
          }`}
        >
          <Link to="/" className="text-lg md:text-xl" aria-label="Ada Atelier home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 text-[13px] lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-4 py-2 transition-colors duration-500 hover:bg-foreground/[0.06]"
                activeProps={{ className: "!bg-foreground text-background" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 w-10 place-items-center rounded-full transition-colors duration-500 hover:bg-foreground/[0.06] md:grid"
              aria-label="Search"
            >
              <Search className="h-4 w-4" strokeWidth={1.6} />
            </button>
            <CartButton />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <Footer />
      <MobileDock onSearch={() => setSearchOpen(true)} />
      <SearchSheet open={searchOpen} onOpenChange={setSearchOpen} />
      <CartSheet />
    </div>
  );
}

function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button
      data-bag-target
      onClick={() => setOpen(true)}
      className="flex h-10 items-center gap-2 rounded-full bg-foreground pl-4 pr-1.5 text-[13px] text-background transition-transform duration-500 active:scale-95"
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
    >
      Bag
      <span
        key={count}
        className="grid h-7 min-w-7 place-items-center rounded-full bg-background px-1.5 text-[11px] tabular-nums text-foreground animate-in zoom-in-50 duration-300"
      >
        {count}
      </span>
    </button>
  );
}

function Footer() {
  const [sent, setSent] = useState(false);
  const cols = [
    {
      title: "Shop",
      links: categories.slice(0, 3).map((c) => ({ label: c, to: "/shop", search: { cat: c } })),
    },
    {
      title: "About",
      links: [
        { label: "Our story", to: "/about" },
        { label: "Eco packing", to: "/about", hash: "eco" },
        { label: "Journal", to: "/journal" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Shipping", to: "/shipping" },
        { label: "Returns", to: "/returns" },
        { label: "Contact", to: "/contact" },
      ],
    },
  ] as const;

  return (
    <footer className="bg-ink pb-28 text-ink-foreground md:pb-0">
      <div className={`${wrap} grid gap-14 py-20 md:grid-cols-2 md:py-28`}>
        <div>
          <h2 className="headline text-5xl md:text-7xl">
            Be the best
            <br />
            version of <em>you</em>
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-10 max-w-md"
          >
            <p className="text-xs text-ink-foreground/60">
              {sent ? "Thank you — you're on the list." : "Subscribe to our newsletter"}
            </p>
            <div className="mt-4 flex items-center border-b border-ink-foreground/30 transition-colors focus-within:border-ink-foreground">
              <input
                type="email"
                required
                placeholder="Your email address"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm placeholder:text-ink-foreground/40 focus:outline-none"
              />
              <button className="group grid h-10 w-10 place-items-center" aria-label="Subscribe">
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>
        <div className="grid grid-cols-3 gap-6 text-[13px] md:justify-self-end md:gap-16">
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-ink-foreground/50">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      {...("search" in l ? { search: l.search } : {})}
                      {...("hash" in l ? { hash: l.hash } : {})}
                      className="link-line"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div
        data-foot-mark
        className="flex justify-center overflow-hidden px-5 text-ink-foreground/95"
        aria-hidden
      >
        <LogoMark className="h-[18vw] w-[18vw] max-h-64 max-w-64" />
      </div>
      <div
        className={`${wrap} mt-10 flex items-center justify-between border-t border-ink-foreground/15 py-6 text-[11px] text-ink-foreground/60`}
      >
        <span>©2026 Ada Atelier Ltd. All rights reserved</span>
        <div className="flex gap-2">
          {[
            { I: Facebook, label: "Facebook" },
            { I: Instagram, label: "Instagram" },
            { I: Twitter, label: "Twitter" },
          ].map(({ I, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="grid h-8 w-8 place-items-center rounded-full border border-ink-foreground/25 transition-colors duration-500 hover:bg-ink-foreground hover:text-ink"
            >
              <I className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SearchSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.cat} ${p.tagline}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="border-0 bg-background/85 px-5 pb-10 pt-16 backdrop-blur-2xl sm:px-12"
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <SheetDescription className="sr-only">Search the Ada Atelier collection</SheetDescription>
        <div className="mx-auto max-w-3xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bags…"
            className="headline w-full border-b border-foreground/20 bg-transparent pb-3 text-4xl outline-none placeholder:text-muted-foreground/60 focus:border-foreground md:text-6xl"
          />
          <ul className="mt-6 divide-y">
            {results.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  onClick={() => onOpenChange(false)}
                  className="group flex items-center gap-4 py-3"
                >
                  <img src={p.img} alt="" className="h-14 w-12 bg-surface object-cover" />
                  <span className="flex-1 text-sm">{p.name}</span>
                  <span className="text-sm text-muted-foreground">{money(p.price)}</span>
                  <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
            {results.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground">No bags match “{query}”.</li>
            )}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CartSheet() {
  const { lines, count, subtotal, open, setOpen, setQty } = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l-0 bg-background/90 p-0 backdrop-blur-2xl sm:max-w-md"
      >
        <div className="border-b px-6 py-6">
          <SheetTitle className="headline text-3xl font-normal">Your bag</SheetTitle>
          <SheetDescription className="text-xs">
            {count} {count === 1 ? "item" : "items"}
          </SheetDescription>
        </div>
        <ul className="flex-1 divide-y overflow-y-auto px-6">
          {lines.map((l) => (
            <li
              key={l.id}
              className="flex gap-4 py-5 animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <span className="relative block h-24 w-20 shrink-0 overflow-hidden bg-surface">
                <TintedImage
                  src={l.img}
                  mask={l.mask}
                  color={l.color}
                  alt=""
                  className="block h-full w-full object-cover"
                />
              </span>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3 text-sm">
                  <span>{l.name}</span>
                  <span className="tabular-nums">{money(l.price * l.qty)}</span>
                </div>
                <span className="mt-1 text-xs text-muted-foreground">{l.note}</span>
                <div className="mt-auto flex items-center gap-4 text-xs">
                  <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="Decrease">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="tabular-nums">{l.qty}</span>
                  <button onClick={() => setQty(l.id, l.qty + 1)} aria-label="Increase">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setQty(l.id, 0)}
                    className="link-line ml-auto text-muted-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
          {lines.length === 0 && (
            <li className="py-16 text-center">
              <p className="headline text-3xl">
                Your bag is <em>empty</em>
              </p>
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="link-line mt-4 inline-block text-sm"
              >
                Continue shopping
              </Link>
            </li>
          )}
        </ul>
        {lines.length > 0 && (
          <div className="border-t px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Shipping calculated at checkout.</p>
            <Link to="/checkout" onClick={() => setOpen(false)} className="btn mt-6 w-full">
              Checkout
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
