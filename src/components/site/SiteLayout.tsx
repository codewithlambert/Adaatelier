import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Minus,
  Plus,
  Search,
  Twitter,
  X,
  Globe,
} from "lucide-react";
import { MobileDock } from "@/components/MobileDock";
import { Logo, LogoMark } from "@/components/site/Logo";
import { TintedImage, TintFilters } from "@/components/site/Tint";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { categories, products } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useLive } from "@/lib/live";
import { loadGsap, markIntroDone, prefersReducedMotion } from "@/lib/motion";
import { supabase } from "@/lib/supabase";
import { CountryPicker } from "@/lib/currency";
import { useCurrency } from "@/lib/currency";

const wrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12";

const navLinks = [
  { to: "/shop", label: "Shop" },
  { to: "/customize", label: "Customize" },
  { to: "/about", label: "About" },
  { to: "/journal", label: "Journal" },
] as const;

/** Header, footer, preloader, cursor, mobile dock, search and bag — shared by every page. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  // admin-controlled: announcement bar and maintenance mode
  const settings = useLive()?.settings;
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).has("preview"))
        sessionStorage.setItem("ada-preview", "1");
      setPreview(sessionStorage.getItem("ada-preview") === "1");
    } catch {
      // storage blocked: no preview bypass
    }
  }, []);
  const announcement =
    settings?.announcement_enabled && settings.announcement.trim() ? settings.announcement : null;
  const closed = !!settings?.maintenance && !preview;
  const { hidden, scrolled } = useScrollDirection();
  // a soft drop shadow while over the hero; the glass carries its own once scrolling
  const lift = scrolled ? "" : "!shadow-[0_8px_24px_-14px_rgb(0_0_0/0.25)]";
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

      {announcement && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center overflow-hidden bg-ink px-4 text-center text-[11px] tracking-[0.08em] text-ink-foreground animate-in fade-in slide-in-from-top-2 duration-500">
          <span className="truncate">{announcement}</span>
        </div>
      )}

      {/* Header: floating glass pill */}
      <header
        className={`fixed inset-x-3 ${announcement ? "top-11 md:top-12" : "top-3 md:top-5"} z-40 mx-auto max-w-[1100px] transition-[transform,opacity] duration-700 ease-[var(--ease-luxe)] md:inset-x-6 ${
          hidden ? "pointer-events-none -translate-y-[160%] opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {/* separate floating pieces (logo, page links, bag) rather than one bar housing them all */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className={`glass flex h-14 items-center rounded-full px-5 text-lg transition-shadow duration-700 md:h-[60px] md:px-6 md:text-xl ${lift}`}
            aria-label="Ada Atelier home"
          >
            <Logo />
          </Link>
          <nav
            className={`glass hidden h-[60px] items-center gap-1 rounded-full px-2 text-[13px] transition-shadow duration-700 lg:flex ${lift}`}
          >
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className={`glass hidden h-[60px] w-[60px] place-items-center rounded-full transition-shadow duration-700 active:scale-95 md:grid ${lift}`}
              aria-label="Search"
            >
              <Search className="h-4 w-4" strokeWidth={1.6} />
            </button>
            <CartButton />
          </div>
        </div>
      </header>

      <main>
        {closed ? (
          <section className="grid min-h-[100svh] place-items-center bg-surface px-6 text-center">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <LogoMark className="mx-auto h-12 w-12" />
              <h1 className="headline mt-8 text-6xl md:text-8xl">
                Back <em>soon</em>
              </h1>
              <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                We&apos;re putting finishing touches on the atelier. Please check back shortly.
              </p>
            </div>
          </section>
        ) : (
          children
        )}
      </main>

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
      className="flex h-14 items-center gap-2.5 rounded-full bg-foreground pl-5 pr-2 text-[13px] text-background shadow-[0_10px_28px_-12px_rgb(0_0_0/0.5)] transition-transform duration-500 active:scale-95 md:h-[60px]"
      aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
    >
      Bag
      <span
        key={count}
        className="grid h-10 min-w-10 place-items-center rounded-full bg-background px-2 text-[12px] tabular-nums text-foreground animate-in zoom-in-50 duration-300 md:h-11 md:min-w-11"
      >
        {count}
      </span>
    </button>
  );
}

function Footer() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [failed, setFailed] = useState(false);
  const subscribe = async () => {
    setFailed(false);
    if (supabase) {
      const { error } = await supabase
        .from("subscribers")
        .insert({ email: email.trim().toLowerCase(), source: "footer" });
      // 23505: already on the list, which is a success for the shopper
      if (error && error.code !== "23505") return setFailed(true);
    }
    setSent(true);
    setEmail("");
  };
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
              void subscribe();
            }}
            className="mt-10 max-w-md"
          >
            <p className="text-xs text-ink-foreground/60">
              {sent
                ? "Thank you — you're on the list."
                : failed
                  ? "That didn't work. Check the address and try again."
                  : "New drops and stories from the workshop, once a month"}
            </p>
            <div className="mt-4 flex items-center border-b border-ink-foreground/30 transition-colors focus-within:border-ink-foreground">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span>©2026 Ada Atelier Ltd. All rights reserved</span>
          <label className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" strokeWidth={1.5} />
            <CountryPicker className="text-ink-foreground [&_option]:text-black" />
          </label>
        </div>
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
  const { format } = useCurrency();
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
      {/* capped at the screen height with only the results scrolling, so the close button can't
          scroll away and a tap meant for it can't land on a product link */}
      <SheetContent
        side="top"
        className="flex max-h-[100dvh] flex-col border-0 bg-background/90 px-5 pb-6 pt-5 backdrop-blur-2xl sm:px-12 sm:pb-10 [&>button:first-child]:hidden"
      >
        <SheetTitle className="sr-only">Search</SheetTitle>
        <SheetDescription className="sr-only">Search the Ada Atelier collection</SheetDescription>
        <div className="mx-auto flex w-full max-w-3xl justify-end">
          <SheetClose className="glass flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] font-medium active:scale-95">
            <X className="h-4 w-4" strokeWidth={1.7} /> Close
          </SheetClose>
        </div>
        <div className="mx-auto mt-4 flex min-h-0 w-full max-w-3xl flex-1 flex-col">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bags…"
            className="headline w-full border-b border-foreground/20 bg-transparent pb-3 text-4xl outline-none placeholder:text-muted-foreground/60 focus:border-foreground md:text-6xl"
          />
          <ul className="mt-6 min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain [scrollbar-width:none]">
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
                  <span className="text-sm text-muted-foreground">{format(p.price)}</span>
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
  const { format, converted } = useCurrency();
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
                  <span className="tabular-nums">{format(l.price * l.qty)}</span>
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
              <span className="tabular-nums">{format(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Shipping calculated at checkout.
              {converted && " Prices are a guide; you pay in US dollars (or naira in Nigeria)."}
            </p>
            <Link to="/checkout" onClick={() => setOpen(false)} className="btn mt-6 w-full">
              Checkout
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
