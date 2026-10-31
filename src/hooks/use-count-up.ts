import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Eases from the previous value (0 on first run) to `target` — for dashboard figures. */
export function useCountUp(target: number, duration = 1400, delay = 0) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = from.current;
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t + delay;
      const p = Math.min(1, Math.max(0, (t - t0) / duration));
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, duration, delay]);

  return value;
}
