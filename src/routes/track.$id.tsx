import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Loader2, Package, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/site/Logo";
import { colorName, findProduct, type ColorId } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatIn } from "@/lib/currency";
import { supabase } from "@/lib/supabase";

// The shopper's own order page: where Stripe and Bachs send them after paying, and the link in
// their confirmation email. The secret `t` in the link is what unlocks it.
type TrackSearch = { t?: string; paid?: boolean };

export const Route = createFileRoute("/track/$id")({
  validateSearch: (s: Record<string, unknown>): TrackSearch => ({
    ...(typeof s["t"] === "string" ? { t: s["t"] } : {}),
    ...(s["paid"] === true || s["paid"] === "1" || s["paid"] === 1 ? { paid: true } : {}),
  }),
  head: ({ params }) => ({
    meta: [{ title: `Order ${params.id} — Ada Atelier` }, { name: "robots", content: "noindex" }],
  }),
  component: TrackPage,
});

type Item = {
  product_id: string | null;
  name: string;
  color: string;
  qty: number;
  unit_price: number;
  monogram: string | null;
};
type Tracked = {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  courier: string | null;
  tracking_ref: string | null;
  payment_method: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  /** what arrived and in which currency (naira for Bachs) */
  currency: string | null;
  paid_amount: number | null;
  city: string | null;
  name: string;
  /** written by the store in the admin */
  status_note: string | null;
  preparing_note: string | null;
  items: Item[];
};

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
const usd = (n: number) => formatIn(Number(n), "USD", 1);

