import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Loader2, Lock, Tag, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LogoMark } from "@/components/site/Logo";
import { TintedImage } from "@/components/site/Tint";
import { PageHeader } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { money } from "@/lib/catalog";
import { useCart, type CartLine } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — Ada Atelier" }, { name: "robots", content: "noindex" }],
  }),
  component: Checkout,
});

const field =
  "w-full border-b border-foreground/25 bg-transparent py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground";
const countries = ["Nigeria", "United States", "United Kingdom", "Ghana", "Canada", "Other"];
// used until store settings load (and when Supabase isn't configured)
const DEFAULT_SHIPPING = { standard: 6, express: 15 };

type Discount = { code: string; kind: "percent" | "fixed" | "free_shipping"; amount: number };
type Placed = { id: string | null; lines: CartLine[]; total: number; email: string };

/** Turns database errors into something a shopper can act on. */
function friendly(message: string) {
  if (/only \d+ left/i.test(message) || /no longer available|not offered/i.test(message))
    return message;
  if (/maintenance/i.test(message))
    return "The store is briefly closed for maintenance. Please try again soon.";
  if (/email/i.test(message)) return "Please enter a valid email address.";
  return "We couldn't place your order. Please try again, or contact us if it keeps happening.";
}

function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const [form, setForm] = useState({
    email: "",
    phone: "",
    name: "",
    country: "Nigeria",
    address: "",
    city: "",
    state: "",
    postcode: "",
  });
  const [express, setExpress] = useState(false);
  const [rates, setRates] = useState(DEFAULT_SHIPPING);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  // shipping prices are set in the admin (store_settings)
  useEffect(() => {
    void supabase
      ?.from("store_settings")
      .select("standard_shipping, express_shipping")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setRates({
            standard: Number(data.standard_shipping),
            express: Number(data.express_shipping),
          });
      });
  }, []);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const baseShipping = express ? rates.express : rates.standard;
  const shipping = discount?.kind === "free_shipping" ? 0 : baseShipping;
  const off =
    discount?.kind === "percent"
      ? Math.round(subtotal * discount.amount) / 100
      : discount?.kind === "fixed"
        ? Math.min(discount.amount, subtotal)
        : 0;
  const total = subtotal - off + shipping;

  const applyCode = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setCodeError(null);
    if (!supabase) return setCodeError("Codes can't be checked right now.");
    setChecking(true);
    const { data, error: err } = await supabase.rpc("check_discount", { p_code: c });
    setChecking(false);
    const hit = (data as Discount[] | null)?.[0];
    if (err || !hit) return setCodeError("That code isn't valid or has expired.");
    setDiscount({ ...hit, amount: Number(hit.amount) });
    setCode("");
  };

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const snapshot = { lines, total, email: form.email };
    if (!supabase) {
      // no database configured (local preview): confirm without saving
      setPlaced({ id: null, ...snapshot });
      clear();
      window.scrollTo({ top: 0 });
      return;
    }
    setPlacing(true);
    const { data, error: err } = await supabase.rpc("place_order", {
      p_customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: {
          line1: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postcode: form.postcode.trim(),
          country: form.country,
        },
      },
      p_items: lines.map((l) => ({
        product_id: l.productId,
        color: l.color ?? "onyx",
        qty: l.qty,
        ...(l.monogram ? { monogram: l.monogram } : {}),
      })),
      p_channel: "Online store",
      p_payment_method: "Pending",
      p_discount_code: discount?.code ?? null,
      p_express: express,
    });
    setPlacing(false);
    if (err) {
      setError(friendly(err.message));
      return;
    }
    setPlaced({ id: data as string, ...snapshot });
    clear();
    window.scrollTo({ top: 0 });
  };

  if (placed) {
    return (
      <div ref={root} className="mx-auto max-w-xl px-5 pb-24 pt-36 text-center md:pt-48">
        <LogoMark className="mx-auto h-12 w-12 animate-in zoom-in-50 duration-700" />
        <h1 className="headline mt-8 text-6xl md:text-7xl">
          Thank <em>you</em>
        </h1>
        {placed.id && (
          <p className="mt-6 inline-block border px-4 py-2 text-sm tracking-[0.18em]">
            ORDER {placed.id}
          </p>
        )}
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          We&apos;ve received your order of {placed.lines.reduce((n, l) => n + l.qty, 0)}{" "}
          {placed.lines.length === 1 && placed.lines[0]!.qty === 1 ? "bag" : "bags"} (
          {money(placed.total)}). We&apos;ll email{" "}
          <span className="text-foreground">{placed.email}</span> with payment and delivery details.
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
      <PageHeader
        eyebrow="Checkout"
        lines={["Almost", "_yours"]}
        intro="No account needed. Just your details and we'll take it from here."
      />
      <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-5 sm:px-8 md:grid-cols-[1.3fr_1fr] md:gap-24 lg:px-12">
        <form id="checkout" onSubmit={placeOrder} className="space-y-14">
          <fieldset data-fade className="grid gap-6 border-t pt-8 sm:grid-cols-2">
            <legend className="eyebrow mb-6">Contact</legend>
            <input
              required
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              className={field}
            />
            <input
              required
              type="tel"
              placeholder="Phone (for delivery)"
              autoComplete="tel"
              value={form.phone}
              onChange={set("phone")}
              className={field}
            />
          </fieldset>

          <fieldset data-fade className="grid gap-6 border-t pt-8 sm:grid-cols-2">
            <legend className="eyebrow mb-6">Delivery</legend>
            <input
              required
              placeholder="Full name"
              autoComplete="name"
              value={form.name}
              onChange={set("name")}
              className={field}
            />
            <select
              required
              value={form.country}
              onChange={set("country")}
              autoComplete="country-name"
              className={`${field} cursor-pointer`}
              aria-label="Country"
            >
              {countries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              required
              placeholder="Address"
              autoComplete="street-address"
              value={form.address}
              onChange={set("address")}
              className={`${field} sm:col-span-2`}
            />
            <input
              required
              placeholder="City"
              autoComplete="address-level2"
              value={form.city}
              onChange={set("city")}
              className={field}
            />
            <input
              required
              placeholder={form.country === "United States" ? "State" : "State / region"}
              autoComplete="address-level1"
              value={form.state}
              onChange={set("state")}
              className={field}
            />
            <input
              placeholder={form.country === "United States" ? "ZIP code" : "Postcode (optional)"}
              required={form.country === "United States"}
              autoComplete="postal-code"
              value={form.postcode}
              onChange={set("postcode")}
              className={field}
            />
          </fieldset>

          <fieldset data-fade className="border-t pt-8">
            <legend className="eyebrow mb-6">Shipping method</legend>
            {[
              { id: false, label: "Standard · 3–5 business days", price: rates.standard },
              { id: true, label: "Express · 1–2 business days", price: rates.express },
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
                <span className="tabular-nums">
                  {discount?.kind === "free_shipping" ? (
                    <>
                      <s className="mr-2 text-muted-foreground">{money(o.price)}</s>Free
                    </>
                  ) : (
                    money(o.price)
                  )}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset data-fade className="border-t pt-8">
            <legend className="eyebrow mb-4">Payment</legend>
            <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              After you place your order we&apos;ll email a secure payment link: card, bank transfer
              or mobile money.
            </p>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in duration-300"
            >
              {error}
            </p>
          )}
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

            {/* discount code */}
            <div className="mt-2 border-t border-foreground/10 pt-4">
              {discount ? (
                <div className="flex items-center justify-between text-sm animate-in fade-in duration-300">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span className="tracking-[0.12em]">{discount.code}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDiscount(null)}
                    aria-label="Remove code"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void applyCode())}
                    placeholder="Discount code"
                    aria-label="Discount code"
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm uppercase tracking-[0.1em] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="button"
                    onClick={() => void applyCode()}
                    disabled={checking || !code.trim()}
                    className="link-line text-[13px] disabled:opacity-40"
                  >
                    {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
              {codeError && <p className="mt-2 text-xs text-destructive">{codeError}</p>}
            </div>

            <dl className="mt-4 space-y-2 border-t border-foreground/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              {off > 0 && (
                <div className="flex justify-between animate-in fade-in duration-300">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="tabular-nums">−{money(off)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">{shipping ? money(shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between border-t border-foreground/10 pt-3 text-base">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(total)}</dd>
              </div>
            </dl>
            <button
              form="checkout"
              data-magnetic
              disabled={placing}
              className="btn mt-8 w-full disabled:opacity-60"
            >
              {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {placing ? "Placing order…" : `Place order · ${money(total)}`}
            </button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Prices and stock are confirmed when you order
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
