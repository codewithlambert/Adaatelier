import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Words } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";
import { absoluteUrl } from "@/lib/site";
import { findPost, posts } from "@/lib/catalog";

export const Route = createFileRoute("/journal/$slug")({
  loader: ({ params }) => {
    const post = findPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Ada Atelier Journal` },
          { name: "description", content: loaderData.excerpt },
          { property: "og:title", content: loaderData.title },
          { property: "og:image", content: absoluteUrl(loaderData.img) },
          { name: "twitter:image", content: absoluteUrl(loaderData.img) },
        ]
      : [{ title: "Journal — Ada Atelier" }],
  }),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();
  return <Article key={post.slug} />;
}

function Article() {
  const post = Route.useLoaderData();
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  const next = posts[(posts.findIndex((p) => p.slug === post.slug) + 1) % posts.length];

  return (
    <article ref={root} className="pb-24 md:pb-36">
      <header className="mx-auto max-w-4xl px-5 pb-12 pt-32 text-center sm:px-8 md:pt-44">
        <Link
          data-fade
          to="/journal"
          className="eyebrow inline-flex items-center gap-2 hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Journal
        </Link>
        <p data-fade className="eyebrow mt-8">
          {post.tag} · {post.date}
        </p>
        <h1 data-reveal className="headline mt-5 text-5xl md:text-8xl">
          <Words lines={[post.title]} />
        </h1>
      </header>

      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div data-parallax className="overflow-hidden bg-surface">
          <img
            src={post.img}
            alt=""
            className="aspect-[4/5] w-full scale-110 object-cover grayscale md:aspect-[21/9]"
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 pt-16 sm:px-8 md:pt-24">
        <p data-fade className="headline text-3xl md:text-4xl">
          {post.excerpt}
        </p>
        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-foreground/80">
          {post.body.map((para, i) => (
            <p key={i} data-fade>
              {para}
            </p>
          ))}
        </div>
        <div data-fade className="mt-14 flex flex-wrap gap-3 border-t pt-8">
          <Link to="/shop" className="btn">
            Shop the edit
          </Link>
          <Link to="/journal" className="btn btn-outline">
            All stories
          </Link>
        </div>
      </div>

      {next && next.slug !== post.slug && (
        <Link
          to="/journal/$slug"
          params={{ slug: next.slug }}
          className="group mx-auto mt-24 block max-w-[1440px] border-t px-5 pt-10 sm:px-8 md:mt-32 lg:px-12"
        >
          <span className="eyebrow">Next story</span>
          <span className="headline mt-4 flex items-center justify-between gap-6 text-4xl md:text-7xl">
            {next.title}
            <ArrowRight className="h-8 w-8 shrink-0 transition-transform duration-700 group-hover:translate-x-2 md:h-12 md:w-12" />
          </span>
        </Link>
      )}
    </article>
  );
}