function TrackPage() {
  const { id } = Route.useParams();
  const { t, paid } = Route.useSearch();
  const { clear } = useCart();
  const [order, setOrder] = useState<Tracked | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const polls = useRef(0);

  // back from paying: the bag has been bought
  useEffect(() => {
    if (paid) {
      clear();
      try {
        sessionStorage.removeItem("ada-pending-order");
      } catch {
        // nothing to clear
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  // load, then keep checking: every few seconds while the payment is confirming, then every 30s
  useEffect(() => {
    if (!supabase || !t) {
      setState("missing");
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const { data, error } = await supabase!.rpc("track_order", { p_id: id, p_token: t });
      if (!alive) return;
      if (error || !data) {
        setState("missing");
        return;
      }
      const o = data as Tracked;
      setOrder(o);
      setState("ok");
      polls.current += 1;
      const confirming = !o.paid_at && o.status === "pending" && polls.current < 40;
      if (o.status !== "delivered" && o.status !== "cancelled")
        timer = setTimeout(() => void load(), confirming ? 3000 : 30000);
    };
    void load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, t]);

  if (state === "loading")
    return (
      <div className="grid min-h-[80vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  if (state === "missing" || !order)
    return (
      <div className="mx-auto max-w-md px-5 pb-24 pt-40 text-center">
        <LogoMark className="mx-auto h-10 w-10" />
        <h1 className="headline mt-8 text-5xl">
          Order <em>not found</em>
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          This tracking link isn&apos;t complete. Open the link in your order email, or reply to
          that email and we&apos;ll help.
        </p>
        <Link to="/shop" className="btn mt-10">
          Continue shopping
        </Link>
      </div>
    );

  const confirming = !order.paid_at && order.status === "pending";
  const steps = [
    { label: "Order placed", at: order.created_at, done: true },
    {
      label: "Payment confirmed",
      at: order.paid_at,
      done: !!order.paid_at || order.status !== "pending",
      note: order.paid_at
        ? `${
            order.paid_amount !== null && order.currency
              ? formatIn(Number(order.paid_amount), order.currency, 1)
              : usd(order.total)
          } paid with ${order.payment_method}`
        : undefined,
    },
    {
      label: "Being prepared",
      at: null,
      done: ["processing", "shipped", "delivered"].includes(order.status),
      note: order.preparing_note ?? undefined,
    },
    {
      label: "Shipped",
      at: order.shipped_at,
      done: ["shipped", "delivered"].includes(order.status),
      note: order.tracking_ref
        ? `${order.courier ?? "Courier"} · ${order.tracking_ref}`
        : (order.courier ?? undefined),
    },
    { label: "Delivered", at: order.delivered_at, done: order.status === "delivered" },
  ];
  const current = steps.findIndex((s) => !s.done);
  // the store's message sits under the step the order has most recently reached
  const latest = current === -1 ? steps.length - 1 : current - 1;

  const headline =
    order.status === "cancelled"
      ? ["Order", "cancelled"]
      : order.status === "delivered"
        ? ["It's", "arrived"]
        : order.status === "shipped"
          ? ["On its", "way"]
          : confirming
            ? ["Confirming", "payment"]
            : ["Thank", "you"];

  return (
    <div className="pb-24 pt-32 md:pb-36 md:pt-40">
      <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-8">
        <p className="eyebrow">Order {order.id}</p>
        <h1 className="headline mt-4 text-5xl md:text-7xl animate-in fade-in slide-in-from-bottom-3 duration-700">
          {headline[0]} <em>{headline[1]}</em>
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {order.status === "cancelled"
            ? "This order was cancelled. If you were charged, the refund is on its way to you."
            : confirming
              ? "We're waiting for the payment to come through. This usually takes a few seconds; this page updates on its own."
              : `${order.name.split(" ")[0]}, your order is confirmed. We've emailed your receipt, and this page updates as your bag moves. Bookmark it to check back.`}
        </p>

        <div className="mt-14 grid gap-14 md:grid-cols-[1.2fr_1fr] md:gap-20">
          {/* timeline */}
          <ol className="relative">
            {steps.map((s, i) => {
              const active = i === current && order.status !== "cancelled";
              return (
                <li key={s.label} className="relative flex gap-5 pb-10 last:pb-0">
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden
                      className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px ${
                        steps[i + 1]!.done ? "bg-foreground" : "bg-foreground/15"
                      }`}
                    />
                  )}
                  <span
                    className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${
                      s.done
                        ? "border-foreground bg-foreground text-background"
                        : active
                          ? "border-foreground"
                          : "border-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {s.done ? (
                      <Check className="h-4 w-4" strokeWidth={2.2} />
                    ) : active ? (
                      <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
                    ) : i === 3 ? (
                      <Truck className="h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Package className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </span>
                  <div className="pt-1">
                    <p className={`text-sm ${s.done || active ? "" : "text-muted-foreground"}`}>
                      {s.label}
                      {active && confirming && i === 1 && (
                        <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" />
                      )}
                    </p>
                    {(s.at || s.note) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[when(s.at), s.note].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {i === 3 && order.tracking_ref && s.done && (
                      <CopyRef value={order.tracking_ref} />
                    )}
                    {i === latest && order.status_note && (
                      <p className="mt-3 max-w-sm border-l-2 border-foreground bg-surface px-3 py-2 text-xs leading-relaxed animate-in fade-in duration-500">
                        {order.status_note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* what's in it */}
          <aside className="bg-surface p-6 md:p-8">
            <p className="eyebrow">Your order</p>
            <ul className="mt-4 divide-y divide-foreground/10">
              {order.items.map((it, i) => {
                const p = it.product_id ? findProduct(it.product_id) : undefined;
                return (
                  <li key={i} className="flex items-center gap-4 py-4">
                    <span className="block h-20 w-16 shrink-0 overflow-hidden bg-card">
                      {p && <img src={p.img} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <div className="flex min-w-0 flex-1 justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate">{it.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p?.mask ? `${colorName(it.color as ColorId)} · ` : ""}Qty {it.qty}
                          {it.monogram ? ` · Monogram ${it.monogram}` : ""}
                        </p>
                      </div>
                      <span className="tabular-nums">{usd(it.unit_price * it.qty)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-foreground/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{usd(order.subtotal)}</dd>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="tabular-nums">−{usd(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {Number(order.shipping) ? usd(order.shipping) : "Free"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-foreground/10 pt-3 text-base">
                <dt>Total</dt>
                <dd className="tabular-nums">{usd(order.total)}</dd>
              </div>
              {order.paid_amount !== null && order.currency && order.currency !== "USD" && (
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Paid</dt>
                  <dd className="tabular-nums">
                    {formatIn(Number(order.paid_amount), order.currency, 1)}
                  </dd>
                </div>
              )}
            </dl>
            {order.city && (
              <p className="mt-6 text-xs text-muted-foreground">Delivering to {order.city}</p>
            )}
          </aside>
        </div>

        <div className="mt-16 flex flex-wrap gap-3">
          <Link to="/shop" className="btn">
            Continue shopping
          </Link>
          <Link to="/contact" className="btn border-foreground bg-transparent text-foreground">
            Questions? Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}

function CopyRef({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-2 inline-flex items-center gap-1.5 border border-foreground/15 px-2.5 py-1 text-[11px] tracking-[0.06em]"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy tracking number"}
    </button>
  );
}
