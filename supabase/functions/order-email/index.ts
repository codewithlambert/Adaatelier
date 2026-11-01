// Order emails after checkout:
//   { kind: "shipped", order_id }  sent by the admin when an order is marked shipped. Needs a
//                                   signed-in staff member who can edit (not a demo account).
//   { kind: "reminders" }           run hourly by pg_cron with the CRON_SECRET header: one gentle
//                                   reminder for online orders left unpaid for 3 to 48 hours.
// Quietly does nothing until email is set up (see ../_shared/email.ts).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { emailReady, env, esc, layout, money, sendEmail, site, trackUrl } from "../_shared/email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Db = ReturnType<typeof createClient>;
type OrderRow = {
  id: string;
  total: number;
  status: string;
  courier: string | null;
  tracking_ref: string | null;
  track_token: string;
  shipped_email_at: string | null;
  customers: { name: string; email: string } | null;
  order_items: { product_name: string; qty: number }[];
};

const firstName = (name: string) => esc(name.split(" ")[0] || "there");
const itemsLine = (o: OrderRow) => esc(o.order_items.map((i) => (i.qty > 1 ? `${i.qty} × ${i.product_name}` : i.product_name)).join(", "));

async function sendShipped(db: Db, id: string) {
  const { data: o } = await db
    .from("orders")
    .select("id, total, status, courier, tracking_ref, track_token, shipped_email_at, customers(name, email), order_items(product_name, qty)")
    .eq("id", id)
    .maybeSingle<OrderRow>();
  if (!o || !o.customers) return { sent: false, reason: "Order not found" };
  if (o.status !== "shipped") return { sent: false, reason: "Mark the order shipped first" };
  if (o.shipped_email_at) return { sent: false, reason: "Already sent" };

  const tracking = o.tracking_ref
    ? `${esc(o.courier ?? "Courier")} tracking number: <strong style="color:#151515">${esc(o.tracking_ref)}</strong>`
    : "We'll add the courier's tracking number to your tracking page as soon as we have it.";
  const html = layout({
    heading: `It's on its way, ${firstName(o.customers.name)}.`,
    intro: `Order <strong style="color:#151515">${o.id}</strong> (${itemsLine(o)}) has left our Lagos workshop.<br><br>${tracking}`,
    button: { label: "Track your order", url: trackUrl(o.id, o.track_token) },
    footer: "Import duties, if your country charges them, are paid to the courier on delivery. Questions? Just reply to this email.",
  });
  await sendEmail({ to: o.customers.email, name: o.customers.name, subject: `Your Ada Atelier order ${o.id} has shipped`, html });
  await db.from("orders").update({ shipped_email_at: new Date().toISOString() }).eq("id", o.id);
  return { sent: true };
}

async function sendReminders(db: Db) {
  const now = Date.now();
  const { data } = await db
    .from("orders")
    .select("id, total, track_token, customers(name, email), order_items(product_name, qty)")
    .eq("channel", "Online store")
    .eq("status", "pending")
    .is("paid_at", null)
    .is("reminder_sent_at", null)
    .not("payment_ref", "is", null) // they reached the payment page
    .lt("created_at", new Date(now - 3 * 3600e3).toISOString())
    .gt("created_at", new Date(now - 48 * 3600e3).toISOString())
    .limit(50);
  let sent = 0;
  for (const o of (data ?? []) as unknown as OrderRow[]) {
    if (!o.customers) continue;
    const html = layout({
      heading: `Still thinking it over, ${firstName(o.customers.name)}?`,
      intro: `Your order <strong style="color:#151515">${o.id}</strong> (${itemsLine(o)}, ${money(o.total)}) is saved, but the payment wasn't finished. Handmade pieces sell out, so we're holding it for you for a little longer.`,
      button: { label: "Complete your order", url: `${site()}/checkout?unpaid=${o.id}` },
      footer: "Changed your mind? No problem, just ignore this email and the order will lapse. Questions? Reply and we'll help.",
    });
    try {
      await sendEmail({ to: o.customers.email, name: o.customers.name, subject: `Your Ada Atelier order ${o.id} is waiting`, html });
      await db.from("orders").update({ reminder_sent_at: new Date().toISOString() }).eq("id", o.id);
      sent++;
    } catch (e) {
      console.error("reminder", o.id, e);
    }
  }
  return { sent };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  if (body.kind === "reminders") {
    if (!env("CRON_SECRET") || req.headers.get("x-cron-secret") !== env("CRON_SECRET"))
      return reply({ error: "Not allowed" }, 401);
    if (!emailReady()) return reply({ sent: 0, reason: "Email isn't set up" });
    return reply(await sendReminders(db));
  }

  if (body.kind === "shipped" && typeof body.order_id === "string") {
    // only staff who can edit (owner, manager, staff) may send customer emails
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: user } = await db.auth.getUser(token);
    if (!user?.user) return reply({ error: "Sign in again" }, 401);
    const { data: staff } = await db.from("staff").select("role").eq("id", user.user.id).maybeSingle();
    if (!staff || staff.role === "demo") return reply({ error: "Not allowed" }, 403);
    if (!emailReady()) return reply({ sent: false, reason: "Email isn't set up" });
    try {
      return reply(await sendShipped(db, body.order_id));
    } catch (e) {
      console.error("shipped", e);
      return reply({ sent: false, reason: "The email didn't send" }, 502);
    }
  }

  return reply({ error: "Unknown request" }, 400);
});
