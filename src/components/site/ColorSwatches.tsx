import { bagColors, type ColorId } from "@/lib/catalog";

type Props = {
  value: ColorId;
  onChange: (c: ColorId) => void;
  size?: "sm" | "lg";
  className?: string;
};

export function ColorSwatches({ value, onChange, size = "sm", className = "" }: Props) {
  const dot = size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5";
  const hit = size === "lg" ? "h-9 w-9" : "h-6 w-6";
  return (
    <div role="radiogroup" aria-label="Colour" className={`flex flex-wrap gap-1.5 ${className}`}>
      {bagColors.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          aria-label={c.name}
          title={c.name}
          onClick={() => onChange(c.id)}
          className={`grid ${hit} place-items-center rounded-full transition-shadow duration-500 ${
            value === c.id ? "ring-1 ring-foreground" : "hover:ring-1 hover:ring-foreground/30"
          }`}
        >
          <span
            className={`${dot} rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]`}
            style={{ background: c.hex }}
          />
        </button>
      ))}
    </div>
  );
}
