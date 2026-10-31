import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { LogoMark } from "@/components/site/Logo";
import { TintedImage } from "@/components/site/Tint";
import { PageHeader, Words } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { money } from "@/lib/catalog";
import { useCart, type CartLine } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — Ada Atelier" }, { name: "robots", content: "noindex" }],
  }),
  // ?paid / ?unpaid: where Stripe and Bachs send shoppers back after their payment page
  validateSearch: (s: Record<string, unknown>): { paid?: string; unpaid?: string } => ({
    ...(typeof s["paid"] === "string" ? { paid: s["paid"] } : {}),
    ...(typeof s["unpaid"] === "string" ? { unpaid: s["unpaid"] } : {}),
  }),
  component: Checkout,
});

const field =
  "w-full border-b border-foreground/25 bg-transparent py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground";
const countries = ["United States", "Nigeria", "United Kingdom", "Canada", "Ghana", "Other"];
// used until store settings load (and when Supabase isn't configured)
const DEFAULT_SHIPPING = { standard: 6, express: 15 };

type Discount = { code: string; kind: "percent" | "fixed" | "free_shipping"; amount: number };
type Placed = { id: string | null; lines: CartLine[]; total: number; email: string };

// the order waiting on its payment page, so a shopper who backs out can pay without re-entering it
const PENDING_KEY = "ada-pending-order";
type Pending = { id: string; email: string };
function readPending(): Pending | null {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null") as Pending | null;
  } catch {
    return null;
  }
}
function writePending(p: Pending | null) {
  try {
    if (p) sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // private mode: the shopper can still pay from the emailed link
  }
}

/**
 * Opens Stripe (or Bachs for Nigeria) for a saved order. Returns false when online payment
 * isn't set up yet, so the order stays as "we'll email you a payment link".
 */
async function startPayment(order: Pending): Promise<"redirected" | "paid" | "offline"> {
  if (!supabase) return "offline";
  const { data, error } = await supabase.functions.invoke<{
    url?: string;
    paid?: boolean;
    configured?: boolean;
  }>("checkout", { body: { order_id: order.id, email: order.email } });
  if (data?.paid) return "paid";
  if (error || !data?.url) {
    // 502: Stripe or Bachs refused. Anything else (function not deployed, no keys) means
    // online payment isn't set up yet, and the order waits for an emailed link instead.
    const status = (error as { context?: Response } | null)?.context?.status;
    if (status === 502) throw new Error("payment");
    return "offline";
  }
  writePending(order);
  window.location.assign(data.url);
  return "redirected";
}

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
  const { paid, unpaid } = Route.useSearch();
  if (paid) return <PaymentReturn id={paid} paid />;
  if (unpaid) return <PaymentReturn id={unpaid} paid={false} />;
  return <CheckoutForm />;
}

