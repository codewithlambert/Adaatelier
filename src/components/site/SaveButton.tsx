import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/saved";

/** Heart that saves a bag to the wishlist. */
export function SaveButton({
  slug,
  name,
  className = "",
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      className={`grid place-items-center rounded-full transition-transform duration-300 active:scale-90 ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-[fill,color] duration-300 ${saved ? "fill-current text-[#9b2c2c]" : ""}`}
        strokeWidth={1.6}
      />
    </button>
  );
}
