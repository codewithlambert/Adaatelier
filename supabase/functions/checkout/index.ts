// Starts payment for an order the shop just placed and returns the hosted payment page.
//   Nigeria → Bachs (naira: card, transfer, USSD). Everywhere else → Stripe (cards, Apple Pay).
// The amount always comes from the order in the database, never from the browser.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY   sk_test_… while testing, sk_live_… when you go live
//   BACHS_SECRET_KEY    sk_sandbox_… while testing, sk_live_… when you go live
//   BACHS_API_URL       https://sandbox-api.bachs.io (testing) or https://api.bachs.io (live)
//   SITE_URL            the shop's address, e.g. https://ada-atelier.vercel.app
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const env = (k: string) => Deno.env.get(k) ?? "";

type Order = {
  id: string;
  total: number;
  status: string;
  paid_at: string | null;
  track_token: string;
  address: { country?: string } | null;
  customers: { email: string; name: string } | null;
};

/** After paying, shoppers land on their own tracking page (the secret token unlocks it). */
const trackUrl = (site: string, order: Order) =>
  `${site}/track/${order.id}?t=${order.track_token}&paid=1`;

async function stripeSession(order: Order, site: string) {
  const form = new URLSearchParams({
    mode: "payment",
    customer_email: order.customers?.email ?? "",
    client_reference_id: order.id,
    "metadata[order_id]": order.id,
    "payment_intent_data[metadata][order_id]": order.id,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(Math.round(Number(order.total) * 100)),
    "line_items[0][price_data][product_data][name]": `Ada Atelier order ${order.id}`,
    success_url: trackUrl(site, order),
    cancel_url: `${site}/checkout?unpaid=${order.id}`,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `checkout-${order.id}-${Math.floor(Date.now() / 60000)}`,
    },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Stripe error");
  return { url: json.url as string, ref: json.id as string };
}

async function bachsSession(order: Order, site: string) {
  const res = await fetch(
    `${env("BACHS_API_URL") || "https://sandbox-api.bachs.io"}/v1/checkout-sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("BACHS_SECRET_KEY")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `checkout-${order.id}-${Math.floor(Date.now() / 60000)}`,
      },
      body: JSON.stringify({
        // priced in dollars; Bachs shows the shopper the naira amount at the live rate
        pricing: { currency: "USD", amount: Number(order.total).toFixed(2) },
        customer: { email: order.customers?.email, name: order.customers?.name },
        metadata: { order_id: order.id },
        success_url: trackUrl(site, order),
        cancel_url: `${site}/checkout?unpaid=${order.id}`,
      }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? json?.message ?? "Bachs error");
  return { url: json.checkout_url as string, ref: json.checkout_id as string };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const { order_id, email } = await req.json().catch(() => ({}));
  if (typeof order_id !== "string" || typeof email !== "string")
    return reply({ error: "order_id and email are required" }, 400);

  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: order } = await db
    .from("orders")
    .select("id, total, status, paid_at, track_token, address, customers(email, name)")
    .eq("id", order_id)
    .maybeSingle<Order>();

  // the email must match, so nobody can open a payment page for someone else's order
  if (!order || order.customers?.email.toLowerCase() !== email.trim().toLowerCase())
    return reply({ error: "Order not found" }, 404);
  if (order.paid_at) return reply({ paid: true });
  if (order.status === "cancelled") return reply({ error: "This order was cancelled" }, 409);

  const hasStripe = !!env("STRIPE_SECRET_KEY");
  const hasBachs = !!env("BACHS_SECRET_KEY");
  if (!hasStripe && !hasBachs) return reply({ configured: false });

  const nigeria = order.address?.country === "Nigeria";
  const provider = (nigeria && hasBachs) || !hasStripe ? "Bachs" : "Stripe";
  const site = (env("SITE_URL") || req.headers.get("origin") || "").replace(/\/$/, "");

  try {
    const session =
      provider === "Bachs" ? await bachsSession(order, site) : await stripeSession(order, site);
    await db
      .from("orders")
      .update({ payment_method: provider, payment_ref: session.ref })
      .eq("id", order.id);
    return reply({ url: session.url, provider });
  } catch (e) {
    console.error(provider, e);
    return reply({ error: "We couldn't open the payment page. Please try again." }, 502);
  }
});
