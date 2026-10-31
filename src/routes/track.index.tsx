import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

// "Track your order": the order number and the email used at checkout open the private
// tracking page, so nobody needs to keep the link from their receipt.
export const Route = createFileRoute("/track/")({
  head: () => ({
    meta: [
      { title: "Track your order — Ada Atelier" },
      { name: "description", content: "See where your Ada Atelier order is." },
    ],
  }),
  component: FindOrder,
});

const field =
  "w-full border-b border-foreground/25 bg-transparent pb-2 pt-5 text-sm outline-none transition-colors focus:border-foreground";

function FindOrder() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabase) return setError("Order tracking isn't available right now.");
    setBusy(true);
    const order = id.trim().toUpperCase().replace(/^#/, "");
    const { data, error: err } = await supabase.rpc("find_order", {
      p_id: order,
      p_email: email.trim(),
    });
    setBusy(false);
    if (err || !data) {
      setError(
        "We couldn't find that order. Check the number (it starts with ADA) and use the email you checked out with.",
      );
      return;
    }
    void navigate({ to: "/track/$id", params: { id: order }, search: { t: data as string } });
  };

  return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-36 md:pb-36 md:pt-44">
      <p className="eyebrow">Order tracking</p>
      <h1 className="headline mt-4 text-5xl md:text-6xl">
        Where&apos;s my <em>bag?</em>
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Enter your order number and the email you used at checkout to see where your order is.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <label className="relative block">
          <span className="pointer-events-none absolute left-0 top-0 text-[11px] text-muted-foreground">
            Order number
          </span>
          <input
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="ADA3001"
            autoCapitalize="characters"
            className={`${field} uppercase tracking-[0.08em] placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/50`}
          />
        </label>
        <label className="relative block">
          <span className="pointer-events-none absolute left-0 top-0 text-[11px] text-muted-foreground">
            Email used at checkout
          </span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${field} placeholder:text-muted-foreground/50`}
          />
        </label>
        {error && (
          <p
            role="alert"
            className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in duration-300"
          >
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn w-full disabled:opacity-60">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Track order <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
