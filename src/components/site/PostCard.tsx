import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { posts } from "@/lib/catalog";

export function PostCard({
  slug,
  className = "w-[78%] shrink-0 snap-start md:w-auto",
}: {
  slug: string;
  className?: string;
}) {
  const p = posts.find((x) => x.slug === slug);
  if (!p) return null;
  return (
    <Link
      to="/journal/$slug"
      params={{ slug: p.slug }}
      data-cursor="view"
      className={`group ${className}`}
    >
      <div data-img-reveal className="overflow-hidden bg-surface">
        <img
          src={p.img}
          alt=""
          loading="lazy"
          className="aspect-[3/4] w-full object-cover grayscale transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
        />
      </div>
      <span className="eyebrow mt-5 block">
        {p.tag} · {p.date}
      </span>
      <h3 className="headline mt-2 text-2xl md:text-3xl">{p.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-[13px]">
        <span className="link-line">Read now</span>
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
