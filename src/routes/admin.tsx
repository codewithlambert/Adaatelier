import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  Box,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardX,
  Menu,
  Search,
  type LucideIcon,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { CommandMenu } from "@/components/admin/CommandMenu";
import { SalesReport } from "@/components/admin/SalesReport";
import { StatCard } from "@/components/admin/StatCard";
import { Sidebar, type Section } from "@/components/admin/Sidebar";
import { TopSeller } from "@/components/admin/TopSeller";
import { Transactions } from "@/components/admin/Transactions";
import { LogoMark } from "@/components/site/Logo";
import { ADMIN_NAME, stats } from "@/lib/admin-data";
import { bagColors, money, products } from "@/lib/catalog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Overview — Ada Atelier Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

const statIcons: Record<(typeof stats)[number]["id"], LucideIcon> = {
  products: Box,
  completed: ClipboardCheck,
  canceled: ClipboardX,
  top: Award,
};

const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Accra"];
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]!;

function greetingFor(hour: number) {
  return hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
}

function Admin() {
  const [section, setSection] = useState<Section>("Overview");
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [orders, setOrders] = useState(10);
  const [unread, setUnread] = useState(7);

  // demo "live" feed: a new order lands every so often (replace with a realtime subscription)
  useEffect(() => {
    const id = window.setInterval(() => {
      const p = pick(products);
      const c = pick(bagColors);
      setOrders((n) => n + 1);
      setUnread((n) => n + 1);
      toast(`New order · ${money(p.price)}`, {
        description: `${p.name} in ${c.name} · ${pick(cities)}`,
      });
    }, 18000);
    return () => window.clearInterval(id);
  }, []);
  // time-of-day text is filled in on the client so server and browser HTML agree
  const [now, setNow] = useState<{ greet: string; date: string } | null>(null);
  useEffect(() => {
    const d = new Date();
    setNow({
      greet: greetingFor(d.getHours()),
      date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    });
  }, []);

  const select = (s: Section) => {
    setSection(s);
    setDrawer(false);
  };

  return (
    <div className="min-h-screen bg-[#ececee] font-sans text-zinc-900 lg:p-6">
      <div className="mx-auto flex h-screen max-w-[1480px] overflow-hidden bg-white lg:h-[calc(100vh-3rem)] lg:rounded-2xl lg:shadow-[0_30px_80px_-40px_rgb(0_0_0/0.35)]">
        {/* sidebar: fixed column on desktop, drawer on smaller screens */}
        <div className="hidden lg:block">
          <Sidebar
            active={section}
            onSelect={select}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            ordersBadge={orders}
          />
        </div>
        {drawer && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="h-full animate-in slide-in-from-left duration-300">
              <Sidebar
                active={section}
                onSelect={select}
                collapsed={false}
                onToggle={() => setDrawer(false)}
                ordersBadge={orders}
              />
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setDrawer(false)}
              className="flex-1 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-300"
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* header */}
          <header className="flex items-center gap-4 border-b border-zinc-100 px-5 py-4 sm:px-8 sm:py-5">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-semibold sm:text-[22px]">
                {now?.greet ?? "Hello"}, {ADMIN_NAME}!
              </h1>
              <p className="mt-0.5 hidden text-[13px] text-zinc-400 sm:block">
                Here&apos;s what&apos;s happening with your store today
              </p>
            </div>
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-600 ring-1 ring-emerald-100 xl:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
            <button
              onClick={() => setPalette(true)}
              className="hidden h-11 w-[220px] items-center gap-2.5 rounded-xl border border-zinc-200 px-3.5 text-[13px] text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-50 md:flex"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search anything…</span>
              <kbd className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-sans text-[10.5px] text-zinc-500">
                Ctrl K
              </kbd>
            </button>
            <div className="hidden h-11 items-center gap-2.5 rounded-xl px-1 text-[13.5px] font-medium 2xl:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100">
                <CalendarDays className="h-4 w-4 text-zinc-600" />
              </span>
              {now?.date ?? " "}
            </div>
            <button
              aria-label={`Notifications, ${unread} unread`}
              onClick={() => setUnread(0)}
              className="relative grid h-11 w-11 place-items-center rounded-full border border-zinc-200 hover:bg-zinc-50"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span
                  key={unread}
                  className="absolute -top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-rose-400 px-1 text-[10px] font-medium text-white animate-in zoom-in-50 duration-300"
                >
                  {unread}
                </span>
              )}
            </button>
            <button className="flex h-11 items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 hover:bg-zinc-50">
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-white">
                <LogoMark className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-sky-500" />
              </span>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-6 sm:px-8 sm:pt-8">
            {section === "Overview" ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                  {stats.map((s, i) => (
                    <StatCard
                      key={s.id}
                      label={s.label}
                      value={s.value}
                      change={s.change}
                      trend={[...s.trend]}
                      icon={statIcons[s.id]}
                      index={i}
                    />
                  ))}
                </div>

                <SalesReport />

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                  <Transactions />
                  <TopSeller />
                </div>
              </div>
            ) : (
              <div className="grid min-h-[60vh] place-items-center text-center animate-in fade-in duration-500">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.2em] text-zinc-400">{section}</p>
                  <p className="mt-3 text-2xl font-semibold">This section is next</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    The Overview is built; {section.toLowerCase()} comes in the next pass.
                  </p>
                  <button
                    onClick={() => setSection("Overview")}
                    className="mt-6 h-10 rounded-xl bg-zinc-900 px-4 text-[13px] text-white"
                  >
                    Back to Overview
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <CommandMenu open={palette} onOpenChange={setPalette} onGo={select} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-2xl !border-zinc-200/80 !bg-white/90 !backdrop-blur-xl !shadow-[0_20px_50px_-20px_rgb(15_23_42/0.35)] !font-sans",
            title: "!text-[13px] !font-semibold !text-zinc-900",
            description: "!text-[12px] !text-zinc-500",
          },
        }}
      />
    </div>
  );
}
