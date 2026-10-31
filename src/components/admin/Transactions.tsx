import type React from "react";
import { useMemo, useState } from "react";
import {
  Check,
  Instagram,
  MessageCircle,
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { LogoMark } from "@/components/site/Logo";
import { transactions, type Platform } from "@/lib/admin-data";

const platformStyle: Record<Platform, { tile: string; icon: React.ReactNode }> = {
  "Online store": { tile: "bg-zinc-900", icon: <LogoMark className="h-3 w-3" /> },
  Instagram: {
    tile: "bg-gradient-to-br from-[#f9a03f] via-[#e1306c] to-[#833ab4]",
    icon: <Instagram className="h-3 w-3" strokeWidth={2.4} />,
  },
  WhatsApp: { tile: "bg-[#25d366]", icon: <MessageCircle className="h-3 w-3" strokeWidth={2.4} /> },
  Jumia: { tile: "bg-[#f68b1e]", icon: <ShoppingCart className="h-3 w-3" strokeWidth={2.4} /> },
};

function Box({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`grid h-4 w-4 place-items-center rounded-[5px] border transition-colors ${
        on
          ? "border-sky-500 bg-sky-500 text-white"
          : "border-zinc-300 bg-white hover:border-zinc-400"
      }`}
    >
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

export function Transactions() {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set([transactions[1]!.id]));
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => `${t.id} ${t.item} ${t.platform}`.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query]);
  const allOn = rows.length > 0 && rows.every((r) => picked.has(r.id));

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold text-zinc-900">Last transaction</h2>
        <div className="flex items-center gap-2.5">
          <label className="flex h-10 w-[190px] items-center gap-2 rounded-xl border border-zinc-200 px-3 text-[13px] focus-within:border-zinc-400">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-400"
            />
          </label>
          <button
            aria-label="Filter"
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-zinc-100 text-[12px] text-zinc-400">
              <th className="w-10 py-3 pl-1.5 font-normal">
                <Box
                  on={allOn}
                  label="Select all"
                  onClick={() =>
                    setPicked((s) => {
                      const n = new Set(s);
                      rows.forEach((r) => (allOn ? n.delete(r.id) : n.add(r.id)));
                      return n;
                    })
                  }
                />
              </th>
              <th className="py-3 font-normal">Order ID</th>
              <th className="py-3 font-normal">Item</th>
              <th className="py-3 font-normal">Date</th>
              <th className="py-3 font-normal">Price</th>
              <th className="py-3 font-normal">Platform</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const on = picked.has(t.id);
              const ps = platformStyle[t.platform];
              return (
                <tr
                  key={t.id}
                  className={`border-b border-zinc-100 text-zinc-800 transition-colors ${on ? "bg-zinc-50" : "hover:bg-zinc-50/60"}`}
                >
                  <td className="py-3.5 pl-1.5">
                    <Box on={on} label={`Select ${t.id}`} onClick={() => toggle(t.id)} />
                  </td>
                  <td className="py-3.5">{t.id}</td>
                  <td className="max-w-[150px] truncate py-3.5 pr-3">{t.item}</td>
                  <td className="py-3.5 text-zinc-500">{t.date}</td>
                  <td className="py-3.5 font-medium tabular-nums">${Math.round(t.price)}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 px-2 py-1 text-[11.5px] ring-1 ring-zinc-100">
                      <span
                        className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] text-white ${ps.tile}`}
                      >
                        {ps.icon}
                      </span>
                      {t.platform}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-zinc-400">
                  No orders match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
