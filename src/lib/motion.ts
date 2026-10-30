import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

declare global {
  interface Window {
    __luvbagReady?: boolean;
  }
}

export type Gsap = typeof GSAP;
export type ScrollTriggerT = typeof ST;

let loading: Promise<{ gsap: Gsap; ScrollTrigger: ScrollTriggerT }> | undefined;

/** Loads GSAP + ScrollTrigger once, client-side only. */
export function loadGsap() {
  loading ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, s]) => {
    g.gsap.registerPlugin(s.ScrollTrigger);
    return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
  });
  return loading;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The preloader calls this when the curtain lifts; the home hero waits for it. */
export function markIntroDone() {
  window.__luvbagReady = true;
  window.dispatchEvent(new Event("luvbag:ready"));
}

export function whenIntroDone(cb: () => void) {
  if (window.__luvbagReady) {
    cb();
    return () => {};
  }
  window.addEventListener("luvbag:ready", cb, { once: true });
  return () => window.removeEventListener("luvbag:ready", cb);
}

/** Sends a copy of `source` (a product image) arcing into the visible bag button, then bumps the button. */
export async function flyToBag(source: Element | null | undefined) {
  const target = [...document.querySelectorAll<HTMLElement>("[data-bag-target]")].find(
    (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden",
  );
  if (!source || !target || prefersReducedMotion()) return;
  const { gsap } = await loadGsap();
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "80",
    pointerEvents: "none",
    objectFit: "cover",
  });
  document.body.appendChild(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  await gsap
    .timeline({ onComplete: () => ghost.remove() })
    .to(ghost, { x: dx, duration: 0.8, ease: "power2.in" }, 0)
    .to(ghost, { y: dy, duration: 0.8, ease: "back.in(1.6)" }, 0)
    .to(ghost, { scale: 0.08, borderRadius: "50%", duration: 0.8, ease: "power2.in" }, 0)
    .to(ghost, { opacity: 0, duration: 0.15 }, 0.7)
    .fromTo(
      target,
      { scale: 1 },
      { scale: 1.25, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" },
      0.75,
    )
    .then();
}
