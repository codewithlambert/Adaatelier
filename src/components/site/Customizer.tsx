import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { BagViewer3D } from "@/components/site/BagViewer3D";
import { ColorSwatches } from "@/components/site/ColorSwatches";
import { Words } from "@/components/site/Words";
import { colorName, modelled as products, money, type ColorId } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { flyToBag } from "@/lib/motion";

// Placeholder surcharge for hand-set initials
const MONOGRAM_FEE = 10;

/** Pick a bag, a colourway and initials, and see it all on a drag-to-rotate 3D bag. */
export function Customizer({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const [index, setIndex] = useState(1);
  const [color, setColor] = useState<ColorId>("cognac");
  const [initials, setInitials] = useState("AA");
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const stage = useRef<HTMLDivElement>(null);
  const Heading = heading;
  const p = products[index] ?? products[0]!;
  const price = p.price + (initials ? MONOGRAM_FEE : 0);

  const addToBag = () => {
    add(
      {
        id: `custom-${p.slug}-${color}-${initials}`,
        productId: p.slug,
        ...(initials ? { monogram: initials } : {}),
        name: `${p.name}, custom`,
        price,
        img: p.img,
        mask: p.mask,
        color,
        note: [colorName(color), initials && `Monogram ${initials}`].filter(Boolean).join(" · "),
      },
      qty,
      false,
    );
    void flyToBag(stage.current?.querySelector("img"));
  };

  return (
    <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 sm:px-8 md:grid-cols-2 md:gap-20 lg:px-12">
      <div ref={stage} className="relative">
        <BagViewer3D
          key={p.slug}
          model={p.model}
          color={color}
          monogram={initials}
          label={`${p.name} in ${colorName(color)}`}
          className="aspect-square w-full animate-in fade-in zoom-in-95 duration-700 md:aspect-[4/5]"
        />
        <p className="pointer-events-none absolute left-0 top-0 text-xs text-muted-foreground">
          {p.name} · <span className="text-foreground">{colorName(color)}</span>
        </p>
      </div>

      <div>
        <span data-fade className="eyebrow">
          Customize Product
        </span>
        <Heading data-reveal className="headline mt-5 text-5xl md:text-7xl">
          <Words lines={["Customize until", "it _suits _you"]} />
        </Heading>

        <div data-fade className="mt-12 divide-y border-y">
          <div className="py-5">
            <span className="text-xs text-muted-foreground">Bag type</span>
            <div className="mt-4 flex flex-wrap gap-2">
              {products.map((b, i) => (
                <button
                  key={b.slug}
                  onClick={() => setIndex(i)}
                  aria-pressed={index === i}
                  className="chip"
                >
                  {b.cat === "Shopper" && b.slug.startsWith("tote") ? "Tote" : b.cat}
                  <span className="ml-1.5 opacity-50">{b.name.match(/\d+$/)?.[0]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <span className="text-xs text-muted-foreground">
              Colour — <span className="text-foreground">{colorName(color)}</span>
            </span>
            <ColorSwatches value={color} onChange={setColor} size="lg" />
          </div>
          <label className="flex items-center justify-between gap-6 py-5">
            <span className="text-xs text-muted-foreground">
              Monogram <span className="opacity-60">(+{money(MONOGRAM_FEE)})</span>
            </span>
            <input
              value={initials}
              onChange={(e) =>
                setInitials(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z.&]/g, "")
                    .slice(0, 3),
                )
              }
              placeholder="ABC"
              className="headline w-28 border-b border-foreground/30 bg-transparent pb-1 text-right text-2xl tracking-[0.2em] outline-none transition-colors focus:border-foreground"
            />
          </label>
        </div>

        <div data-fade className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex h-12 items-center gap-5 border border-foreground/30 px-5 text-sm">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center tabular-nums">{String(qty).padStart(2, "0")}</span>
            <button onClick={() => setQty(qty + 1)} aria-label="Increase">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button data-magnetic onClick={addToBag} className="btn flex-1 sm:flex-none">
            Add to bag — {money(price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
