import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoPage } from "@/components/site/InfoPage";
import { useCurrency } from "@/lib/currency";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping — Ada Atelier" },
      {
        name: "description",
        content:
          "Made in Lagos, delivered worldwide: dispatch times, delivery costs, duties, tracking and packaging for Ada Atelier orders.",
      },
    ],
  }),
  component: Shipping,
});

// matches checkout until the admin's prices load
const DEFAULT_RATES = { standard: 6, express: 15 };

function Shipping() {
  const { format } = useCurrency();
  const [rates, setRates] = useState(DEFAULT_RATES);

  // the same shipping prices the admin sets and checkout charges
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

  return (
    <InfoPage
      eyebrow="Help"
      lines={["_Shipping"]}
      intro="Made in Lagos, delivered worldwide. Every order ships tracked, in our recyclable Ada Atelier box."
      sections={[
        {
          title: "When it ships",
          body: [
            "Bags in stock leave our Lagos workshop within 1–2 business days of your payment clearing.",
            "Monogrammed pieces take an extra 3–5 business days, because every initial is stitched by hand.",
            "Ankara and mud cloth pieces are cut from a new bolt for each order, so they can take up to 7 business days. The product page says when that applies.",
          ],
        },
        {
          title: "Delivery and cost",
          body: [
            `Standard: 3–5 business days after dispatch, ${format(rates.standard)}.`,
            `Express: 1–2 business days after dispatch, ${format(rates.express)}.`,
            "International orders travel with DHL Express or FedEx. Orders within Nigeria use GIG Logistics or Kwik: 1–2 days in Lagos, 2–4 days elsewhere.",
            "Your exact delivery dates show at checkout before you pay.",
          ],
        },
        {
          title: "Where we deliver",
          body: [
            "Across Africa, Europe, the Americas, the Middle East and Asia-Pacific: 69 countries in all. If your country isn't listed at checkout, write to us and we'll arrange it.",
          ],
        },
        {
          title: "Duties and taxes",
          body: [
            "Prices don't include import duties or sales taxes charged by your country. If customs asks for them, they're paid on delivery, and the courier will tell you the amount first.",
            "We declare every order at its true value and never mark a sale as a gift.",
          ],
        },
        {
          title: "Tracking",
          body: [
            "Right after you pay, you land on your order's tracking page. It updates by itself as your bag is prepared, shipped and delivered, and shows the courier's tracking number once it leaves.",
            "Lost the link? Use Track order in the footer with your order number and email.",
          ],
        },
        {
          title: "Packaging",
          body: [
            "Each bag is wrapped in plastic-free tissue with an offcut of its own cloth and a card signed by the person who made it, then packed in a recyclable Ada Atelier box that's ready to give as a gift.",
          ],
        },
        {
          title: "If something goes wrong",
          body: [
            "Every parcel is insured until it reaches you. If it arrives damaged or doesn't arrive, contact us within 48 hours of the expected delivery date, with photos if there's damage, and we'll replace it or refund you in full.",
          ],
        },
      ]}
    />
  );
}
