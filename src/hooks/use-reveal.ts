import { useEffect, useRef, type RefObject } from "react";
import { loadGsap, prefersReducedMotion, type Gsap, type ScrollTriggerT } from "@/lib/motion";

/**
 * Scroll animations shared by every page, scoped to `scope`:
 * - [data-reveal]     words ([data-word]) rise out of their masks
 * - [data-fade]       fades up
 * - [data-img-reveal] clip wipe while the inner image settles
 * - [data-parallax]   inner image drifts against the scroll
 * - [data-product]    cards stagger in per row
 * - [data-swing]      sways with the scroll
 * `extra` adds page-specific timelines inside the same GSAP context.
 */
export function useReveal(
  scope: RefObject<HTMLElement | null>,
  extra?: (gsap: Gsap, ScrollTrigger: ScrollTriggerT) => void | (() => void),
) {
  const extraRef = useRef(extra);
  extraRef.current = extra;

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cleanup: void | (() => void);
    let cancelled = false;
    if (prefersReducedMotion()) return;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !scope.current) return;
      ctx = gsap.context(() => {
        gsap.from(scope.current, { opacity: 0, duration: 0.8, ease: "power2.out" });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          // words hinge up out of their masks, tipping toward the reader
          const from = {
            yPercent: 115,
            rotateX: -85,
            opacity: 0,
            transformPerspective: 700,
            transformOrigin: "50% 100% -30px",
          };
          const to = { yPercent: 0, rotateX: 0, opacity: 1, stagger: 0.08, ease: "power3.out" };
          const words = el.querySelectorAll("[data-word]");
          // already on screen at load (page titles): play once; otherwise build with the scroll
          if (el.getBoundingClientRect().top < window.innerHeight * 0.75) {
            gsap.fromTo(words, from, { ...to, duration: 1.3, stagger: 0.06, ease: "expo.out" });
          } else {
            gsap.fromTo(words, from, {
              ...to,
              scrollTrigger: { trigger: el, start: "top 95%", end: "top 55%", scrub: 0.8 },
            });
          }
        });
        gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
          gsap.from(el, {
            y: 28,
            opacity: 0,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 92%" },
          });
        });
        gsap.utils.toArray<HTMLElement>("[data-img-reveal]").forEach((el) => {
          gsap
            .timeline({ scrollTrigger: { trigger: el, start: "top 90%" } })
            .fromTo(
              el,
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" },
            )
            .from(el.querySelectorAll("img"), { scale: 1.35, duration: 2, ease: "expo.out" }, 0.2);
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll("img"),
            { yPercent: -8 },
            {
              yPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
        if (scope.current?.querySelector("[data-product]")) {
          gsap.set("[data-product]", { opacity: 0, y: 70 });
          ScrollTrigger.batch("[data-product]", {
            start: "top 94%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 1.3, ease: "expo.out" }),
          });
        }
        gsap.utils.toArray<HTMLElement>("[data-swing]").forEach((el) => {
          gsap.fromTo(
            el,
            { rotate: -6 },
            {
              rotate: 6,
              ease: "sine.inOut",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        cleanup = extraRef.current?.(gsap, ScrollTrigger);
      }, scope);
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      cleanup?.();
      ctx?.revert();
    };
  }, [scope]);
}
