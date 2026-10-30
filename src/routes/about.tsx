import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { PageHeader, Words } from "@/components/site/Words";
import { LogoMark } from "@/components/site/Logo";
import { useReveal } from "@/hooks/use-reveal";
import hero from "@/assets/hero.jpg";
import bag3 from "@/assets/bag3.jpg";
import box from "@/assets/box.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our story — LUVBAG" },
      {
        name: "description",
        content: "Why LUVBAG makes premium, durable bags and ships them in eco-friendly packaging.",
      },
    ],
  }),
  component: About,
});

const wrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12";

const values = [
  ["01", "Premium materials", "Selected to last a long time and survive damage."],
  ["02", "Recyclable boxes", "Packaging made from responsibly sourced card."],
  ["03", "Made to order", "Customised by hand, finished with your monogram."],
];

function About() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  return (
    <div ref={root}>
      <PageHeader
        eyebrow="Our story"
        lines={["Be stylish", "& _modish"]}
        intro="LUVBAG started with one idea: a bag should look as good in five years as it does on the first day."
      />

      <div className={wrap}>
        <div data-parallax className="overflow-hidden bg-surface">
          <img
            src={hero}
            alt="LUVBAG tote"
            className="aspect-[4/5] w-full scale-110 object-cover md:aspect-[21/9]"
          />
        </div>
      </div>

      <section className={`${wrap} grid gap-10 py-24 md:grid-cols-2 md:gap-20 md:py-36`}>
        <h2 data-reveal className="headline text-5xl md:text-7xl">
          <Words lines={["Made to be", "_carried"]} />
        </h2>
        <div
          data-fade
          className="space-y-5 text-sm leading-relaxed text-muted-foreground md:max-w-md"
        >
          <p>
            We always give the best for the products we produce. Every LUVBAG is cut from premium
            materials chosen to last a long time and survive the knocks of everyday life.
          </p>
          <p>
            Our shapes are simple on purpose. Clean lines, tonal hardware and quiet branding mean
            the bag works with what you already own, season after season.
          </p>
          <p>
            And because no two people carry the same things, most of our pieces can be customised
            with your colour and your initials.
          </p>
        </div>
      </section>

      <section id="eco" className="scroll-mt-24 bg-surface py-24 md:py-36">
        <div className={`${wrap} grid items-center gap-12 md:grid-cols-2 md:gap-20`}>
          <div data-img-reveal className="overflow-hidden">
            <img
              src={box}
              alt="LUVBAG eco packaging box"
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
              We researched materials that can be used as packaging and are kind to the environment.
              Every order now ships in a recyclable LUVBAG box with plastic-free tissue, ready to be
              reused or recycled.
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
              <Words lines={["Find yours"]} />
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
            <img src={bag3} alt="Flap Bag No. 003" className="aspect-[4/5] w-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
