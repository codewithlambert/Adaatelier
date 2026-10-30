/** Bag silhouette with a heart cut out of the body — LUV + BAG in one mark. */
export const LOGO_MARK_PATH =
  "M5.5 13H26.5L28.5 29H3.5ZM16 25C16 25 11 21.8 11 18.9C11 17.3 12.2 16.2 13.6 16.2C14.6 16.2 15.5 16.8 16 17.7C16.5 16.8 17.4 16.2 18.4 16.2C19.8 16.2 21 17.3 21 18.9C21 21.8 16 25 16 25Z";

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
      <span className="headline leading-none tracking-[0.32em]">LUVBAG</span>
    </span>
  );
}
