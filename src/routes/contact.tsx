import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — LUVBAG" },
      { name: "description", content: "Get in touch with the LUVBAG studio." },
    ],
  }),
  component: Contact,
});

const field =
  "w-full border-b border-foreground/25 bg-transparent py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground";

function Contact() {
  const [sent, setSent] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  return (
    <div ref={root} className="pb-24 md:pb-36">
      <PageHeader
        eyebrow="Help"
        lines={["Say _hello"]}
        intro="We usually reply within one business day."
      />
      <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-5 sm:px-8 md:grid-cols-[1fr_1.4fr] md:gap-24 lg:px-12">
        <div data-fade className="space-y-8 border-t pt-10 text-sm">
          <div>
            <p className="eyebrow">Customer care</p>
            <p className="mt-3">Monday – Friday, 9am – 6pm</p>
          </div>
          <div>
            <p className="eyebrow">Orders</p>
            <p className="mt-3 text-muted-foreground">
              Have your order number ready. Read about{" "}
              <Link to="/shipping" className="link-line text-foreground">
                shipping
              </Link>{" "}
              and{" "}
              <Link to="/returns" className="link-line text-foreground">
                returns
              </Link>
              .
            </p>
          </div>
        </div>

        <div data-fade className="border-t pt-10">
          {sent ? (
            <div className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="headline text-5xl">
                Thank <em>you</em>
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Your message is on its way. We'll be in touch soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="grid gap-6 sm:grid-cols-2"
            >
              <input
                required
                name="name"
                placeholder="Name"
                autoComplete="name"
                className={field}
              />
              <input
                required
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                className={field}
              />
              <input
                name="order"
                placeholder="Order number (optional)"
                className={`${field} sm:col-span-2`}
              />
              <textarea
                required
                name="message"
                rows={5}
                placeholder="Message"
                className={`${field} resize-none sm:col-span-2`}
              />
              <div className="sm:col-span-2">
                <button data-magnetic className="btn">
                  Send message <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
