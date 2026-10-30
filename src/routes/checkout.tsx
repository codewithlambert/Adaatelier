import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { LogoMark } from "@/components/site/Logo";
import { TintedImage } from "@/components/site/Tint";
import { PageHeader } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { money } from "@/lib/catalog";
import { useCart, type CartLine } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — LUVBAG" }] }),
  component: Checkout,
});

const field =
  "w-full border-b border-foreground/25 bg-transparent py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground";

const STANDARD = 6;
const EXPRESS = 15;

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const [express, setExpress] = useState(false);
  const [placed, setPlaced] = useState<{ lines: CartLine[]; total: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  const shipping = express ? EXPRESS : STANDARD;
  const total = subtotal + shipping;

  if (placed) {
    return (
      <div ref={root} className="mx-auto max-w-xl px-5 pb-24 pt-36 text-center md:pt-48">
        <LogoMark className="mx-auto h-12 w-12 animate-in zoom-in-50 duration-700" />
        <h1 className="headline mt-8 text-6xl md:text-7xl">
          Thank <em>you</em>
        </h1>
        <p className="mt-6 text-sm text-muted-foreground">
          Your order of {placed.lines.reduce((n, l) => n + l.qty, 0)} items ({money(placed.total)})
          has been received. A confirmation is on its way to your inbox.
        </p>
        <Link to="/shop" className="btn mt-10">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div ref={root} className="pb-24">
        <PageHeader eyebrow="Checkout" lines={["Your bag is", "_empty"]} />
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <Link to="/shop" className="btn">
            Shop the collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={root} className="pb-24 md:pb-36">
      <PageHeader eyebrow="Checkout" lines={["Almost", "_yours"]} />
      <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-5 sm:px-8 md:grid-cols-[1.3fr_1fr] md:gap-24 lg:px-12">
        <form
          id="checkout"
          onSubmit={(e) => {
            e.preventDefault();
            setPlaced({ lines, total });
            clear();
            window.scrollTo({ top: 0 });
          }}
          className="space-y-14"
        >
          <fieldset data-fade className="grid gap-6 border-t pt-8 sm:grid-cols-2">
            <legend className="eyebrow mb-6">Contact</legend>
            <input
              required
              type="email"
              placeholder="Email"
              autoComplete="email"
              className={`${field} sm:col-span-2`}
            />
          </fieldset>
          <fieldset data-fade className="grid gap-6 border-t pt-8 sm:grid-cols-2">
            <legend className="eyebrow mb-6">Delivery</legend>
            <input required placeholder="First name" autoComplete="given-name" className={field} />
            <input required placeholder="Last name" autoComplete="family-name" className={field} />
            <input
              required
              placeholder="Address"
              autoComplete="street-address"
              className={`${field} sm:col-span-2`}
            />
            <input required placeholder="City" autoComplete="address-level2" className={field} />
            <input required placeholder="Postcode" autoComplete="postal-code" className={field} />
            <input required placeholder="Country" autoComplete="country-name" className={field} />
            <input type="tel" placeholder="Phone (optional)" autoComplete="tel" className={field} />
          </fieldset>
          <fieldset data-fade className="border-t pt-8">
            <legend className="eyebrow mb-6">Shipping method</legend>
            {[
              {
                id: false,
                label: "Standard · 3–5 business days",
                price: STANDARD,
              },
              { id: true, label: "Express · 1–2 business days", price: EXPRESS },
            ].map((o) => (
              <label
                key={o.label}
                className="flex cursor-pointer items-center justify-between gap-4 border-b py-4 text-sm"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="ship"
                    checked={express === o.id}
                    onChange={() => setExpress(o.id)}
                    className="accent-foreground"
                  />
                  {o.label}
                </span>
                <span className="tabular-nums">{o.price ? money(o.price) : "Free"}</span>
              </label>
            ))}
          </fieldset>
          <p data-fade className="border-t pt-8 text-xs text-muted-foreground">
            Payment isn't connected yet — placing an order here only shows a confirmation.
          </p>
        </form>

        <aside className="md:sticky md:top-28 md:self-start">
          <div data-fade className="bg-surface p-6 md:p-8">
            <p className="eyebrow">Order summary</p>
            <ul className="mt-6 divide-y divide-foreground/10">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-4 py-4">
                  <div className="relative">
                    <span className="relative block h-20 w-16 overflow-hidden bg-card">
                      <TintedImage
                        src={l.img}
                        mask={l.mask}
                        color={l.color}
                        alt=""
                        className="block h-full w-full object-cover"
                      />
                    </span>
                    <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] text-background">
                      {l.qty}
                    </span>
                  </div>
                  <div className="flex flex-1 justify-between gap-3 text-sm">
                    <div>
                      <p>{l.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{l.note}</p>
                    </div>
                    <span className="tabular-nums">{money(l.price * l.qty)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-foreground/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">{shipping ? money(shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-foreground/10 pt-3 text-base">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(total)}</dd>
              </div>
            </dl>
            <button form="checkout" data-magnetic className="btn mt-8 w-full">
              Place order
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
