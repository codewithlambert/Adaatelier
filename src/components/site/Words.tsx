/** Words wrapped in masks so GSAP can slide them up (pairs with [data-reveal]). Prefix a word with "_" to set it in italic. */
export function Words({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((w, wi) => (
            <span key={wi}>
              <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                <span data-word className="inline-block">
                  {w.startsWith("_") ? <em>{w.slice(1)}</em> : w}
                </span>
              </span>{" "}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

/** Standard page intro used by every sub-page. */
export function PageHeader({
  eyebrow,
  lines,
  intro,
}: {
  eyebrow: string;
  lines: string[];
  intro?: string;
}) {
  return (
    <header className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-32 sm:px-8 md:pb-16 md:pt-44 lg:px-12">
      <span data-fade className="eyebrow">
        {eyebrow}
      </span>
      <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 data-reveal className="headline text-6xl md:text-8xl">
          <Words lines={lines} />
        </h1>
        {intro && (
          <p
            data-fade
            className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-right"
          >
            {intro}
          </p>
        )}
      </div>
    </header>
  );
}
