/** Bag silhouette with an "A" cut out of the body: the Ada Atelier mark. */
export const LOGO_MARK_PATH =
  "M5.5 13H26.5L28.5 29H3.5ZM16 15.8L21.6 26.6H19.2L18.1 24.3H13.9L12.8 26.6H10.4ZM16 19.6L14.8 22.4H17.2Z";

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="currentColor">
      <path d="M11 13V10.5a5 5 0 0 1 10 0V13" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d={LOGO_MARK_PATH} fillRule="evenodd" />
    </svg>
  );
}

export function Logo({ className = "", mark = true }: { className?: string; mark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark && <LogoMark className="h-[1.35em] w-[1.35em] -translate-y-[0.06em]" />}
      <span className="headline whitespace-nowrap leading-none tracking-[0.28em]">ADA ATELIER</span>
    </span>
  );
}
