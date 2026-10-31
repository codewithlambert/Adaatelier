import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ColorSwatches } from "@/components/site/ColorSwatches";
import { TintedImage } from "@/components/site/Tint";
import { colorName, money, type ColorId, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useLiveProduct } from "@/lib/live";
import { flyToBag } from "@/lib/motion";

export function ProductCard({ p: base }: { p: Product }) {
  // admin-controlled name, price, stock and colourways
  const { product: p, stock, colors } = useLiveProduct(base);
  const soldOut = stock === 0;
  const [picked, setColor] = useState<ColorId>("onyx");
  const color = colors && !colors.includes(picked) ? (colors[0] ?? "onyx") : picked;
  const { add } = useCart();
  const quickAdd = (e: React.MouseEvent<HTMLElement>) => {
    if (soldOut) return;
    add(
      {
        id: `${p.slug}-${color}`,
        productId: p.slug,
        name: p.name,
        price: p.price,
        img: p.img,
        mask: p.mask,
        color,
        note: `${p.cat} · ${colorName(color)}`,
      },
      1,
      false,
    );
    void flyToBag(e.currentTarget.closest("article")?.querySelector("img"));
  };

  return (
    <article data-product className="group">
      <div data-tilt className="relative overflow-hidden bg-surface">
        <Link
          to="/product/$slug"
          params={{ slug: p.slug }}
          search={color === "onyx" ? {} : { color }}
          data-cursor="view"
          className="block"
          tabIndex={-1}
        >
          <TintedImage
            src={p.img}
            mask={p.mask}
            color={color}
            alt={`${p.name} in ${colorName(color)}`}
            loading="lazy"
            width={768}
            height={896}
            objectPosition={p.focus}
            className="block aspect-[4/5] w-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-[1.06]"
          />
        </Link>
        {soldOut ? (
          <span className="eyebrow pointer-events-none absolute left-3 top-3 bg-background/85 px-2 py-1 !text-foreground">
            Sold out
          </span>
        ) : (
          p.isNew && (
            <span className="eyebrow pointer-events-none absolute left-3 top-3 !text-foreground">
              New
            </span>
          )
        )}
        <button
          onClick={quickAdd}
          className="absolute inset-x-3 bottom-3 hidden h-11 translate-y-4 items-center justify-center gap-2 bg-card/90 text-[11px] uppercase tracking-[0.18em] opacity-0 backdrop-blur transition-[transform,opacity] duration-700 ease-[var(--ease-luxe)] focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:flex"
        >
          {soldOut ? (
            "Sold out"
          ) : (
            <>
              Quick add <Plus className="h-3.5 w-3.5" />
            </>
          )}
        </button>
        <button
          onClick={quickAdd}
          aria-label={`Add ${p.name} in ${colorName(color)} to bag`}
          hidden={soldOut}
          className="glass absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full active:scale-90 md:hidden"
        >
          <Plus className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <Link to="/product/$slug" params={{ slug: p.slug }}>
          <h3 className="text-[13px] md:text-sm">{p.name}</h3>
        </Link>
        <span className="text-[13px] tabular-nums text-muted-foreground md:text-sm">
          {money(p.price)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {p.mask ? (
          <ColorSwatches
            value={color}
            onChange={setColor}
            allowed={colors}
            className="-ml-1.5 !gap-0"
          />
        ) : (
          <span className="text-[11px] text-muted-foreground">{p.cat}</span>
        )}
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {colorName(color)}
        </span>
      </div>
    </article>
  );
}
