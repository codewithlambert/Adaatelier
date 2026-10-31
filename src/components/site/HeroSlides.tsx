import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { findProduct } from "@/lib/catalog";
import { heroSlides, SLIDE_MS } from "@/lib/hero";
import { loadGsap, prefersReducedMotion } from "@/lib/motion";
import { useCurrency } from "@/lib/currency";

/** Stacked slides; a change of `active` wipes the next one in, re-raises ADA and settles the bag. */
export function HeroMedia({ active }: { active: number }) {
  const root = useRef<HTMLDivElement>(null);
  const prev = useRef(active);

  useEffect(() => {
    const from = prev.current;
    prev.current = active;
    if (from === active || !root.current) return;
    const slides = root.current.querySelectorAll<HTMLElement>("[data-slide]");
    const next = slides[active];
    const out = slides[from];
    if (!next || !out) return;
    slides.forEach((s, i) => (s.style.zIndex = i === active ? "2" : i === from ? "1" : "0"));
    if (prefersReducedMotion()) {
      next.style.clipPath = "inset(0% 0% 0% 0%)";
      return;
    }
    let tl: { kill: () => void } | undefined;
    void loadGsap().then(({ gsap }) => {
      tl = gsap
        .timeline({ defaults: { ease: "expo.inOut" } })
        .fromTo(
          next,
          { clipPath: "inset(0% 0% 0% 100%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5 },
        )
        .fromTo(
          next.querySelector("img"),
          { scale: 1.25, xPercent: 6 },
          { scale: 1.06, xPercent: 0, duration: 1.8, ease: "expo.out" },
          0,
        )
        .fromTo(
          next.querySelectorAll("[data-letter]"),
          { yPercent: 105 },
          { yPercent: 0, stagger: 0.07, duration: 1.4, ease: "expo.out" },
          0.35,
        )
        .to(out.querySelector("img"), { xPercent: -8, scale: 1.12, duration: 1.5 }, 0)
        // slow push-in while the slide holds
        .to(next.querySelector("img"), { scale: 1, duration: SLIDE_MS / 1000, ease: "none" }, 1.8);
    });
    return () => tl?.kill();
  }, [active]);

  return (
    <div ref={root} className="absolute inset-0">
      {heroSlides.map((s, i) => (
        <div
          key={s.slug}
          data-slide
          className="absolute inset-0 overflow-hidden"
          style={{
            background: s.bg,
            zIndex: i === 0 ? 2 : 0,
            clipPath: i === 0 ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 100%)",
          }}
        >
          {/* giant wordmark behind the bag */}
          <div
            data-hero-wordmark
            aria-hidden
            className="headline pointer-events-none absolute inset-x-0 top-[17%] flex justify-center overflow-hidden text-[40vw] leading-[0.82] tracking-[0.02em] text-white/95 md:top-[9%] md:text-[29vw]"
          >
            {"ADA".split("").map((l, k) => (
              <span
                key={k}
                data-letter
                data-hero-letter={i === 0 ? "" : undefined}
                className="inline-block"
              >
                {l}
              </span>
            ))}
          </div>
          {/* the bag in front: below the header pill, and above the headline on phones */}
          <div className="absolute inset-x-0 bottom-[42%] top-24 md:bottom-[3%] md:top-[13%]">
            {/* static floor shadow: a soft gradient is far cheaper than a drop-shadow filter on a moving image */}
            <span
              aria-hidden
              className="absolute bottom-[-2%] left-1/2 h-[7%] w-[46%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.28),transparent)] md:w-[30%]"
            />
            <img
              data-hero-img={i === 0 ? "" : undefined}
              src={s.cut}
              alt={s.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 object-contain"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Story-style progress bars with the current bag's name and price. */
export function HeroControls({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (i: number) => void;
}) {
  const { format } = useCurrency();
  const slide = heroSlides[active] ?? heroSlides[0]!;
  const p = findProduct(slide.slug);
  return (
    <div className="w-full max-w-md">
      <div className="flex gap-1.5" role="tablist" aria-label="Featured bags">
        {heroSlides.map((s, i) => (
          <button
            key={s.slug}
            role="tab"
            aria-selected={i === active}
            aria-label={findProduct(s.slug)?.name ?? s.slug}
            onClick={() => onSelect(i)}
            className="group h-6 flex-1"
          >
            <span className="relative block h-px w-full overflow-hidden bg-foreground/20 transition-[height] group-hover:h-0.5">
              <span
                key={i === active ? `on-${active}` : "off"}
                className={`absolute inset-0 origin-left bg-foreground ${i === active ? "hero-progress" : ""}`}
                style={{
                  transform: i < active ? "scaleX(1)" : i > active ? "scaleX(0)" : undefined,
                  animationDuration: i === active ? `${SLIDE_MS}ms` : undefined,
                }}
              />
            </span>
          </button>
        ))}
      </div>
      {p && (
        // a solid pill with an arrow button, so it reads as "go to this bag" and not a caption
        <Link
          key={p.slug}
          to="/product/$slug"
          params={{ slug: p.slug }}
          aria-label={`View ${p.name}, ${format(p.price)}`}
          className="glass group mt-2 flex items-center justify-between gap-4 rounded-full py-1.5 pl-5 pr-1.5 text-[13px] animate-in fade-in slide-in-from-bottom-2 duration-700 active:scale-[0.98]"
        >
          <span className="min-w-0 truncate">
            <span className="tabular-nums text-foreground/50">
              {String(active + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
            </span>
            <span className="ml-3 font-medium">{p.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3 tabular-nums">
            {format(p.price)}
            <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background transition-transform duration-500 group-hover:rotate-45">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}
