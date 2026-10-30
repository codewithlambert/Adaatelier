import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { PostCard } from "@/components/site/PostCard";
import { PageHeader } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { posts } from "@/lib/catalog";

export const Route = createFileRoute("/journal/")({
  head: () => ({
    meta: [
      { title: "Journal — LUVBAG" },
      { name: "description", content: "Guides, edits and offers from the LUVBAG studio." },
    ],
  }),
  component: Journal,
});

function Journal() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const [featured, ...rest] = posts;

  return (
    <div ref={root} className="pb-24 md:pb-36">
      <PageHeader
        eyebrow="The Journal"
        lines={["Stories &", "_edits"]}
        intro="Guides, edits and the week's best pieces."
      />
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {featured && (
          <Link
            to="/journal/$slug"
            params={{ slug: featured.slug }}
            data-cursor="view"
            className="group grid gap-8 border-t pt-10 md:grid-cols-[1.4fr_1fr] md:items-end md:gap-14"
          >
            <div data-img-reveal className="overflow-hidden bg-surface">
              <img
                src={featured.img}
                alt=""
                className="aspect-[4/3] w-full object-cover grayscale transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
              />
            </div>
            <div data-fade>
              <span className="eyebrow">
                Featured · {featured.tag} · {featured.date}
              </span>
              <h2 className="headline mt-4 text-4xl md:text-6xl">{featured.title}</h2>
              <p className="mt-4 text-sm text-muted-foreground">{featured.excerpt}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-[13px]">
                <span className="link-line">Read the story</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        )}
        <div className="mt-20 grid gap-x-6 gap-y-14 border-t pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <PostCard key={p.slug} slug={p.slug} className="" />
          ))}
        </div>
      </div>
    </div>
  );
}
