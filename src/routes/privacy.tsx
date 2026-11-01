import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Ada Atelier" },
      {
        name: "description",
        content: "What Ada Atelier collects when you shop, why, who handles it, and your rights.",
      },
    ],
  }),
  component: () => (
    <InfoPage
      eyebrow="Help"
      lines={["_Privacy"]}
      intro="We collect only what we need to get your bag to you, and we never sell it. Last updated 1 November 2026."
      sections={[
        {
          title: "What we collect",
          body: [
            "When you order: your name, email, phone number and delivery address, and what you bought. We use them to deliver your order, send your receipt and tracking updates, and help if something goes wrong.",
            "If you join the newsletter: your email address, to send new drops and stories about once a month.",
            "If you write a review: the name you give and your review, which we show on the product page once we've checked it.",
          ],
        },
        {
          title: "Payments",
          body: [
            "Card, Apple Pay, Google Pay, Klarna and Afterpay payments are handled by Stripe, and naira payments by Bachs, on their own secure pages. We never see or store your card details. We keep only a reference to the payment and the amount paid.",
          ],
        },
        {
          title: "Cookies and storage",
          body: [
            "We don't use advertising or tracking cookies. Your browser keeps your bag, your chosen country and currency, and recently viewed bags, so they're still there next time.",
            "When the site loads, our host adds a small cookie with your country (from your connection, not your location) so prices open in your currency. It expires after a day.",
            "We count visits with Vercel Analytics, which uses no cookies and doesn't identify you.",
          ],
        },
        {
          title: "Who handles your data",
          body: [
            "Supabase stores orders and accounts, Vercel hosts the site, and Stripe or Bachs take payment. Each only uses your data to provide that service to us. Couriers receive your name, phone number and address to deliver your order.",
          ],
        },
        {
          title: "How long we keep it",
          body: [
            "Order records are kept for six years, because tax law requires it. Newsletter addresses are kept until you unsubscribe. Everything else is deleted when it's no longer needed.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "You can ask to see the data we hold about you, correct it, or have it deleted (except order records we must keep by law). Use the contact page and we'll reply within 30 days. You can unsubscribe from the newsletter at any time from any email we send.",
          ],
        },
      ]}
    />
  ),
});
