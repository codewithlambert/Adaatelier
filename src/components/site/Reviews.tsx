// Product reviews: published ones are public; new ones wait for approval in the admin.
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Review = { id: number; name: string; rating: number; body: string; created_at: string };

const cache = new Map<string, Promise<Review[]>>();
function load(productId: string) {
  let hit = cache.get(productId);
  if (!hit) {
    hit = (async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from("reviews")
        .select("id, name, rating, body, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data as Review[] | null) ?? [];
    })();
    cache.set(productId, hit);
  }
  return hit;
}

export function useReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  useEffect(() => {
    let alive = true;
    void load(productId).then((r) => alive && setReviews(r));
    return () => {
      alive = false;
    };
  }, [productId]);
  const average = reviews?.length
    ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
    : null;
  return { reviews, average };
}

export function Stars({ value, className = "h-3.5 w-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={`${className} ${i <= Math.round(value) ? "fill-current" : "opacity-25"}`}
          strokeWidth={1.4}
        />
      ))}
    </span>
  );
}

/** "★★★★★ 4.8 · 3 reviews" under the price, linking down to the reviews. */
export function RatingSummary({ productId }: { productId: string }) {
  const { reviews, average } = useReviews(productId);
  if (!reviews?.length || average === null) return null;
  return (
    <a
      href="#reviews"
      className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground"
    >
      <Stars value={average} />
      <span className="link-line">
        {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
      </span>
    </a>
  );
}

const field =
  "w-full border-b border-foreground/25 bg-transparent py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground";

export function Reviews({ productId, productName }: { productId: string; productName: string }) {
  const { reviews, average } = useReviews(productId);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return setState("error");
    setState("sending");
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      name: name.trim(),
      rating,
      body: body.trim(),
    });
    setState(error ? "error" : "sent");
  };

  return (
    <section id="reviews" className="scroll-mt-24 border-t py-24 md:py-32">
      <div className="mx-auto grid w-full max-w-[1440px] gap-16 px-5 sm:px-8 md:grid-cols-[1.3fr_1fr] md:gap-24 lg:px-12">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="headline mt-5 text-4xl md:text-6xl">
            {average === null ? (
              <>
                Be the <em>first</em>
              </>
            ) : (
              <>
                {average.toFixed(1)} <em>out of 5</em>
              </>
            )}
          </h2>
          <ul className="mt-12 divide-y divide-foreground/10 border-t border-foreground/10">
            {reviews?.map((r) => (
              <li key={r.id} className="py-8">
                <div className="flex items-center justify-between gap-4">
                  <Stars value={r.rating} />
                  <time className="text-[11px] text-muted-foreground" dateTime={r.created_at}>
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <p className="mt-4 max-w-prose text-sm leading-relaxed">{r.body}</p>
                <p className="mt-3 text-xs text-muted-foreground">{r.name}</p>
              </li>
            ))}
            {reviews?.length === 0 && (
              <li className="py-8 text-sm text-muted-foreground">
                No reviews yet for the {productName}.
              </li>
            )}
          </ul>
        </div>

        <form onSubmit={submit} className="space-y-6 md:sticky md:top-28 md:self-start">
          <p className="eyebrow">Write a review</p>
          {state === "sent" ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Thank you. Your review will appear here once we&apos;ve checked it.
            </p>
          ) : (
            <>
              <div role="radiogroup" aria-label="Rating" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={rating === i}
                    aria-label={`${i} star${i > 1 ? "s" : ""}`}
                    onClick={() => setRating(i)}
                    className="grid h-9 w-9 place-items-center"
                  >
                    <Star
                      className={`h-5 w-5 ${i <= rating ? "fill-current" : "opacity-25"}`}
                      strokeWidth={1.4}
                    />
                  </button>
                ))}
              </div>
              <input
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name, e.g. Ngozi A."
                className={field}
              />
              <textarea
                required
                maxLength={1000}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="How does it look, feel and carry?"
                className={`${field} resize-none`}
              />
              {state === "error" && (
                <p role="alert" className="text-sm text-destructive">
                  We couldn&apos;t send your review. Please try again.
                </p>
              )}
              <button type="submit" disabled={state === "sending"} className="btn w-full">
                {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit review
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
