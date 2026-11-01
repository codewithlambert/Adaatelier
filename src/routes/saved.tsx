import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/lib/catalog";
import { useCatalog } from "@/lib/live";
import { useWishlist } from "@/lib/saved";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [{ title: "Saved — Ada Atelier" }, { name: "robots", content: "noindex" }],
  }),
  component: Saved,
});

function Saved() {
  const { list } = useWishlist();
  const catalog = useCatalog(products);
  const saved = list.map((slug) => catalog.find((p) => p.slug === slug)).filter((p) => !!p);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-32 sm:px-8 md:pb-36 md:pt-40 lg:px-12">
      <p className="eyebrow">Your wishlist</p>
      <h1 className="headline mt-4 text-5xl md:text-7xl">
        Saved <em>for later</em>
      </h1>
      {saved.length === 0 ? (
        <div className="mt-10 max-w-md">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tap the heart on any bag to keep it here. Saved bags stay on this device, no account
            needed.
          </p>
          <Link to="/shop" className="btn mt-8">
            Browse the collection
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {saved.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
