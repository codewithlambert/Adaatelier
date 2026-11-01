// Marks orders paid when Stripe or Bachs confirms the money arrived. This is the only place an
// order becomes paid: the "thank you" page after checkout is never trusted on its own.
//
// Point both dashboards at:  https://<project>.supabase.co/functions/v1/payment-webhook
//   Stripe → Developers → Webhooks → events: checkout.session.completed,
//            checkout.session.async_payment_succeeded
//   Bachs  → Developers → Webhooks → event: collection.succeeded
// Secrets: STRIPE_WEBHOOK_SECRET (whsec_…) and BACHS_WEBHOOK_SECRET (whsec_…).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { emailReady, env, esc, layout, money, paidLabel, sendEmail, trackUrl } from "../_shared/email.ts";

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
    // Bachs has sent the order id as both `metadata` and `meta`
    orderId =
      event.data?.metadata?.order_id ?? event.data?.meta?.order_id ?? event.metadata?.order_id;
    ref = event.data?.checkout_id;
    amount = Number(event.data?.amount);
    currency = String(event.data?.currency).toUpperCase();
  } else {
    return new Response("Unsigned request", { status: 400 });
  }

  // find the order by its id, or by the checkout session we stored when payment started
  const query = db
    .from("orders")
    .select("id, total, paid_at, payment_ref, charge_currency, charge_amount");
  const { data: order } = await (
    orderId ? query.eq("id", orderId) : query.eq("payment_ref", ref ?? "")
  ).maybeSingle();
  if (!order) return new Response("Unknown order", { status: 404 });
  if (order.paid_at) return new Response("already paid"); // retries are normal

  // compare against what the payment page asked for: dollars for Stripe, naira for Bachs
  const expected =
    order.charge_currency && order.charge_amount !== null
      ? { currency: String(order.charge_currency), amount: Number(order.charge_amount) }
      : { currency: "USD", amount: Number(order.total) };
  // paying more is fine (bank-transfer fees are added on top); only a short payment is flagged
  const tolerance = expected.currency === "USD" ? 0.01 : 1;
  if (currency === expected.currency && amount < expected.amount - tolerance) {
    await db.from("notifications").insert({
      kind: "system",
      title: `Payment mismatch on ${order.id}`,
      body: `${provider} reported ${currency} ${amount.toFixed(2)}, expected ${expected.currency} ${expected.amount.toFixed(2)}`,
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
      paid_amount: amount,
    })
    .eq("id", order.id)
    .is("paid_at", null);
  // a 500 makes the provider retry later
  if (error) return new Response("Could not update order", { status: 500 });

  await db.from("notifications").insert({
    kind: "order",
    title: `Order ${order.id} paid`,
    body: `${provider} · ${paidLabel(amount, currency)}`,
    link: "/#/orders",
  });

  // the receipt never blocks the payment: a failed email is logged and flagged in the admin
  try {
    await sendConfirmation(db, order.id);
  } catch (e) {
    console.error("confirmation email", e);
    await db.from("notifications").insert({
      kind: "system",
      title: `Receipt email for ${order.id} didn't send`,
      body: String(e).slice(0, 200),
      link: "/#/orders",
    });
  }
  return new Response("ok");
});

// ---------- receipt email ----------

type Db = ReturnType<typeof createClient>;
type Line = { product_name: string; qty: number; unit_price: number; color: string; monogram: string | null };

async function sendConfirmation(db: Db, id: string) {
  if (!emailReady()) return; // email not set up yet

  const { data: o } = await db
    .from("orders")
    .select(
      "id, subtotal, discount, shipping, total, currency, paid_amount, track_token, confirmation_sent_at, payment_method, customers(name, email), order_items(product_name, qty, unit_price, color, monogram)",
    )
    .eq("id", id)
    .single();
  if (!o || o.confirmation_sent_at) return;
  const customer = o.customers as unknown as { name: string; email: string };
  const lines = o.order_items as unknown as Line[];

  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e7e4df;font-size:14px;color:#151515">
          ${esc(l.product_name)}<br>
          <span style="font-size:12px;color:#8a857d">Qty ${l.qty}${l.monogram ? ` · Monogram ${esc(l.monogram)}` : ""}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e7e4df;font-size:14px;color:#151515;text-align:right">${money(l.unit_price * l.qty)}</td>
      </tr>`,
    )
    .join("");
  const total = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-size:${strong ? 16 : 13}px;color:${strong ? "#151515" : "#8a857d"}">${label}</td>
     <td style="padding:4px 0;font-size:${strong ? 16 : 13}px;color:#151515;text-align:right">${value}</td></tr>`;

  const html = layout({
    heading: `Thank you, ${esc(customer.name.split(" ")[0] || "there")}.`,
    intro: `Your payment for order <strong style="color:#151515">${o.id}</strong> went through. We're preparing your bag in Lagos now and will email you again when it ships.`,
    button: { label: "Track your order", url: trackUrl(o.id, o.track_token) },
    body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
            ${total("Subtotal", money(o.subtotal))}
            ${Number(o.discount) > 0 ? total("Discount", `−${money(o.discount)}`) : ""}
            ${total("Shipping", Number(o.shipping) ? money(o.shipping) : "Free")}
            ${total("Total", money(o.total), o.currency === "USD" || !o.paid_amount)}
            ${o.currency !== "USD" && o.paid_amount ? total("Total paid", paidLabel(Number(o.paid_amount), String(o.currency)), true) : ""}
          </table>`,
    footer: `Paid with ${esc(o.payment_method)}. Free returns within 30 days. Questions? Just reply to this email.`,
  });

  await sendEmail({ to: customer.email, name: customer.name, subject: `Your Ada Atelier order ${o.id} is confirmed`, html });
  await db.from("orders").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", o.id);
}
