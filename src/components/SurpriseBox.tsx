import { Link } from "@tanstack/react-router";
import { Shuffle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ExtrudedBag } from "@/components/site/BagViewer3D";
import { LogoMark } from "@/components/site/Logo";
import { bagColors, colorName, modelled as products, money, type ColorId } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { flyToBag, loadGsap, prefersReducedMotion } from "@/lib/motion";

// Box, lid and bag dimensions in px (the whole stage is scaled down on small screens)
const W = 300;
const H = 150;
const D = 220;
const LW = W + 12;
const LD = D + 12;
const LH = 36;
const LIFT = 6;
const BAG_H = 300;

const paper = "linear-gradient(180deg, #fbfbfb, #ededed)";
const edge = "inset 0 0 0 1px rgb(0 0 0 / 0.05)";

function Face({
  w,
  h,
  t,
  bg,
  children,
}: {
  w: number;
  h: number;
  t: string;
  bg: string;
  children?: ReactNode;
}) {
  const style: CSSProperties = {
    width: w,
    height: h,
    transform: t,
    background: bg,
    boxShadow: edge,
  };
  return (
    <div className="face grid place-items-center" style={style}>
      {children}
    </div>
  );
}

/** Pinned scroll scene: a CSS 3D box turns, its lid swings open and an extruded bag rises out and spins. */
export function SurpriseBox() {
  const section = useRef<HTMLElement>(null);
  const bagSpin = useRef<HTMLDivElement>(null);
  const { add } = useCart();
  // Fixed first pick so server and client HTML match; the real draw happens after mount.
  const [pick, setPick] = useState<{ i: number; color: ColorId }>({ i: 2, color: "onyx" });
  const p = products[pick.i] ?? products[0]!;

  const draw = (avoid?: { i: number; color: ColorId }) => {
    let next: { i: number; color: ColorId };
    do {
      next = {
        i: Math.floor(Math.random() * products.length),
        color: bagColors[Math.floor(Math.random() * bagColors.length)]!.id,
      };
    } while (avoid && next.i === avoid.i && next.color === avoid.color);
    return next;
  };

  useEffect(() => setPick(draw()), []);

  const unboxAnother = () => {
    setPick((cur) => draw(cur));
    if (prefersReducedMotion()) return;
    void loadGsap().then(({ gsap }) =>
      gsap.fromTo(
        bagSpin.current,
        { rotationY: -200, scale: 0.75 },
        { rotationY: 0, scale: 1, duration: 1.1, ease: "expo.out" },
      ),
    );
  };

  const addToBag = () => {
    add(
      {
        id: `${p.slug}-${pick.color}`,
        productId: p.slug,
        name: p.name,
        price: p.price,
        img: p.img,
        mask: p.mask,
        color: pick.color,
        note: `${p.cat} · ${colorName(pick.color)}`,
      },
      1,
      false,
    );
    void flyToBag(section.current?.querySelector("[data-sb-bag] img"));
  };

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    loadGsap().then(({ gsap }) => {
      if (cancelled || !section.current) return;
      ctx = gsap.context(() => {
        gsap.set("[data-sb-lid]", { y: -H, z: -D / 2 });
        gsap.set("[data-sb-spin]", { rotationY: -38 });
        if (prefersReducedMotion()) {
          // static end state: open box with the bag standing beside it
          gsap.set("[data-sb-lid]", { rotationX: 118 });
          gsap.set("[data-sb-bag]", { y: -(H + 40) });
          gsap.set("[data-sb-caption]", { autoAlpha: 1 });
          return;
        }
        gsap.set("[data-sb-bag]", { y: -6, scale: 0.4, opacity: 0 });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section.current,
              start: "top top",
              end: "+=2400",
              scrub: 1,
              pin: true,
            },
          })
          .from("[data-sb-title]", { y: 40, opacity: 0, duration: 0.4 })
          .to("[data-sb-spin]", { rotationY: 22, duration: 4, ease: "none" }, 0)
          .to("[data-sb-lid]", { rotationX: 118, duration: 1, ease: "power2.inOut" }, 0.4)
          .to("[data-sb-glow]", { opacity: 1, duration: 0.6 }, 0.9)
          .to("[data-sb-bag]", { opacity: 1, scale: 0.55, duration: 0.3 }, 1)
          .to("[data-sb-bag]", { y: -(H + 40), scale: 1, duration: 1.2, ease: "power3.out" }, 1.2)
          .to("[data-sb-title]", { y: -40, opacity: 0, duration: 0.5 }, 1.3)
          .to("[data-sb-bag]", { rotationY: 360, duration: 1.4, ease: "power1.inOut" }, 2.2)
          .to("[data-sb-caption]", { autoAlpha: 1, y: -10, duration: 0.5 }, 3);
      }, section);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={section}
      data-sb-section
      className="relative h-[100svh] overflow-hidden bg-surface"
    >
      <div className="absolute inset-x-0 top-24 z-30 text-center sm:top-28">
        <span className="eyebrow">The Surprise Box</span>
        <h2 data-sb-title className="headline mt-4 px-5 text-5xl sm:text-7xl">
          Scroll to <em>unbox</em> yours
        </h2>
      </div>

      <div
        data-sb-glow
        className="pointer-events-none absolute left-1/2 top-[55%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-card),transparent)] opacity-0"
      />

      {/* 3D stage: the 1px origin sits at the centre of the box's base */}
      <div className="absolute left-1/2 top-[74%] scale-[0.66] sm:top-[76%] sm:scale-90 lg:scale-100">
        <div
          className="relative h-px w-px"
          style={{ perspective: "1400px", perspectiveOrigin: "50% -40%" }}
        >
          <div
            className="preserve-3d absolute left-0 top-0"
            style={{ transform: "rotateX(-24deg)" }}
          >
            <div data-sb-spin className="preserve-3d absolute left-0 top-0">
              {/* floor shadow */}
              <div
                className="face"
                style={{
                  width: W + 160,
                  height: D + 160,
                  transform: `translate3d(${-(W + 160) / 2}px, ${-(D + 160) / 2 + 1}px, 0) rotateX(90deg)`,
                  background: "radial-gradient(closest-side, rgb(0 0 0 / 0.28), transparent)",
                  filter: "blur(10px)",
                }}
              />

              {/* box body: outer walls */}
              <Face w={W} h={H} t={`translate3d(${-W / 2}px, ${-H}px, ${D / 2}px)`} bg={paper}>
                <span className="flex flex-col items-center gap-2 text-[#141414]">
                  <LogoMark className="h-7 w-7" />
                  <span className="headline text-lg tracking-[0.3em]">ADA ATELIER</span>
                </span>
              </Face>
              <Face
                w={W}
                h={H}
                t={`translate3d(${-W / 2}px, ${-H}px, ${-D / 2}px) rotateY(180deg)`}
                bg="#e6e6e6"
              />
              <Face
                w={D}
                h={H}
                t={`translate3d(${-W / 2 - D / 2}px, ${-H}px, 0) rotateY(-90deg)`}
                bg="#ececec"
              />
              <Face
                w={D}
                h={H}
                t={`translate3d(${W / 2 - D / 2}px, ${-H}px, 0) rotateY(90deg)`}
                bg="#e0e0e0"
              />
              <Face
                w={W}
                h={D}
                t={`translate3d(${-W / 2}px, ${-D / 2}px, 0) rotateX(90deg)`}
                bg="#d8d8d8"
              />
              {/* liners and tissue, a hair inside the walls so the interior reads darker */}
              <Face
                w={W}
                h={H}
                t={`translate3d(${-W / 2}px, ${-H}px, ${D / 2 - 1.5}px)`}
                bg="#cfcfcf"
              />
              <Face
                w={W}
                h={H}
                t={`translate3d(${-W / 2}px, ${-H}px, ${-D / 2 + 1.5}px)`}
                bg="#c6c6c6"
              />
              <Face
                w={D}
                h={H}
                t={`translate3d(${-W / 2 - D / 2 + 1.5}px, ${-H}px, 0) rotateY(-90deg)`}
                bg="#cbcbcb"
              />
              <Face
                w={D}
                h={H}
                t={`translate3d(${W / 2 - D / 2 - 1.5}px, ${-H}px, 0) rotateY(90deg)`}
                bg="#c9c9c9"
              />
              <Face
                w={W - 4}
                h={D - 4}
                t={`translate3d(${-(W - 4) / 2}px, ${-(D - 4) / 2 - 1.5}px, 0) rotateX(90deg)`}
                bg="linear-gradient(135deg, #242424, #111)"
              />

              {/* lid, hinged along the back top edge */}
              <div data-sb-lid className="preserve-3d absolute left-0 top-0">
                <Face
                  w={LW}
                  h={LD}
                  t={`translate3d(${-LW / 2}px, ${-LIFT - LD / 2}px, ${LD / 2 - 6}px) rotateX(90deg)`}
                  bg="#fdfdfd"
                >
                  <span className="flex flex-col items-center gap-2 text-[#141414]">
                    <LogoMark className="h-9 w-9" />
                    <span className="headline text-base tracking-[0.3em]">ADA ATELIER</span>
                  </span>
                </Face>
                <Face
                  w={LW}
                  h={LD}
                  t={`translate3d(${-LW / 2}px, ${-LIFT + 1.5 - LD / 2}px, ${LD / 2 - 6}px) rotateX(90deg)`}
                  bg="#d4d4d4"
                />
                <Face
                  w={LW}
                  h={LH}
                  t={`translate3d(${-LW / 2}px, ${-LIFT}px, ${LD - 6}px)`}
                  bg="#f1f1f1"
                />
                <Face
                  w={LW}
                  h={LH}
                  t={`translate3d(${-LW / 2}px, ${-LIFT}px, -6px) rotateY(180deg)`}
                  bg="#e4e4e4"
                />
                <Face
                  w={LD}
                  h={LH}
                  t={`translate3d(${-LW / 2 - LD / 2}px, ${-LIFT}px, ${LD / 2 - 6}px) rotateY(-90deg)`}
                  bg="#e8e8e8"
                />
                <Face
                  w={LD}
                  h={LH}
                  t={`translate3d(${LW / 2 - LD / 2}px, ${-LIFT}px, ${LD / 2 - 6}px) rotateY(90deg)`}
                  bg="#dedede"
                />
              </div>

              {/* bag: a random pick, stacked in depth so it has real thickness as it turns */}
              <div data-sb-bag className="preserve-3d absolute left-0 top-0">
                <div ref={bagSpin} className="preserve-3d absolute left-0 top-0">
                  <ExtrudedBag
                    key={`${p.slug}-${pick.color}`}
                    model={p.model}
                    color={pick.color}
                    h={BAG_H}
                    anchor="bottom"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        data-sb-caption
        aria-live="polite"
        className="invisible absolute inset-x-0 bottom-28 z-30 flex flex-col items-center gap-4 px-5 text-center opacity-0 md:bottom-10"
      >
        <div>
          <p className="eyebrow">You unboxed</p>
          <p className="mt-2">
            <Link
              to="/product/$slug"
              params={{ slug: p.slug }}
              search={pick.color === "onyx" ? {} : { color: pick.color }}
              className="headline link-line text-3xl md:text-4xl"
            >
              {p.name}
            </Link>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {colorName(pick.color)} · <span className="tabular-nums">{money(p.price)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button data-magnetic onClick={addToBag} className="btn">
            Add to bag
          </button>
          <button onClick={unboxAnother} className="btn btn-outline">
            <Shuffle className="h-3.5 w-3.5" /> Unbox another
          </button>
        </div>
      </div>
    </section>
  );
}
