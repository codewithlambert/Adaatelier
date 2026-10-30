import type { CSSProperties } from "react";
import { bagColors, type BagColor } from "@/lib/catalog";

const fmt = (n: number) => Math.min(1, Math.max(0, n)).toFixed(3);
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

/**
 * One SVG filter per colour, rendered once in the layout. Each turns the photo to luminance,
 * stretches the dark range of black leather, then maps it onto a shadow → colour → highlight ramp,
 * so the original folds and sheen survive the recolour.
 */
export function TintFilters() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <defs>
        {bagColors
          .filter((c) => c.id !== "onyx")
          .map((c) => {
            const [r, g, b] = rgb(c.hex);
            const ramp = (v: number) =>
              [v * 0.32, v * 0.72, v, v * 0.55 + 0.45, 1].map(fmt).join(" ");
            return (
              <filter key={c.id} id={`tint-${c.id}`} colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"
                />
                <feComponentTransfer>
                  <feFuncR type="linear" slope="2.4" />
                  <feFuncG type="linear" slope="2.4" />
                  <feFuncB type="linear" slope="2.4" />
                </feComponentTransfer>
                <feComponentTransfer>
                  <feFuncR type="table" tableValues={ramp(r)} />
                  <feFuncG type="table" tableValues={ramp(g)} />
                  <feFuncB type="table" tableValues={ramp(b)} />
                </feComponentTransfer>
              </filter>
            );
          })}
      </defs>
    </svg>
  );
}

type TintedImageProps = {
  src: string;
  /** RGBA mask: opaque where the bag can be recoloured */
  mask?: string | undefined;
  color?: BagColor["id"] | undefined;
  alt: string;
  className?: string;
  objectPosition?: string | undefined;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
};

/**
 * The photo, with a tinted copy of it laid on top and clipped to the bag mask.
 * The copy shares the photo's classes, so crops, hovers and scroll effects stay aligned.
 */
export function TintedImage({
  src,
  mask,
  color = "onyx",
  alt,
  className = "",
  objectPosition,
  ...img
}: TintedImageProps) {
  const pos = objectPosition ?? "50% 50%";
  const overlay: CSSProperties = {
    objectPosition: pos,
    filter: `url(#tint-${color})`,
    maskImage: `url(${mask})`,
    WebkitMaskImage: `url(${mask})`,
    maskSize: "cover",
    WebkitMaskSize: "cover",
    maskPosition: pos,
    WebkitMaskPosition: pos,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };
  return (
    <>
      <img src={src} alt={alt} className={className} style={{ objectPosition: pos }} {...img} />
      {mask && color !== "onyx" && (
        // the fade lives on a wrapper: tw-animate's keyframes set `filter`, which would override the tint
        <span
          key={color}
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-in fade-in duration-700"
        >
          <img
            src={src}
            alt=""
            className={`${className} absolute left-0 top-0`}
            style={overlay}
            {...img}
          />
        </span>
      )}
    </>
  );
}
