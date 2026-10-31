import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { PageHeader, Words } from "@/components/site/Words";
import { LogoMark } from "@/components/site/Logo";
import { useReveal } from "@/hooks/use-reveal";
import ankaraTote from "@/assets/ankara-tote.jpg";
import ankaraShopper from "@/assets/ankara-shopper.jpg";
import box from "@/assets/box.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — Ada Atelier" },
      {
        name: "description",
        content:
          "Ada Atelier is a Lagos bag house: wax print, mud cloth and leather, made by hand in Nigeria and shipped to your door in the US and worldwide.",
      },
    ],
  }),
  component: About,
});

const wrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12";

const values = [
  [
    "01",
    "Made in Lagos",
    "Cut and sewn by hand by makers we know by name, paid fairly for every piece.",
  ],
  [
    "02",
    "Real African cloth",
    "Wax print from Lagos markets and mud cloth from Mali, never printed copies.",
  ],
  ["03", "Shipped to the US", "Tracked delivery, duties shown at checkout, 30-day returns."],
];

function About() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  return (
    <div ref={root}>
      <PageHeader
        eyebrow="Our story"
        lines={["Made in Lagos", "carried _everywhere"]}
        intro="In Igbo, Ada means first daughter: the one who leads, carries the family and keeps its stories. We make bags in her image."
      />

      <div className={wrap}>
        <div data-parallax className="overflow-hidden bg-surface">
          <img
            src={ankaraTote}
            alt="Ankara Tote No. 007 in a plum diamond wax print"
            className="aspect-[4/5] w-full scale-110 object-cover md:aspect-[21/9]"
          />
        </div>
      </div>

      <section className={`${wrap} grid gap-10 py-24 md:grid-cols-2 md:gap-20 md:py-36`}>
        <h2 data-reveal className="headline text-5xl md:text-7xl">
          <Words lines={["From the market", "to your _shoulder"]} />
        </h2>
        <div
          data-fade
          className="space-y-5 text-sm leading-relaxed text-muted-foreground md:max-w-md"
        >
          <p>
            Every Ada Atelier bag starts in Lagos. Our makers choose wax print by the bolt at the
            markets, the same cloth our mothers wore to weddings and Sunday service, and pair it
            with good leather and solid brass.
          </p>
          <p>
            Some pieces go further: mud cloth hand-painted in Mali, and Aso-oke woven on narrow
            looms in the southwest. Each one is cut by hand, so the print falls a little differently
            on every bag. That is the point.
          </p>
          <p>
            The shapes stay simple on purpose. Clean lines and quiet hardware let the cloth talk,
            and the bag works with what you already own, whether you live in Lagos, London or Los
            Angeles. Most pieces can carry your initials too.
          </p>
        </div>
      </section>

      <section id="eco" className="scroll-mt-24 bg-surface py-24 md:py-36">
        <div className={`${wrap} grid items-center gap-12 md:grid-cols-2 md:gap-20`}>
          <div data-img-reveal className="overflow-hidden">
            <img
              src={box}
              alt="Ada Atelier eco packaging box"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div>
            <span data-fade className="eyebrow">
              Special about us
            </span>
            <h2 data-reveal className="headline mt-5 text-5xl md:text-7xl">
              <Words lines={["Eco-friendly", "_packing"]} />
            </h2>
            <p data-fade className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
              Every order leaves Lagos in a recyclable Ada Atelier box, wrapped in plastic-free
              tissue with an offcut of the bag's own cloth and a card signed by the person who made
              it. Keep the box, reuse the cloth.
            </p>
          </div>
        </div>
      </section>

      <section className={`${wrap} grid gap-10 py-24 sm:grid-cols-3 md:py-32`}>
        {values.map(([n, t, d]) => (
          <div key={n} data-fade className="border-t pt-8">
            <span className="text-[11px] text-muted-foreground">{n}</span>
            <h3 className="headline mt-3 text-3xl">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="bg-ink py-24 text-ink-foreground md:py-36">
        <div className={`${wrap} grid items-center gap-12 md:grid-cols-2`}>
          <div>
            <LogoMark className="h-10 w-10" />
            <h2 data-reveal className="headline mt-8 text-5xl md:text-7xl">
              <Words lines={["Find your _print"]} />
            </h2>
            <Link
              data-magnetic
              to="/shop"
              className="btn mt-10 border-ink-foreground bg-ink-foreground text-ink"
            >
              Shop the collection <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div data-img-reveal className="overflow-hidden bg-surface">
            <img
              src={ankaraShopper}
              alt="Ankara Shopper No. 006 in an indigo wax print"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
