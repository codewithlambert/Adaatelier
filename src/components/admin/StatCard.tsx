import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { useId } from "react";
import { useCountUp } from "@/hooks/use-count-up";

type Props = {
  label: string;
  value: number;
  change: number;
  icon: LucideIcon;
  /** recent values for the sparkline */
  trend: number[];
  index: number;
};

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const id = useId();
  const w = 72;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 3 - ((v - min) / (max - min || 1)) * (h - 6),
  ]);
  const line = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x!.toFixed(1)} ${y!.toFixed(1)}`)
    .join(" ");
  const color = up ? "#34d399" : "#fb7185";
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        pathLength={1}
        className="[stroke-dasharray:1] [stroke-dashoffset:1] [animation:spark-draw_1.4s_cubic-bezier(0.19,1,0.22,1)_forwards]"
      />
    </svg>
  );
}

export function StatCard({ label, value, change, icon: Icon, trend, index }: Props) {
  const shown = useCountUp(value, 1400, 120 * index);
  const up = change >= 0;
  return (
    <div
      className="group relative flex items-center gap-3.5 overflow-hidden rounded-2xl bg-[#f5f5f6] px-4 py-4 ring-1 ring-transparent transition-[transform,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_-24px_rgb(15_23_42/0.35)] hover:ring-zinc-200/80 sm:px-5"
      style={{
        animationDelay: `${80 * index}ms`,
        animationDuration: "700ms",
        animationFillMode: "both",
      }}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm transition-transform duration-500 group-hover:scale-105">
        <Icon className="h-[18px] w-[18px] text-zinc-800" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] text-zinc-500">{label}</p>
        <p className="mt-1 flex items-center gap-2">
          <span className="text-[22px] font-semibold leading-none tabular-nums">
            {Math.round(shown)}
          </span>
          <span
            className={`flex items-center gap-1 text-[11.5px] ${up ? "text-emerald-500" : "text-rose-400"}`}
          >
            <span
              className={`grid h-3.5 w-3.5 place-items-center rounded-full text-white ${up ? "bg-emerald-400" : "bg-rose-400"}`}
            >
              {up ? (
                <ArrowUp className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <ArrowDown className="h-2.5 w-2.5" strokeWidth={3} />
              )}
            </span>
            {up ? "+" : ""}
            {change}%
          </span>
        </p>
      </div>
      <span className="hidden sm:block 2xl:block xl:hidden">
        <Sparkline data={trend} up={up} />
      </span>
    </div>
  );
}
