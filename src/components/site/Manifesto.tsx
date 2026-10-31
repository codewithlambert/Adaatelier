import { useEffect, useRef } from "react";
import { LogoMark } from "@/components/site/Logo";
import { loadGsap, prefersReducedMotion } from "@/lib/motion";

// "_" marks a word set in italic and warm accent
const TEXT =
  "We make bags the way they _should be made. Premium materials, cut to last, finished by _hand and packed with care. Not for a season, but for _years of carrying everything that matters to you.";

/**
 * Pinned, dark interlude: as the reader scrolls, each word hinges up out of depth and lights up,
 * while an outlined wordmark and soft glows drift behind it.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const words = TEXT.split(" ");

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    if (prefersReducedMotion()) return;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !root.current) return;
      ctx = gsap.context(() => {
        const els = gsap.utils.toArray<HTMLElement>("[data-mf-word]");
        const step = 0.12;
        const total = (els.length - 1) * step + 1;
        gsap.set(els, {
          opacity: 0.07,
          rotateX: -88,
          yPercent: 45,
          z: -80,
          transformOrigin: "50% 100%",
        });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=220%",
              scrub: 1,
              pin: true,
            },
          })
          .to(
            els,
            {
              opacity: 1,
              rotateX: 0,
              yPercent: 0,
              z: 0,
              stagger: step,
              duration: 1,
              ease: "power3.out",
            },
            0,
          )
          .fromTo(
            "[data-mf-outline]",
            { xPercent: 12 },
            { xPercent: -38, duration: total, ease: "none" },
            0,
          )
          .fromTo(
            "[data-mf-glow-a]",
            { xPercent: -30, yPercent: 20 },
            { xPercent: 40, yPercent: -25, duration: total, ease: "none" },
            0,
          )
          .fromTo(
            "[data-mf-glow-b]",
            { xPercent: 30, yPercent: -10 },
            { xPercent: -45, yPercent: 30, duration: total, ease: "none" },
            0,
          )
          .fromTo(
            "[data-mf-progress]",
            { scaleX: 0 },
            { scaleX: 1, duration: total, ease: "none" },
            0,
          )
          .from("[data-mf-sign]", { opacity: 0, y: 24, duration: 0.6 }, total - 0.3)
          .to({}, { duration: 0.5 }); // a beat of stillness before the pin releases
      }, root);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      aria-label="Our promise"
      className="relative flex h-[100svh] items-center overflow-hidden bg-ink text-ink-foreground"
    >
      {/* background: drifting glows, an outlined wordmark, its own grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          data-mf-glow-a
          className="absolute left-[10%] top-[15%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(closest-side,rgb(205_183_150/0.22),transparent)]"
        />
        <div
          data-mf-glow-b
          className="absolute bottom-[-10%] right-[5%] h-[45vmax] w-[45vmax] rounded-full bg-[radial-gradient(closest-side,rgb(154_83_40/0.18),transparent)]"
        />
        <div
          data-mf-outline
          className="headline absolute bottom-[6%] left-0 whitespace-nowrap text-[30vw] leading-none text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.09)] md:text-[22vw]"
        >
          ATELIER · ATELIER
        </div>
        <div className="grain absolute opacity-[0.09]" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-16 pt-24 sm:px-8 md:pt-20">
        <p className="eyebrow !text-ink-foreground/50">Our promise</p>
        <p
          className="headline mt-8 text-[2.15rem] leading-[1.12] sm:text-5xl md:text-6xl md:leading-[1.08]"
          style={{ perspective: "900px" }}
        >
          {words.map((w, i) => {
            const accent = w.startsWith("_");
            return (
              <span key={i}>
                <span
                  data-mf-word
                  className={`inline-block will-change-transform ${accent ? "italic text-accent" : ""}`}
                >
                  {accent ? w.slice(1) : w}
                </span>{" "}
              </span>
            );
          })}
        </p>
        <div data-mf-sign className="mt-12 flex items-center gap-4 text-ink-foreground/60">
          <LogoMark className="h-7 w-7 text-ink-foreground" />
          <span className="text-xs uppercase tracking-[0.3em]">Ada Atelier · Est. 2026</span>
        </div>
      </div>

      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-ink-foreground/10">
        <div data-mf-progress className="h-full origin-left scale-x-0 bg-ink-foreground/50" />
      </div>
    </section>
  );
}
