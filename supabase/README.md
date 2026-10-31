# Supabase

## Database

Run these in Supabase → SQL Editor → New query, in this order:

1. [`schema.sql`](schema.sql): every table, security rule, checkout function, realtime and storage,
   plus the demo bags and reviews. Safe to re-run: re-run it whenever it changes to pick up new
   tables and bags. Prices you've edited in the admin are kept.
2. [`make-owner.sql`](make-owner.sql): makes your account the store owner (add the user in
   Authentication → Users first).

The same `schema.sql` lives in the admin repo; keep the two copies identical when the schema changes.

## Payments: Stripe and Bachs

Shoppers outside Nigeria pay by card on **Stripe** (USD). Shoppers in Nigeria pay in naira on
**Bachs** (card, transfer, USSD). Until the keys below are set, orders are still saved and the
shopper is told a payment link will follow by email.

Two Edge Functions do the work. Secret keys live only in Supabase, never in the shop:

- [`functions/checkout`](functions/checkout/index.ts) opens the right payment page for an order.
- [`functions/payment-webhook`](functions/payment-webhook/index.ts) marks the order paid when
  Stripe or Bachs confirms it, and notifies the admin.

### 1. Deploy the functions

With the [Supabase CLI](https://supabase.com/docs/guides/cli), from this repo:

```bash
npx supabase login
npx supabase functions deploy checkout --project-ref nnowhldafgkeankpjzfz
npx supabase functions deploy payment-webhook --project-ref nnowhldafgkeankpjzfz
```

(Or in the dashboard: Edge Functions → Deploy a new function → paste each `index.ts`, and turn
off "Verify JWT" for both.)

### 2. Add the secrets

Supabase → Edge Functions → Secrets:

| Name | Value |
| --- | --- |
| `SITE_URL` | the shop's address, e.g. `https://ada-atelier.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key (`sk_test_…` to test) |
| `STRIPE_WEBHOOK_SECRET` | from step 3 (`whsec_…`) |
| `BACHS_SECRET_KEY` | Bachs dashboard → API keys (`sk_sandbox_…` to test) |
| `BACHS_API_URL` | `https://sandbox-api.bachs.io` to test, `https://api.bachs.io` live |
| `BACHS_WEBHOOK_SECRET` | from step 3 (`whsec_…`) |

### 3. Point the webhooks at Supabase

Webhook URL for both: `https://nnowhldafgkeankpjzfz.supabase.co/functions/v1/payment-webhook`

- **Stripe** → Developers → Webhooks → Add endpoint → events `checkout.session.completed` and
  `checkout.session.async_payment_succeeded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
- **Bachs** → Developers → Webhooks → Add endpoint → event `collection.succeeded`. Copy its
  signing secret into `BACHS_WEBHOOK_SECRET`.

### 4. Test

Stripe test card: `4242 4242 4242 4242`, any future date, any CVC. Place an order with a US
address: you should land on Stripe, pay, come back to "Thank you", and the order turns
**Processing** in the admin with a "paid" notification. Repeat with Nigeria for Bachs sandbox.

Going live: swap in the live keys (`sk_live_…`), `BACHS_API_URL=https://api.bachs.io`, and add the
same webhooks in live mode with their own signing secrets.

## After payment: tracking page and receipt email

- **Tracking page.** After paying, shoppers land on `/track/<order>?t=<secret>`: a live timeline (placed →
  paid → being prepared → shipped → delivered) with the courier and tracking number once you add them in the
  admin (Orders → open an order → Delivery). The secret in the link means nobody can look up someone else's
  order by guessing its number. The admin's "Copy customer's tracking link" button gives you the same link to
  send on WhatsApp.
- **Receipt email.** Sent by `payment-webhook` the moment the payment is confirmed, with the order summary and
  the tracking link. Without a domain, use [Brevo](https://www.brevo.com) (free, 300 emails a day):
  1. Sign up, then Senders, Domains & Dedicated IPs → Senders → add and verify your Gmail address.
  2. SMTP & API → API keys → create a key.
  3. Add two Edge Function secrets: `BREVO_API_KEY` (the key) and `EMAIL_FROM`
     (`Ada Atelier <you@gmail.com>`, using the address you verified).

  With your own domain later, [Resend](https://resend.com) works too: set `RESEND_API_KEY` instead of
  `BREVO_API_KEY`. Until either is set, payments still go through and the email is simply skipped.
