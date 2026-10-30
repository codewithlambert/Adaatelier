import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping — LUVBAG" },
      { name: "description", content: "Delivery times, costs and packaging for LUVBAG orders." },
    ],
  }),
  component: () => (
    <InfoPage
      eyebrow="Help"
      lines={["_Shipping"]}
      intro="Every order ships in our recyclable LUVBAG box."
      sections={[
        {
          title: "Processing",
          body: [
            "Orders are packed and dispatched within 2 business days. Custom monogram pieces need an extra 3–5 days.",
          ],
        },
        {
          title: "Delivery",
          body: [
            "Standard delivery: 3–5 business days, $6.",
            "Express delivery: 1–2 business days, $15.",
          ],
        },
        {
          title: "Tracking",
          body: [
            "You'll receive a tracking link by email as soon as your order leaves the studio.",
          ],
        },
        {
          title: "Packaging",
          body: [
            "Each bag is wrapped in plastic-free tissue and packed in a recyclable LUVBAG box. Keep it for storage or recycle it with household card.",
          ],
        },
      ]}
    />
  ),
});
