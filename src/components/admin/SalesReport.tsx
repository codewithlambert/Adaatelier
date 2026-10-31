import { useState } from "react";
import { ArrowUp, ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCountUp } from "@/hooks/use-count-up";
import { ranges, sales, type Range, type SalesPoint } from "@/lib/admin-data";

const BLUE = "#5b8db8";
const ORANGE = "#e3a06a";
const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type TipProps = { active?: boolean; payload?: { payload: SalesPoint }[] };

function Tip({ active, payload }: TipProps) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="relative rounded-xl bg-[#111827] px-4 py-3 text-white shadow-xl">
      <p className="text-[13px] font-semibold">{p.date}</p>
      <div className="mt-2 space-y-1.5 text-[11px]">
        <p className="flex items-center gap-2 border-l-2 pl-2" style={{ borderColor: BLUE }}>
          <span className="font-medium">{p.transactions}</span>
          <span className="text-white/50">Transactions</span>
        </p>
        <p className="flex items-center gap-2 border-l-2 pl-2" style={{ borderColor: ORANGE }}>
          <span className="font-medium">{p.products}</span>
          <span className="text-white/50">Product</span>
        </p>
      </div>
      <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-[#111827]" />
    </div>
  );
}

export function SalesReport() {
  const [range, setRange] = useState<Range>("7d");
  const data = sales[range];
  const [hover, setHover] = useState<number | null>(null);
  const total = useCountUp(data.total, 1200, 250);
  const active = hover ?? Math.min(7, data.points.length - 1);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:gap-8">
      <div className="flex flex-col">
        <h2 className="text-[17px] font-semibold text-zinc-900">Your sales report</h2>
        <p className="mt-1 text-[13px] text-zinc-400">Look at your sale</p>
        <p className="mt-10 text-[40px] font-semibold leading-none tracking-tight text-zinc-900 animate-in fade-in slide-in-from-bottom-1 duration-500 sm:text-[46px]">
          {usd(total)}
        </p>
        <p className="mt-4 flex items-center gap-2 text-[13px] text-emerald-500">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-white">
            <ArrowUp className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          {usd(data.delta)} (+{data.deltaPct}%)
        </p>
        <div className="mt-auto flex gap-1 pt-10" role="tablist" aria-label="Range">
          {ranges.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => {
                setRange(r);
                setHover(null);
              }}
              className={`h-8 min-w-9 rounded-lg px-2.5 text-[12px] transition-colors ${
                range === r
                  ? "bg-zinc-900 font-medium text-white"
                  : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex justify-end">
          <button className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3.5 text-[12px] text-zinc-600 hover:bg-zinc-50">
            Total Sales <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              key={range}
              data={data.points}
              margin={{ top: 16, right: 8, bottom: 0, left: 8 }}
              onMouseMove={(s) =>
                typeof s.activeTooltipIndex === "number" && setHover(s.activeTooltipIndex)
              }
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="adaBlueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical horizontal={false} stroke="#e4e4e7" strokeDasharray="4 4" />
              <YAxis hide domain={["dataMin - 40", "dataMax + 40"]} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={0}
                height={34}
                tick={({ x, y, payload, index }) => {
                  const on = index === active;
                  return (
                    <g transform={`translate(${x},${y + 14})`}>
                      {on && <rect x={-19} y={-12} width={38} height={24} rx={8} fill="#f4f4f5" />}
                      <text
                        textAnchor="middle"
                        dy={4}
                        fontSize={12}
                        fill={on ? "#18181b" : "#71717a"}
                        fontWeight={on ? 600 : 400}
                      >
                        {payload.value}
                      </text>
                    </g>
                  );
                }}
              />
              <Tooltip
                content={<Tip />}
                cursor={{ stroke: "#a1a1aa", strokeDasharray: "4 4" }}
                offset={16}
                wrapperStyle={{ outline: "none" }}
                defaultIndex={active}
                active
              />
              <Area
                type="monotone"
                dataKey="transactions"
                stroke={BLUE}
                strokeWidth={2}
                fill="url(#adaBlueFill)"
                activeDot={{ r: 4, fill: BLUE, stroke: "#fff", strokeWidth: 2 }}
                animationDuration={900}
              />
              <Area
                type="monotone"
                dataKey="products"
                stroke={ORANGE}
                strokeWidth={2}
                fill="transparent"
                activeDot={{ r: 4, fill: ORANGE, stroke: "#fff", strokeWidth: 2 }}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
