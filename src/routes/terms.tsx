import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Ada Atelier" },
      { name: "description", content: "The terms that apply when you buy from Ada Atelier." },
    ],
  }),
  component: () => (
    <InfoPage
      eyebrow="Help"
      lines={["_Terms"]}
      intro="The short version: we make good bags, describe them honestly, and put things right if they're not. Last updated 1 November 2026."
      sections={[
        {
          title: "Orders",
          body: [
            "Your order is confirmed once payment is received and you've had your receipt. If a piece turns out to be unavailable after you've paid, we'll tell you straight away and refund you in full.",
          ],
        },
        {
          title: "Prices and payment",
          body: [
            "Prices are set in US dollars. Prices shown in other currencies are a guide at today's rate; card payments are charged in US dollars, and payments in Nigeria are charged in naira at the rate shown at checkout. Shipping is added at checkout before you pay.",
            "Pay-in-4 plans through Klarna or Afterpay are agreements between you and that provider.",
          ],
        },
        {
          title: "Handmade pieces",
          body: [
            "Our bags are cut and sewn by hand, and printed cloth is cut fresh for each order, so the pattern placement and small details vary from the photos. That's part of every piece being one of a kind, not a fault.",
          ],
        },
        {
          title: "Delivery",
          body: [
            "Delivery times and costs are on the Shipping page and at checkout. Import duties and taxes charged by your country are paid by you on delivery.",
          ],
        },
        {
          title: "Returns and faults",
          body: [
            "You can return unused pieces within 30 days. Personalised (monogrammed) pieces can't be returned unless they're faulty. Full details are on the Returns page. Nothing in these terms affects your legal rights as a consumer.",
          ],
        },
        {
          title: "Using this site",
          body: [
            "The photos, text and designs on this site belong to Ada Atelier. Please don't reuse them without asking.",
          ],
        },
        {
          title: "Questions",
          body: ["Use the contact page and we'll get back to you within two business days."],
        },
      ]}
    />
  ),
});
