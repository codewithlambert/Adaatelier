import type React from "react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Rotate3d } from "lucide-react";
import { TintedImage } from "@/components/site/Tint";
import { bagColors, type BagModel, type ColorId } from "@/lib/catalog";
import { prefersReducedMotion } from "@/lib/motion";

const LAYERS = 12;
const REST_TILT = -6;

/** Darkens a #rrggbb colour for the side walls of the extrusion. */
function shade(hex: string, f: number) {
  const n = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f));
  return `rgb(${n.join(" ")})`;
}

type Props = {
  model: BagModel;
  color: ColorId;
  label: string;
  monogram?: string | undefined;
  className?: string;
};

/**
 * Drag-to-rotate 3D bag. The cut-out is stacked in depth: tinted photo on the front and back,
 * solid silhouettes in a darker shade between them, so the bag has real thickness as it turns.
 */
export function BagViewer3D({ model, color, label, monogram, className = "" }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const spin = useRef<HTMLDivElement>(null);
  const state = useRef({ y: -24, x: REST_TILT, vy: 0, dragging: false, px: 0, py: 0, idleAt: 0 });
  const [h, setH] = useState(420);
  const [hinted, setHinted] = useState(false);

  // fit the bag to the frame
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (!e) return;
      const { width, height } = e.contentRect;
      setH(Math.round(Math.min(height * 0.78, (width * 0.78) / model.aspect)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [model.aspect]);

  // render loop: momentum after a drag, gentle auto-spin when idle, tilt eases back to rest
  useEffect(() => {
    const auto = !prefersReducedMotion();
    let raf = 0;
    const tick = (t: number) => {
      const s = state.current;
      if (!s.dragging) {
        s.y += s.vy;
        s.vy *= 0.94;
        if (auto && Math.abs(s.vy) < 0.05 && t - s.idleAt > 2500) s.y += 0.22;
        s.x += (REST_TILT - s.x) * 0.06;
      }
      if (spin.current) spin.current.style.transform = `rotateX(${s.x}deg) rotateY(${s.y}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    const s = state.current;
    s.dragging = true;
    s.px = e.clientX;
    s.py = e.clientY;
    s.vy = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    setHinted(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.px;
    const dy = e.clientY - s.py;
    s.px = e.clientX;
    s.py = e.clientY;
    s.vy = dx * 0.45;
    s.y += s.vy;
    s.x = Math.max(-28, Math.min(22, s.x - dy * 0.25));
  };
  const onUp = () => {
    const s = state.current;
    s.dragging = false;
    s.idleAt = performance.now();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const s = state.current;
    if (e.key === "ArrowLeft") s.vy = -5;
    else if (e.key === "ArrowRight") s.vy = 5;
    else return;
    e.preventDefault();
    s.idleAt = performance.now();
    setHinted(true);
  };

  const w = Math.round(h * model.aspect);

  return (
    <div
      ref={box}
      role="img"
      tabIndex={0}
      aria-label={`${label}, 3D view. Drag or use the arrow keys to rotate.`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
      className={`relative cursor-grab touch-pan-y select-none overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-foreground active:cursor-grabbing ${className}`}
      style={{ perspective: "1600px" }}
    >
      {/* floor shadow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[calc(50%+var(--half))] h-8 -translate-x-1/2 rounded-[50%] bg-black/25 blur-xl"
        style={{ width: w * 0.9, ["--half" as string]: `${h / 2 - 10}px` }}
      />
      <div className="absolute left-1/2 top-1/2 h-px w-px">
        <div ref={spin} className="preserve-3d absolute left-0 top-0">
          <ExtrudedBag model={model} color={color} h={h} monogram={monogram} />
        </div>
      </div>

      <span
        className={`pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-card/80 px-3.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur transition-opacity duration-700 ${hinted ? "opacity-0" : "opacity-100"}`}
      >
        <Rotate3d className="h-3.5 w-3.5" strokeWidth={1.6} /> Drag to rotate
      </span>
    </div>
  );
}

type ExtrudedBagProps = {
  model: BagModel;
  color: ColorId;
  /** rendered height in px */
  h: number;
  monogram?: string | undefined;
  /** where the 3D origin sits on the bag: its centre (viewer) or the middle of its base (box) */
  anchor?: "center" | "bottom";
};

/**
 * The bag as stacked planes: tinted photo front and back, solid silhouettes in a darker shade
 * between them. Render inside a `preserve-3d` parent.
 */
export function ExtrudedBag({ model, color, h, monogram, anchor = "center" }: ExtrudedBagProps) {
  const w = Math.round(h * model.aspect);
  const depth = (model.depth * h) / 420;
  const step = depth / (LAYERS - 1);
  const top = anchor === "center" ? -h / 2 : -h;
  const hex = bagColors.find((c) => c.id === color)?.hex ?? "#151515";
  const plane = (z: number, extra = ""): CSSProperties => ({
    width: w,
    height: h,
    transform: `translate3d(${-w / 2}px, ${top}px, ${z}px)${extra}`,
  });
  const silhouette: CSSProperties = {
    background: shade(hex, color === "onyx" ? 0.6 : 0.42),
    maskImage: `url(${model.src})`,
    WebkitMaskImage: `url(${model.src})`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
  };
  const photo = (
    <TintedImage
      src={model.src}
      mask={model.mask}
      color={color}
      alt=""
      className="absolute inset-0 h-full w-full max-w-none"
    />
  );

  return (
    <>
      {/* back */}
      <div
        className="face"
        style={{ ...plane(-depth / 2, " rotateY(180deg)"), filter: "brightness(0.7)" }}
      >
        {photo}
      </div>
      {/* side walls */}
      {Array.from({ length: LAYERS - 2 }, (_, i) => (
        <div
          key={i}
          className="face"
          style={{ ...plane(-depth / 2 + step * (i + 1)), ...silhouette }}
        />
      ))}
      {/* front */}
      <div className="face" style={plane(depth / 2)}>
        {photo}
        {monogram && (
          <span
            key={monogram}
            className="headline pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 tracking-[0.14em] text-white/85 animate-in fade-in zoom-in-95 duration-500 [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]"
            style={{
              left: `${model.monogram[0] * 100}%`,
              top: `${model.monogram[1] * 100}%`,
              fontSize: h * 0.075,
            }}
          >
            {monogram}
          </span>
        )}
      </div>
    </>
  );
}