/** Back from Stripe or Bachs: either paid, or closed the page before paying. */
function PaymentReturn({ id, paid }: { id: string; paid: boolean }) {
  const { clear } = useCart();
  const pending = typeof window === "undefined" ? null : readPending();
  const [email, setEmail] = useState(pending?.id === id ? pending.email : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (paid) {
      writePending(null);
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  const retry = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await startPayment({ id, email: email.trim() });
      if (r === "paid") window.location.replace(`/checkout?paid=${id}`);
      if (r === "offline") setError("Online payment is paused. We'll email you a payment link.");
    } catch {
      setError("We couldn't open the payment page. Check your email address and try again.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-36 text-center md:pt-48">
      <LogoMark className="mx-auto h-12 w-12 animate-in zoom-in-50 duration-700" />
      <h1 className="headline mt-8 text-6xl md:text-7xl">
        {paid ? (
          <>
            Thank <em>you</em>
          </>
        ) : (
          <>
            Not <em>yet</em>
          </>
        )}
      </h1>
      <p className="mt-6 inline-block border px-4 py-2 text-sm tracking-[0.18em]">ORDER {id}</p>
      {paid ? (
        <>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Your payment went through. We&apos;re preparing your bag now and will email tracking as
            soon as it ships.
          </p>
          <Link to="/shop" className="btn mt-10">
            Continue shopping
          </Link>
        </>
      ) : (
        <form onSubmit={retry} className="mx-auto mt-6 max-w-sm space-y-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your order is saved, but the payment wasn&apos;t finished. Nothing has been charged.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email used for the order"
            className={`${field} text-center`}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn w-full justify-center">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Pay now
          </button>
        </form>
      )}
    </div>
  );
}

function CheckoutForm() {
  const { lines, subtotal, clear } = useCart();
  const [form, setForm] = useState({
    email: "",
    phone: "",
    name: "",
    country: "United States",
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
    if (err) {
      setPlacing(false);
      setError(friendly(err.message));
      return;
    }
    const order = { id: data as string, email: form.email.trim() };
    try {
      if ((await startPayment(order)) === "redirected") {
        clear();
        return; // leaving for the payment page
      }
    } catch {
      // the order is saved either way; the shopper can pay from the emailed link
    }
    setPlacing(false);
    setPlaced({ id: order.id, ...snapshot });
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

  const nigeria = form.country === "Nigeria";
  const items = lines.reduce((n, l) => n + l.qty, 0);

  const summary = (
    <>
      <ul className="divide-y divide-foreground/10">
        {lines.map((l) => (
          <li key={l.id} className="flex items-center gap-4 py-4">
            <div className="relative shrink-0">
              <span className="relative block h-24 w-20 overflow-hidden bg-card">
                <TintedImage
                  src={l.img}
                  mask={l.mask}
                  color={l.color}
                  alt=""
                  className="block h-full w-full object-cover"
                />
              </span>
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] tabular-nums text-background ring-2 ring-surface">
                {l.qty}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate">{l.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{l.note}</p>
                {l.monogram && (
                  <p className="mt-1 text-xs text-muted-foreground">Monogram · {l.monogram}</p>
                )}
              </div>
              <span className="tabular-nums">{money(l.price * l.qty)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* discount code */}
      <div className="border-t border-foreground/10 pt-4">
        {discount ? (
          <div className="flex items-center justify-between text-sm animate-in fade-in duration-300">
            <span className="flex items-center gap-2 rounded-full bg-foreground px-3 py-1 text-[11px] tracking-[0.14em] text-background">
              <Tag className="h-3 w-3" />
              {discount.code}
            </span>
            <button
              type="button"
              onClick={() => setDiscount(null)}
              aria-label="Remove code"
              className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border border-foreground/15 bg-background/60 pl-3 transition-colors focus-within:border-foreground">
            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void applyCode())}
              placeholder="Gift or discount code"
              aria-label="Discount code"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm uppercase tracking-[0.1em] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/70"
            />
            <button
              type="button"
              onClick={() => void applyCode()}
              disabled={checking || !code.trim()}
              className="h-11 px-4 text-[12px] font-medium uppercase tracking-[0.14em] transition-opacity disabled:opacity-30"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </button>
          </div>
        )}
        {codeError && <p className="mt-2 text-xs text-destructive">{codeError}</p>}
      </div>

      <dl className="mt-5 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Subtotal · {items} {items === 1 ? "item" : "items"}
          </dt>
          <dd className="tabular-nums">{money(subtotal)}</dd>
        </div>
        {off > 0 && (
          <div className="flex justify-between animate-in fade-in duration-300">
            <dt className="text-muted-foreground">Discount</dt>
            <dd className="tabular-nums">−{money(off)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{express ? "Express" : "Standard"} shipping</dt>
          <dd className="tabular-nums">{shipping ? money(shipping) : "Free"}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-foreground/10 pt-4">
          <dt>Total</dt>
          <dd className="headline text-3xl tabular-nums">
            <span className="mr-1.5 font-sans text-[11px] tracking-[0.14em] text-muted-foreground">
              USD
            </span>
            {money(total)}
          </dd>
        </div>
      </dl>
    </>
  );

  const payButton = (className = "") => (
    <button
      form="checkout"
      data-magnetic
      disabled={placing}
      className={`btn w-full disabled:opacity-60 ${className}`}
    >
      {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
      {placing ? "Opening secure payment…" : `Continue to payment · ${money(total)}`}
    </button>
  );

  const assurances = (
    <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] leading-snug text-muted-foreground">
      <li className="flex flex-col items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-foreground" strokeWidth={1.5} />
        Secure, encrypted payment
      </li>
      <li className="flex flex-col items-center gap-1.5">
        <RotateCcw className="h-4 w-4 text-foreground" strokeWidth={1.5} />
        Free 30-day returns
      </li>
      <li className="flex flex-col items-center gap-1.5">
        <Package className="h-4 w-4 text-foreground" strokeWidth={1.5} />
        Tracked, gift-ready box
      </li>
    </ul>
  );

  return (
    <div ref={root} className="pb-24 pt-32 md:pb-36 md:pt-40">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p data-fade className="eyebrow">
              Secure checkout
            </p>
            <h1 data-reveal className="headline mt-4 text-5xl md:text-7xl">
              <Words lines={["Almost _yours"]} />
            </h1>
          </div>
          <Steps />
        </div>

        {/* phones: the summary folds away above the form */}
        <details data-fade className="group mt-10 border-y border-foreground/10 md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm">
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              <span className="group-open:hidden">Show order summary</span>
              <span className="hidden group-open:inline">Hide order summary</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" />
            </span>
            <span className="tabular-nums">{money(total)}</span>
          </summary>
          <div className="pb-6">{summary}</div>
        </details>

        <div className="mt-10 grid gap-14 md:mt-16 md:grid-cols-[1.25fr_1fr] md:gap-16 lg:gap-24">
          <form id="checkout" onSubmit={placeOrder} className="space-y-12">
            <Section n="01" title="Contact" note="We'll send your receipt and tracking here.">
              <Field
                label="Email"
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
              />
              <Field
                label="Phone, for the courier"
                required
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={set("phone")}
              />
            </Section>

            <Section n="02" title="Delivery">
              <Field
                label="Full name"
                required
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
              />
              <label className="relative block">
                <span className="pointer-events-none absolute left-0 top-0 text-[11px] text-muted-foreground">
                  Country
                </span>
                <select
                  required
                  value={form.country}
                  onChange={set("country")}
                  autoComplete="country-name"
                  className={`${field} cursor-pointer appearance-none pb-2 pt-5`}
                >
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute bottom-3 right-0 h-4 w-4 text-muted-foreground" />
              </label>
              <Field
                label="Street address"
                required
                autoComplete="street-address"
                value={form.address}
                onChange={set("address")}
                className="sm:col-span-2"
              />
              <Field
                label="City"
                required
                autoComplete="address-level2"
                value={form.city}
                onChange={set("city")}
              />
              <Field
                label={form.country === "United States" ? "State" : "State / region"}
                required
                autoComplete="address-level1"
                value={form.state}
                onChange={set("state")}
              />
              <Field
                label={form.country === "United States" ? "ZIP code" : "Postcode (optional)"}
                required={form.country === "United States"}
                autoComplete="postal-code"
                value={form.postcode}
                onChange={set("postcode")}
              />
            </Section>

            <Section n="03" title="Shipping" grid={false}>
              <div
                role="radiogroup"
                aria-label="Shipping speed"
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  {
                    id: false,
                    Icon: Truck,
                    label: "Standard",
                    days: [3, 5],
                    price: rates.standard,
                  },
                  { id: true, Icon: Zap, label: "Express", days: [1, 2], price: rates.express },
                ].map(({ id, Icon, label, days, price }) => {
                  const on = express === id;
                  return (
                    <label
                      key={label}
                      className={`relative flex cursor-pointer flex-col gap-3 border p-5 transition-[border-color,background-color] duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground ${
                        on
                          ? "border-foreground bg-surface"
                          : "border-foreground/15 hover:border-foreground/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ship"
                        checked={on}
                        onChange={() => setExpress(id)}
                        className="sr-only"
                      />
                      <span className="flex items-center justify-between">
                        <Icon className="h-5 w-5" strokeWidth={1.4} />
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full border transition-colors ${
                            on
                              ? "border-foreground bg-foreground text-background"
                              : "border-foreground/30"
                          }`}
                        >
                          {on && <Check className="h-3 w-3" strokeWidth={2.5} />}
                        </span>
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{label}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Arrives {arrival(days[0]!, days[1]!)}
                        </span>
                      </span>
                      <span className="text-sm tabular-nums">
                        {discount?.kind === "free_shipping" ? (
                          <>
                            <s className="mr-2 text-muted-foreground">{money(price)}</s>Free
                          </>
                        ) : (
                          money(price)
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Section>

            <Section n="04" title="Payment" grid={false}>
              <div
                key={nigeria ? "bachs" : "stripe"}
                className="border border-foreground/15 p-5 animate-in fade-in duration-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {nigeria ? (
                        <Landmark className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                      )}
                      {nigeria ? "Pay in naira" : "Card, Apple Pay or Google Pay"}
                    </p>
                    <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                      {nigeria
                        ? "You'll finish on Bachs' secure page and pay in naira at today's rate."
                        : "You'll finish on Stripe's secure page. You're charged in US dollars."}
                    </p>
                  </div>
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(nigeria
                    ? ["Card", "Bank transfer", "USSD"]
                    : ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"]
                  ).map((m) => (
                    <span
                      key={m}
                      className="border border-foreground/15 bg-background px-2 py-1 text-[10px] font-medium tracking-[0.06em]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Secured by {nigeria ? "Bachs" : "Stripe"}. We never see or store your card.
                </p>
              </div>
            </Section>

            {error && (
              <p
                role="alert"
                className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in duration-300"
              >
                {error}
              </p>
            )}

            {/* phones: the pay button follows the form */}
            <div className="md:hidden">
              {payButton()}
              {assurances}
            </div>
          </form>

          <aside className="hidden md:sticky md:top-28 md:block md:self-start">
            <div data-fade className="bg-surface p-8">
              <p className="eyebrow">Order summary</p>
              <div className="mt-2">{summary}</div>
              {payButton("mt-8")}
              {assurances}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Bag → Details → Payment, with the bag already done. */
function Steps() {
  const steps = ["Bag", "Details", "Payment"];
  return (
    <ol data-fade className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] ${
              i === 0
                ? "border-foreground bg-foreground text-background"
                : i === 1
                  ? "border-foreground"
                  : "border-foreground/25 text-muted-foreground"
            }`}
          >
            {i === 0 ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
          </span>
          <span className={i === 2 ? "text-muted-foreground" : ""}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-foreground/25 sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}

function Section({
  n,
  title,
  note,
  grid = true,
  children,
}: {
  n: string;
  title: string;
  note?: string;
  grid?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset data-fade className="border-t pt-8">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6 flex items-baseline gap-4">
        <span className="text-[11px] tabular-nums text-muted-foreground">{n}</span>
        <h2 className="headline text-3xl">{title}</h2>
        {note && <p className="ml-auto hidden text-xs text-muted-foreground sm:block">{note}</p>}
      </div>
      {grid ? <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{children}</div> : children}
    </fieldset>
  );
}

/** Underlined input whose label floats up once you focus it or type. */
function Field({
  label,
  className = "",
  ...input
}: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder">) {
  return (
    <label className={`relative block ${className}`}>
      <input {...input} placeholder=" " className={`peer ${field} pb-2 pt-5`} />
      <span className="pointer-events-none absolute left-0 top-[1.15rem] text-sm text-muted-foreground transition-all duration-300 peer-focus:top-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[11px]">
        {label}
      </span>
    </label>
  );
}

/** "Tue, Nov 4 – Thu, Nov 6": today plus a range of business days. */
function arrival(from: number, to: number) {
  const add = (n: number) => {
    const d = new Date();
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) n--;
    }
    return d;
  };
  const day = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${day(add(from))} – ${day(add(to))}`;
}
