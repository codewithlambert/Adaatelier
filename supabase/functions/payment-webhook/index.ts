// Marks orders paid when Stripe or Bachs confirms the money arrived. This is the only place an
// order becomes paid: the "thank you" page after checkout is never trusted on its own.
//
// Point both dashboards at:  https://<project>.supabase.co/functions/v1/payment-webhook
//   Stripe → Developers → Webhooks → events: checkout.session.completed,
//            checkout.session.async_payment_succeeded
//   Bachs  → Developers → Webhooks → event: collection.succeeded
// Secrets: STRIPE_WEBHOOK_SECRET (whsec_…) and BACHS_WEBHOOK_SECRET (whsec_…).

import { createClient } from "jsr:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const TOLERANCE_S = 300;

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Stripe and Bachs both sign "t={timestamp},v1={hex}" over "{timestamp}.{raw body}". */
async function verify(header: string | null, raw: string, secret: string) {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.split("=", 2) as [string, string]);
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  if (!t || Math.abs(Date.now() / 1000 - t) > TOLERANCE_S) return false;
  const expected = await hmacHex(secret, `${t}.${raw}`);
  return parts.some(([k, v]) => k === "v1" && safeEqual(expected, v ?? ""));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  let provider: "Stripe" | "Bachs";
  let orderId: string | undefined;
  let ref: string | undefined;
  let amount: number; // in dollars
  let currency: string;

  if (req.headers.has("stripe-signature")) {
    if (!(await verify(req.headers.get("stripe-signature"), raw, env("STRIPE_WEBHOOK_SECRET"))))
      return new Response("Invalid signature", { status: 400 });
    const event = JSON.parse(raw);
    const paidEvent =
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded";
    const session = event.data?.object;
    // card payments arrive "paid"; bank debits arrive later as async_payment_succeeded
    if (!paidEvent || session?.payment_status !== "paid") return new Response("ignored");
    provider = "Stripe";
    orderId = session.metadata?.order_id ?? session.client_reference_id;
    ref = session.id;
    amount = session.amount_total / 100;
    currency = String(session.currency).toUpperCase();
  } else if (req.headers.has("x-bachs-signature-v2")) {
    if (!(await verify(req.headers.get("x-bachs-signature-v2"), raw, env("BACHS_WEBHOOK_SECRET"))))
      return new Response("Invalid signature", { status: 400 });
    const event = JSON.parse(raw);
    if (event.type !== "collection.succeeded" || event.data?.status !== "SUCCEEDED")
      return new Response("ignored");
    provider = "Bachs";
    orderId = event.data?.metadata?.order_id ?? event.metadata?.order_id;
    ref = event.data?.checkout_id;
    amount = Number(event.data?.amount);
    currency = String(event.data?.currency).toUpperCase();
  } else {
    return new Response("Unsigned request", { status: 400 });
  }

  // find the order by its id, or by the checkout session we stored when payment started
  const query = db.from("orders").select("id, total, paid_at, payment_ref");
  const { data: order } = await (
    orderId ? query.eq("id", orderId) : query.eq("payment_ref", ref ?? "")
  ).maybeSingle();
  if (!order) return new Response("Unknown order", { status: 404 });
  if (order.paid_at) return new Response("already paid"); // retries are normal

  // Stripe charges exactly the order total in USD. Bachs may settle in naira at the live rate,
  // so its amount is only compared when it reports dollars.
  if (currency === "USD" && Math.abs(amount - Number(order.total)) > 0.01) {
    await db.from("notifications").insert({
      kind: "system",
      title: `Payment mismatch on ${order.id}`,
      body: `${provider} reported $${amount.toFixed(2)}, order total is $${Number(order.total).toFixed(2)}`,
      link: "/#/orders",
    });
    return new Response("amount mismatch", { status: 200 });
  }

  const { error } = await db
    .from("orders")
    .update({
      paid_at: new Date().toISOString(),
      status: "processing",
      payment_method: provider,
      payment_ref: ref ?? order.payment_ref,
      currency,
    })
    .eq("id", order.id)
    .is("paid_at", null);
  // a 500 makes the provider retry later
  if (error) return new Response("Could not update order", { status: 500 });

  await db.from("notifications").insert({
    kind: "order",
    title: `Order ${order.id} paid`,
    body: `${provider} · ${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    link: "/#/orders",
  });
  return new Response("ok");
});
