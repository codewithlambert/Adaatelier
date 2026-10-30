import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { PageHeader } from "@/components/site/Words";
import { useReveal } from "@/hooks/use-reveal";

type Section = { title: string; body: string[] };

/** Shared layout for the help pages (shipping, returns). */
export function InfoPage({
  eyebrow,
  lines,
  intro,
  sections,
}: {
  eyebrow: string;
  lines: string[];
  intro: string;
  sections: Section[];
}) {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  return (
    <div ref={root} className="pb-24 md:pb-36">
      <PageHeader eyebrow={eyebrow} lines={lines} intro={intro} />
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
        {sections.map((s) => (
          <section
            key={s.title}
            data-fade
            className="grid gap-4 border-t py-10 md:grid-cols-[1fr_2fr] md:gap-20"
          >
            <h2 className="headline text-3xl">{s.title}</h2>
            <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
              {s.body.map((b, i) => (
                <p key={i}>{b}</p>
              ))}
            </div>
          </section>
        ))}
        <div data-fade className="flex flex-wrap items-center justify-between gap-6 border-t pt-10">
          <p className="headline text-3xl">
            Still have <em>questions?</em>
          </p>
          <Link to="/contact" className="btn">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
