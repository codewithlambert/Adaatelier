import {
  BadgePercent,
  BarChart3,
  ChevronLeft,
  Instagram,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Plus,
  ShoppingCart,
  Store,
  Tag,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/site/Logo";

export type Section =
  | "Overview"
  | "Orders"
  | "Products"
  | "Customers"
  | "Analytics"
  | "Marketing"
  | "Discount"
  | "Online store"
  | "Point of sale";

const main: { label: Section; icon: LucideIcon; badge?: number }[] = [
  { label: "Overview", icon: LayoutGrid },
  { label: "Orders", icon: ShoppingCart, badge: 10 },
  { label: "Products", icon: Tag },
  { label: "Customers", icon: User },
  { label: "Analytics", icon: BarChart3 },
  { label: "Marketing", icon: Megaphone },
  { label: "Discount", icon: BadgePercent },
];
const channels: { label: Section; icon: LucideIcon }[] = [
  { label: "Online store", icon: Store },
  { label: "Point of sale", icon: Wallet },
];
const apps = [
  {
    label: "Instagram",
    icon: Instagram,
    tile: "bg-gradient-to-br from-[#f9a03f] via-[#e1306c] to-[#833ab4]",
  },
  { label: "WhatsApp", icon: MessageCircle, tile: "bg-[#25d366]" },
  { label: "Jumia", icon: ShoppingCart, tile: "bg-[#f68b1e]" },
];

type Props = {
  active: Section;
  onSelect: (s: Section) => void;
  collapsed: boolean;
  onToggle: () => void;
};

function Group({ title, collapsed }: { title: string; collapsed: boolean }) {
  return (
    <p className={`mb-2 mt-7 px-3 text-[12px] text-zinc-400 ${collapsed ? "sr-only" : ""}`}>
      {title}
    </p>
  );
}

export function Sidebar({ active, onSelect, collapsed, onToggle }: Props) {
  const item = (on: boolean) =>
    `relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13.5px] transition-colors ${
      on
        ? "bg-zinc-200/70 font-medium text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900"
    } ${collapsed ? "justify-center px-0" : ""}`;

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-zinc-200/70 bg-[#f7f7f8] px-3 pb-6 pt-6 transition-[width] duration-300 ${
        collapsed ? "w-[76px]" : "w-[248px]"
      }`}
    >
      <div className={`flex items-center gap-2.5 px-3 ${collapsed ? "justify-center px-0" : ""}`}>
        <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-white">
          <LogoMark className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#f7f7f8] bg-sky-400" />
        </span>
        {!collapsed && (
          <span className="text-[17px] font-semibold tracking-tight text-zinc-900">
            Ada Atelier
          </span>
        )}
      </div>

      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3.5 top-[68px] z-10 hidden h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-transform hover:scale-105 lg:grid"
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>

      <nav className="mt-3 flex-1 overflow-y-auto [scrollbar-width:none]">
        <Group title="Main Menu" collapsed={collapsed} />
        <ul className="space-y-1">
          {main.map(({ label, icon: Icon, badge }) => (
            <li key={label}>
              <button
                onClick={() => onSelect(label)}
                className={item(active === label)}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="flex-1 text-left">{label}</span>}
                {badge !== undefined && (
                  <span
                    className={`grid h-5 min-w-5 place-items-center rounded-full bg-rose-400 px-1.5 text-[11px] font-medium text-white ${
                      collapsed ? "absolute right-1.5 top-1 h-4 min-w-4 text-[9px]" : ""
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <Group title="Sales Channel" collapsed={collapsed} />
        <ul className="space-y-1">
          {channels.map(({ label, icon: Icon }) => (
            <li key={label}>
              <button
                onClick={() => onSelect(label)}
                className={item(active === label)}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                {!collapsed && <span>{label}</span>}
              </button>
            </li>
          ))}
        </ul>

        <Group title="Apps" collapsed={collapsed} />
        <ul className="space-y-1">
          {apps.map(({ label, icon: Icon, tile }) => (
            <li key={label}>
              <div
                className={`${item(false)} cursor-default`}
                title={collapsed ? label : undefined}
              >
                <span
                  className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md text-white ${tile}`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                {!collapsed && <span className="font-medium text-zinc-900">{label}</span>}
              </div>
            </li>
          ))}
          <li>
            <button
              className={`${item(false)} !text-sky-600`}
              title={collapsed ? "Add apps" : undefined}
            >
              <Plus className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {!collapsed && <span className="font-medium">Add apps</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
