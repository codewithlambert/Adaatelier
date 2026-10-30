import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Customizer } from "@/components/site/Customizer";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/customize")({
  head: () => ({
    meta: [
      { title: "Customize — Ada Atelier" },
      { name: "description", content: "Choose your bag type and colour, then add your monogram." },
    ],
  }),
  component: CustomizePage,
});

const steps = [
  ["01", "Choose a shape", "Five silhouettes, from a chain flap bag to an everyday backpack."],
  ["02", "Pick a colour", "Six colourways, from Onyx to Cognac, tinted to order."],
  ["03", "Add your mark", "Up to three initials, set by hand on the front panel."],
];

function CustomizePage() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  return (
    <div ref={root}>
      <section className="bg-surface pb-24 pt-28 md:pb-36 md:pt-40">
        <Customizer heading="h1" />
      </section>
      <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-24 sm:grid-cols-3 sm:px-8 md:py-32 lg:px-12">
        {steps.map(([n, t, d]) => (
          <div key={n} data-fade className="border-t pt-8">
            <span className="text-[11px] text-muted-foreground">{n}</span>
            <h2 className="headline mt-3 text-3xl">{t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
