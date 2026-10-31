import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { findProduct, money } from "@/lib/catalog";
import { heroSlides, SLIDE_MS } from "@/lib/hero";
import { loadGsap, prefersReducedMotion } from "@/lib/motion";

const edgeFade = "linear-gradient(to right, transparent, #000 22%, #000 78%, transparent)";

/** Stacked slides; a change of `active` wipes the next one in while the photo settles. */
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
          <img
            data-hero-img={i === 0 ? "" : undefined}
            src={s.img}
            alt={s.alt}
            loading={i === 0 ? "eager" : "lazy"}
            className={
              s.wide
                ? "h-full w-full object-cover object-[50%_70%]"
                : "absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 object-cover"
            }
            style={s.wide ? undefined : { maskImage: edgeFade, WebkitMaskImage: edgeFade }}
          />
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
        <Link
          key={p.slug}
          to="/product/$slug"
          params={{ slug: p.slug }}
          className="group mt-1 flex items-baseline justify-between gap-4 text-[13px] animate-in fade-in slide-in-from-bottom-2 duration-700"
        >
          <span>
            <span className="tabular-nums text-foreground/50">
              {String(active + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
            </span>
            <span className="ml-3">{p.name}</span>
          </span>
          <span className="flex items-center gap-1 tabular-nums text-foreground/70">
            {money(p.price)}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
    </div>
  );
}
