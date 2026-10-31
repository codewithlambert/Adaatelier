import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BagViewer3D } from "@/components/site/BagViewer3D";
import { ColorSwatches } from "@/components/site/ColorSwatches";
import { TintedImage } from "@/components/site/Tint";
import { Words } from "@/components/site/Words";
import { colorName, money, type ColorId, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useLiveProduct } from "@/lib/live";
import { flyToBag } from "@/lib/motion";

type Props = {
  product: Product;
  initialColor?: ColorId | undefined;
  /** called when the shopper picks a colour, e.g. to mirror it in the URL */
  onColorChange?: (color: ColorId) => void;
};

/** Gallery + buy box for one product: colourways, quantity, add to bag and the info accordion. */
export function ProductDetails({ product: base, initialColor = "onyx", onColorChange }: Props) {
  // admin-controlled name, price, stock and colourways
  const { product: p, stock, colors } = useLiveProduct(base);
  const soldOut = stock === 0;
  const [picked, setColor] = useState<ColorId>(initialColor);
  const color = colors && !colors.includes(picked) ? (colors[0] ?? "onyx") : picked;
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const gallery = useRef<HTMLDivElement>(null);
  // the 3D view leads; then the photo and a close-up crop of it
  const shots = [p.focus ?? "50% 50%", "50% 30%"];

  const slides = ["3D view", "Photo", "Detail"];
  const [slide, setSlide] = useState(0);
  const goTo = (i: number) => {
    const el = gallery.current?.children[i] as HTMLElement | undefined;
    gallery.current?.scrollTo({ left: (el?.offsetLeft ?? 0) - 20, behavior: "smooth" });
  };
  const onGalleryScroll = () => {
    const g = gallery.current;
    if (!g) return;
    const kids = [...g.children] as HTMLElement[];
    let best = 0;
    kids.forEach((k, i) => {
      if (
        Math.abs(k.offsetLeft - 20 - g.scrollLeft) <
        Math.abs((kids[best]?.offsetLeft ?? 0) - 20 - g.scrollLeft)
      )
        best = i;
    });
    setSlide(best);
  };

  const pick = (c: ColorId) => {
    setColor(c);
    onColorChange?.(c);
  };

  const addToBag = () => {
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
      qty,
      false,
    );
    void flyToBag(gallery.current?.querySelector("[data-shot]"));
  };

  return (
    <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 pb-24 pt-24 sm:px-8 md:grid-cols-[1.25fr_1fr] md:gap-16 md:pt-32 lg:px-12">
      {/* Gallery: swipeable slides with a picker on mobile, grid on desktop */}
      <div className="min-w-0">
        <div
          ref={gallery}
          onScroll={onGalleryScroll}
          className="relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0"
        >
          <div className="relative w-[82%] shrink-0 snap-start bg-surface md:col-span-2 md:w-auto">
            <BagViewer3D
              model={p.model}
              color={color}
              label={`${p.name} in ${colorName(color)}`}
              className="aspect-[4/5] w-full md:aspect-[5/4]"
            />
          </div>
          {shots.map((pos, i) => (
            <div
              key={pos}
              data-img-reveal
              className="relative w-[82%] shrink-0 snap-start overflow-hidden bg-surface md:w-auto"
            >
              <span data-shot={i === 0 ? "" : undefined} className="block">
                <TintedImage
                  src={p.img}
                  mask={p.mask}
                  color={color}
                  objectPosition={pos}
                  alt={i === 0 ? `${p.name} in ${colorName(color)}` : `${p.name}, detail`}
                  className={`block aspect-[4/5] w-full object-cover ${i === 0 ? "" : "scale-150"}`}
                />
              </span>
            </div>
          ))}
        </div>
        {/* The 3D slide turns on sideways drags, so give every slide a direct button */}
        <div
          className="mt-4 flex items-center justify-center gap-2 md:hidden"
          role="tablist"
          aria-label="Gallery"
        >
          {slides.map((label, i) => (
            <button
              key={label}
              role="tab"
              aria-selected={slide === i}
              aria-pressed={slide === i}
              onClick={() => goTo(i)}
              className="chip"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Buy box */}
      <div className="md:sticky md:top-28 md:self-start">
        <nav data-fade className="eyebrow flex gap-2">
          <Link to="/shop" className="link-line">
            Shop
          </Link>
          <span>/</span>
          <Link to="/shop" search={{ cat: p.cat }} className="link-line">
            {p.cat}
          </Link>
        </nav>
        <h1 data-reveal className="headline mt-6 text-5xl md:text-6xl">
          <Words lines={[p.name]} />
        </h1>
        <p data-fade className="mt-4 text-xl tabular-nums">
          {money(p.price)}
        </p>
        <p data-fade className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          {p.description}
        </p>

        <div data-fade className="mt-10 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            Colour — <span className="text-foreground">{colorName(color)}</span>
          </p>
          <ColorSwatches
            value={color}
            onChange={pick}
            allowed={colors}
            className="mt-4"
            size="lg"
          />
        </div>

        <div data-fade className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex h-12 items-center gap-5 border border-foreground/30 px-5 text-sm">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center tabular-nums">{String(qty).padStart(2, "0")}</span>
            <button
              onClick={() => setQty(stock === null ? qty + 1 : Math.min(stock, qty + 1))}
              aria-label="Increase"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            data-magnetic
            onClick={addToBag}
            disabled={soldOut}
            className="btn flex-1 disabled:pointer-events-none disabled:opacity-50"
          >
            {soldOut ? "Sold out" : `Add to bag — ${money(p.price * qty)}`}
          </button>
        </div>
        <p data-fade className="mt-4 text-xs text-muted-foreground">
          {stock !== null && stock > 0 && stock < 5 ? `Only ${stock} left · ` : ""}Free 30-day
          returns · Ships in our eco box
        </p>

        <Accordion
          data-fade
          type="single"
          collapsible
          defaultValue="details"
          className="mt-10 border-t"
        >
          <AccordionItem value="details">
            <AccordionTrigger className="text-[13px] font-normal hover:no-underline">
              Details
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {p.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="shipping">
            <AccordionTrigger className="text-[13px] font-normal hover:no-underline">
              Shipping & returns
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Orders ship within 2 business days in our recyclable Ada Atelier box. Returns are free
              within 30 days.{" "}
              <Link to="/shipping" className="link-line text-foreground">
                Shipping
              </Link>{" "}
              ·{" "}
              <Link to="/returns" className="link-line text-foreground">
                Returns
              </Link>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="care">
            <AccordionTrigger className="text-[13px] font-normal hover:no-underline">
              Care
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Wipe with a soft dry cloth. Keep away from direct heat and store stuffed with tissue
              in its dust bag to hold the shape.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
