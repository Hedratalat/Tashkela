import { Truck, ShieldCheck, RotateCcw, ArrowUpRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Ambient accent shapes */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 w-[24rem] h-[24rem] rounded-full bg-accent/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pb-28">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left: copy */}
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-primary leading-[1.05]">
              Built for every
              <br />
              <span className="italic text-accent">step</span> you take.
            </h1>

            <p className="mt-6 text-base md:text-lg text-grayText max-w-md leading-relaxed">
              We don't chase trends, we set the standard. Original quality, real
              comfort, and a fit that stays with you long after you walk out the
              door.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#shop"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-surface text-base font-semibold px-7 py-3.5 rounded-lg transition-colors"
              >
                Shop Collection
                <ArrowUpRight size={18} />
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 text-base font-semibold text-primary hover:text-accent px-2 py-3.5 transition-colors"
              >
                Our Story
              </a>
            </div>

            {/* Trust strip */}
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-md">
              <div className="flex flex-col gap-2">
                <Truck size={20} className="text-accent" />
                <span className="text-xs font-medium text-grayText leading-tight">
                  Fast delivery
                  <br />
                  nationwide
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <ShieldCheck size={20} className="text-accent" />
                <span className="text-xs font-medium text-grayText leading-tight">
                  100% original
                  <br />
                  guarantee
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <RotateCcw size={20} className="text-accent" />
                <span className="text-xs font-medium text-grayText leading-tight">
                  Easy size
                  <br />
                  exchange
                </span>
              </div>
            </div>
          </div>

          {/* Right: visual */}
          <div className="relative">
            <div className="relative aspect-square rounded-3xl bg-surface border border-border shadow-sm overflow-hidden flex items-center justify-center">
              {/* Evergreen credibility badge instead of a discount tag */}
              <div className="absolute top-6 right-6 bg-primary text-surface rounded-2xl px-5 py-4 text-center shadow-lg">
                <p className="text-3xl font-extrabold italic leading-none">
                  10K+
                </p>
                <p className="text-[11px] font-semibold tracking-wide text-surface/70 mt-1">
                  PAIRS SOLD
                </p>
              </div>

              {/* Product shot */}
              <img
                src="/public/739155566_1061532349638321_1379548899281659512_n.jpg"
                alt="Featured sneaker"
                className="w-3/4 h-3/4 object-contain rounded-2xl"
              />

              <div className="absolute bottom-6 left-6 bg-surface/90 backdrop-blur border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <p className="text-xs font-semibold text-primary leading-tight">
                  2,000+ happy
                  <br />
                  customers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
