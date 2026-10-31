import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { useRef, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { PageHeader } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { categories, products, type Category } from "@/lib/catalog";
import { CountryPicker } from "@/lib/currency";
import { useCatalog } from "@/lib/live";

type ShopSearch = { cat?: Category };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch =>
    categories.includes(search["cat"] as Category) ? { cat: search["cat"] as Category } : {},
  head: () => ({
    meta: [
      { title: "Shop — Ada Atelier" },
      {
        name: "description",
        content: "Shop Ada Atelier flap bags, shoppers, totes and backpacks.",
      },
    ],
  }),
  component: Shop,
});

const sorts = {
  featured: "Featured",
  low: "Price, low to high",
  high: "Price, high to low",
} as const;

function Shop() {
  const { cat } = Route.useSearch();
  const [sort, setSort] = useState<keyof typeof sorts>("featured");
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  const available = useCatalog(products);
  const list = available
    .filter((p) => !cat || p.cat === cat)
    .sort((a, b) => (sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0));

  return (
    <div ref={root} className="pb-24 md:pb-36">
      <PageHeader
        eyebrow="Shop"
        lines={cat ? [cat] : ["The _collection"]}
        intro="Premium bags made with the best materials, built to last a long time and survive the everyday."
      />
      <div className="sticky top-0 z-20 border-y bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]">
            <Link to="/shop" aria-current={!cat ? "page" : undefined} className="chip shrink-0">
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                to="/shop"
                search={{ cat: c }}
                aria-current={cat === c ? "page" : undefined}
                className="chip shrink-0"
              >
                {c}
              </Link>
            ))}
          </div>
          <label className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground md:flex">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as keyof typeof sorts)}
              className="cursor-pointer bg-transparent text-foreground outline-none"
            >
              {Object.entries(sorts).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="mt-6 flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            {list.length} {list.length === 1 ? "piece" : "pieces"}
          </p>
          {/* prices open in the shopper's currency; this lets them change it */}
          <label className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Prices for</span>
            <CountryPicker className="max-w-[11rem] text-foreground" />
          </label>
        </div>
        <div
          key={cat ?? "all"}
          className="mt-6 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:grid-cols-4"
        >
          {list.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
        {list.length === 0 && (
          <div className="py-24 text-center">
            <p className="headline text-4xl">
              Arriving <em>soon</em>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              New {cat?.toLowerCase()} styles are on their way.
            </p>
            <Link to="/shop" className="btn btn-outline mt-8">
              See everything
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
