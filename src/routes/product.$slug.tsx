import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductDetails } from "@/components/site/ProductDetails";
import { Reviews } from "@/components/site/Reviews";
import { Words } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { absoluteUrl } from "@/lib/site";
import { bagColors, findProduct, products, type ColorId } from "@/lib/catalog";
import { fetchDbProduct } from "@/lib/live";

type ProductSearch = { color?: ColorId };

export const Route = createFileRoute("/product/$slug")({
  validateSearch: (search: Record<string, unknown>): ProductSearch =>
    bagColors.some((c) => c.id === search["color"]) ? { color: search["color"] as ColorId } : {},
  loader: async ({ params }) => {
    // bundled bags first; anything else may have been added in the admin
    const product = findProduct(params.slug) ?? (await fetchDbProduct(params.slug));
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Ada Atelier` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: `${loaderData.name} — Ada Atelier` },
          { property: "og:image", content: absoluteUrl(loaderData.img) },
          { name: "twitter:image", content: absoluteUrl(loaderData.img) },
        ]
      : [{ title: "Product — Ada Atelier" }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const p = Route.useLoaderData();
  // remount per product so animations, colour and quantity reset when moving between products
  return <ProductView key={p.slug} />;
}

function ProductView() {
  const p = Route.useLoaderData();
  const { color } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const related = products.filter((x) => x.slug !== p.slug).slice(0, 4);

  return (
    <div ref={root}>
      <ProductDetails
        product={p}
        initialColor={color}
        onColorChange={(c) =>
          void navigate({
            search: c === "onyx" ? {} : { color: c },
            replace: true,
            resetScroll: false,
          })
        }
      />

      <Reviews productId={p.slug} productName={p.name} />

      <section className="border-t py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <h2 data-reveal className="headline text-4xl md:text-6xl">
            <Words lines={["You may _also _like"]} />
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.slug} p={r} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
