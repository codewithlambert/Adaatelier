import { useEffect } from "react";
import { LayoutGrid, Package, Receipt } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { Section } from "@/components/admin/Sidebar";
import { transactions } from "@/lib/admin-data";
import { money, products } from "@/lib/catalog";

const sections: Section[] = [
  "Overview",
  "Orders",
  "Products",
  "Customers",
  "Analytics",
  "Marketing",
  "Discount",
  "Online store",
  "Point of sale",
];

type Props = { open: boolean; onOpenChange: (o: boolean) => void; onGo: (s: Section) => void };

/** Ctrl/⌘K palette: jump to any section, product or recent order. */
export function CommandMenu({ open, onOpenChange, onGo }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (s: Section) => {
    onGo(s);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search sections, products, orders…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Go to">
          {sections.map((s) => (
            <CommandItem key={s} value={`section ${s}`} onSelect={() => go(s)}>
              <LayoutGrid className="mr-2 h-4 w-4 text-zinc-400" />
              {s}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Products">
          {products.map((p) => (
            <CommandItem
              key={p.slug}
              value={`product ${p.name} ${p.cat}`}
              onSelect={() => go("Products")}
            >
              <Package className="mr-2 h-4 w-4 text-zinc-400" />
              {p.name}
              <CommandShortcut>{money(p.price)}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Recent orders">
          {transactions.slice(0, 5).map((t) => (
            <CommandItem key={t.id} value={`order ${t.id} ${t.item}`} onSelect={() => go("Orders")}>
              <Receipt className="mr-2 h-4 w-4 text-zinc-400" />
              {t.id} · {t.item}
              <CommandShortcut>{t.platform}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
