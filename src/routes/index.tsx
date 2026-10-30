import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SurpriseBox } from "@/components/SurpriseBox";
import { Customizer } from "@/components/site/Customizer";
import { PostCard } from "@/components/site/PostCard";
import { ProductCard } from "@/components/site/ProductCard";
import { Words } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { categories, posts, products } from "@/lib/catalog";
import { whenIntroDone } from "@/lib/motion";
import hero from "@/assets/hero.jpg";
import box from "@/assets/box.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ada Atelier — Be Stylish & Modish" },
      {
        name: "description",
        content:
          "Premium, durable bags made with the best materials. Shop totes, flap bags and backpacks.",
      },
      { property: "og:title", content: "Ada Atelier — Be Stylish & Modish" },
      {
        property: "og:description",
        content: "Premium, durable bags made with the best materials.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const cats = ["All", ...categories];
const marquee = ["Premium materials", "Eco-friendly packing", "Built to last", "Made to order"];
const wrap = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12";

function Index() {
  const [cat, setCat] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const activeCat = cat === 0 ? undefined : categories[cat - 1];
  const shown = activeCat ? products.filter((p) => p.cat === activeCat) : products;

  useReveal(root, (gsap) => {
    // hero builds in once the preloader curtain lifts
    const intro = gsap
      .timeline({ paused: true, defaults: { ease: "expo.out" } })
      .from("[data-hero-img]", { scale: 1.3, duration: 2 })
      .from("[data-hero-letter]", { yPercent: 105, stagger: 0.06, duration: 1.5 }, "<0.1")
      .from("[data-hero] [data-word]", { yPercent: 110, stagger: 0.06, duration: 1.2 }, "<0.25")
      .from("[data-hero-fade]", { opacity: 0, y: 18, stagger: 0.1, duration: 1.1 }, "<0.3");
    const stop = whenIntroDone(() => intro.play());

    const heroScroll = { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true };
    gsap.to("[data-hero-media]", { yPercent: 18, ease: "none", scrollTrigger: heroScroll });
    gsap.to("[data-hero-wordmark]", {
      yPercent: -45,
      opacity: 0,
      ease: "none",
      scrollTrigger: heroScroll,
    });
    gsap.to("[data-marquee-track]", {
      xPercent: -12,
      ease: "none",
      scrollTrigger: {
        trigger: "[data-marquee]",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
    return stop;
  });

  return (
    <div ref={root}>
      {/* Hero */}
      <section data-hero className="relative h-[100svh] min-h-[600px] overflow-hidden bg-surface">
        <div data-hero-media className="absolute inset-0">
          <img
            data-hero-img
            src={hero}
            alt="Black leather tote bag on white linen"
            width={1600}
            height={1008}
            className="h-full w-full object-cover object-[50%_70%]"
          />
        </div>
        <div
          data-hero-wordmark
          aria-hidden
          className="headline pointer-events-none absolute inset-x-0 top-[15%] flex justify-center overflow-hidden text-[34vw] leading-[0.85] tracking-[0.06em] md:top-[13%] md:text-[22vw]"
        >
          {"ADA".split("").map((l, i) => (
            <span key={i} data-hero-letter className="inline-block">
              {l}
            </span>
          ))}
        </div>
        <div className={`${wrap} relative z-10 flex h-full flex-col justify-end pb-28 md:pb-12`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="headline text-[15vw] sm:text-7xl lg:text-8xl">
              <Words lines={["Be Stylish", "& _Modish"]} />
            </h1>
            <div className="flex flex-col items-start gap-6 md:max-w-xs md:items-end md:text-right">
              <p
                data-hero-fade
                className="hidden text-sm leading-relaxed text-foreground/70 md:block"
              >
                Be the most stylish with our products. We use premium materials so every bag lasts a
                long time and survives the everyday.
              </p>
              <Link data-hero-fade data-magnetic to="/shop" className="btn">
                Shop the collection <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div data-marquee className="overflow-hidden border-b py-6 md:py-8">
        <div data-marquee-track>
          <div className="marquee flex w-max">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
                {[...marquee, ...marquee].map((m, i) => (
                  <span key={i} className="headline flex items-center text-3xl md:text-5xl">
                    <span className={i % 2 ? "italic" : ""}>{m}</span>
                    <span className="mx-8 inline-block h-1.5 w-1.5 rounded-full bg-foreground md:mx-12" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collections */}
      <section className="py-24 md:py-36">
        <div className={`${wrap} flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between`}>
          <div>
            <span data-fade className="eyebrow">
              Variant Product
            </span>
            <h2 data-reveal className="headline mt-5 text-5xl md:text-7xl">
              <Words lines={["Our best", "_collections"]} />
            </h2>
          </div>
          <div
            data-fade
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0"
          >
            {cats.map((c, i) => (
              <button
                key={c}
                onClick={() => setCat(i)}
                aria-pressed={cat === i}
                className="chip shrink-0"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div
          className={`${wrap} mt-12 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 md:mt-16 lg:grid-cols-4`}
        >
          {shown.slice(0, 4).map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
          {shown.length === 0 && (
            <p className="headline col-span-full py-16 text-center text-3xl text-muted-foreground animate-in fade-in duration-700">
              Arriving <em>soon</em>
            </p>
          )}
        </div>
        <div className={`${wrap} mt-14 flex justify-center`}>
          <Link
            to="/shop"
            search={activeCat ? { cat: activeCat } : {}}
            data-magnetic
            className="btn btn-outline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Customize */}
      <section className="bg-surface py-24 md:py-36">
        <Customizer />
      </section>

      <SurpriseBox />

      {/* Eco */}
      <section className="py-24 md:py-36">
        <div className={`${wrap} grid gap-8 md:grid-cols-2 md:items-end`}>
          <div>
            <span data-fade className="eyebrow">
              Special About Us
            </span>
            <h2 data-reveal className="headline mt-5 text-5xl md:text-7xl">
              <Words lines={["Eco-friendly", "_packing"]} />
            </h2>
          </div>
          <div data-fade className="max-w-sm md:justify-self-end">
            <p className="text-sm leading-relaxed text-muted-foreground">
              We researched materials that can be used as packaging and are kind to the environment.
              Every Ada Atelier bag now ships in one.
            </p>
            <Link to="/about" hash="eco" className="link-line mt-5 inline-block text-[13px]">
              Our story
            </Link>
          </div>
        </div>
        <div className={`${wrap} mt-14 md:mt-20`}>
          <div data-img-reveal className="overflow-hidden bg-surface">
            <img
              src={box}
              alt="Ada Atelier eco packaging box"
              loading="lazy"
              width={1280}
              height={720}
              className="aspect-[4/3] w-full object-cover md:aspect-[21/9]"
            />
          </div>
        </div>
      </section>

      {/* Journal */}
      <section className="pb-24 md:pb-36">
        <div className={`${wrap} flex flex-col gap-6 md:flex-row md:items-end md:justify-between`}>
          <div>
            <span data-fade className="eyebrow">
              The Journal
            </span>
            <h2 data-reveal className="headline mt-5 text-5xl md:text-7xl">
              <Words lines={["Trending", "this _week"]} />
            </h2>
          </div>
          <Link data-fade to="/journal" className="link-line self-start text-[13px] md:self-auto">
            See all stories
          </Link>
        </div>
        <div className="mt-12 md:mt-16">
          <div
            className={`${wrap} flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-6 md:overflow-visible lg:grid-cols-4`}
          >
            {posts.map((p) => (
              <PostCard key={p.slug} slug={p.slug} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
