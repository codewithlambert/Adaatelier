import { useEffect, useState } from "react";

/** Tracks whether chrome should hide (scrolling down) and whether the page has left the top. */
export function useScrollDirection(threshold = 8) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (Math.abs(delta) > threshold) {
          setHidden(delta > 0 && y > 140);
          last = y;
        }
        setScrolled(y > 24);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { hidden, scrolled };
}
