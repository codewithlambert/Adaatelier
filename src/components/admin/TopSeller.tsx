import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bestSellers } from "@/lib/admin-data";
import { findProduct } from "@/lib/catalog";

/** "Congratulations" card: best sellers in a 3-up carousel, the centre one lifted forward. */
export function TopSeller() {
  const [i, setI] = useState(0);
  const n = bestSellers.length;
  const at = (k: number) => {
    const b = bestSellers[(k + n) % n]!;
    return { ...b, p: findProduct(b.slug)! };
  };
  const [prev, cur, next] = [at(i - 1), at(i), at(i + 1)];

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#eef0f4] via-[#f3f3f5] to-[#e8eef6] p-5">
      <h2 className="text-[19px] font-semibold text-zinc-900">Congratulations! 🎉</h2>
      <p className="mt-1.5 max-w-[16rem] text-[12px] leading-relaxed text-zinc-500">
        Some of your products already have the highest buyers
      </p>

      <div className="relative mt-6 flex flex-1 items-center justify-center">
        {/* side cards */}
        <div className="absolute left-0 top-1/2 h-[64%] w-[38%] -translate-y-1/2 overflow-hidden rounded-xl bg-white/80">
          <img
            key={prev.slug}
            src={prev.p.img}
            alt=""
            className="h-full w-full object-cover opacity-90 animate-in fade-in duration-500"
          />
        </div>
        <div className="absolute right-0 top-1/2 h-[64%] w-[38%] -translate-y-1/2 overflow-hidden rounded-xl bg-white/80">
          <img
            key={next.slug}
            src={next.p.img}
            alt=""
            className="h-full w-full object-cover opacity-90 animate-in fade-in duration-500"
          />
        </div>
        {/* centre card */}
        <div className="relative z-10 w-[46%] rounded-2xl bg-white p-2 shadow-[0_18px_40px_-16px_rgb(15_23_42/0.35)]">
          <img
            key={cur.slug}
            src={cur.p.img}
            alt={cur.p.name}
            style={{ objectPosition: cur.p.focus }}
            className="aspect-square w-full rounded-xl object-cover animate-in fade-in zoom-in-95 duration-500"
          />
        </div>
        <button
          onClick={() => setI((v) => v - 1)}
          aria-label="Previous product"
          className="absolute left-1 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-zinc-800 shadow-md transition-transform hover:scale-105"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setI((v) => v + 1)}
          aria-label="Next product"
          className="absolute right-1 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-zinc-800 shadow-md transition-transform hover:scale-105"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        key={cur.slug}
        className="mt-5 text-center animate-in fade-in slide-in-from-bottom-1 duration-500"
      >
        <p className="text-[14px] font-semibold text-zinc-900">{cur.p.name}</p>
        <p className="mt-1 text-[12px] text-zinc-400">{cur.sold} sold</p>
      </div>
    </section>
  );
}
