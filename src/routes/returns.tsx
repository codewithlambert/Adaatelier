import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns — LUVBAG" },
      { name: "description", content: "How to return or exchange a LUVBAG order." },
    ],
  }),
  component: () => (
    <InfoPage
      eyebrow="Help"
      lines={["_Returns"]}
      intro="Free returns within 30 days of delivery."
      sections={[
        {
          title: "Eligibility",
          body: [
            "Bags can be returned within 30 days of delivery, unused and with all tags and the original packaging.",
            "Customised and monogrammed pieces are made to order and can't be returned unless faulty.",
          ],
        },
        {
          title: "How to return",
          body: [
            "Contact us with your order number and we'll email a prepaid return label.",
            "Pack the bag in its original box and drop it at any carrier location.",
          ],
        },
        {
          title: "Refunds",
          body: [
            "Refunds go back to the original payment method within 5 business days of the return reaching us.",
          ],
        },
        {
          title: "Exchanges",
          body: [
            "Want a different style? Return the original and place a new order — it's the fastest way to swap.",
          ],
        },
      ]}
    />
  ),
});
