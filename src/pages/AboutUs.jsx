import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import {
  Search,
  Feather,
  HandCoins,
  Users,
  ArrowRight,
  Check,
  Footprints,
  Ruler,
  ScanSearch,
  BadgeCheck,
} from "lucide-react";
import Navbar from "../components/Navbar/Navbar";

// ---------- Animated counter ----------
function Counter({ to, suffix = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, to, { duration: 1.6, ease: "easeOut" });
    return controls.stop;
  }, [isInView, to, count]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export default function AboutUs() {
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
  };

  const checklist = [
    { icon: Footprints, text: "Comfort confirmed, not assumed" },
    { icon: ScanSearch, text: "Stitching and sole checked by hand" },
    { icon: Ruler, text: "True to size — no surprises" },
  ];

  const checklistContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.35, delayChildren: 0.3 },
    },
  };

  const checklistItem = {
    hidden: { opacity: 0, x: -12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const values = [
    {
      icon: Search,
      title: "Carefully Selected",
      desc: "We try on every model ourselves before it makes it to the shelf. If it's not comfortable, it's not in the store.",
    },
    {
      icon: Feather,
      title: "Comfort First",
      desc: "We'd rather stock one great pair than ten mediocre ones. Comfort isn't a feature — it's the filter.",
    },
    {
      icon: HandCoins,
      title: "Honest Pricing",
      desc: "No inflated prices to fake a discount later. What you see is what it's actually worth.",
    },
    {
      icon: Users,
      title: "Built for Egypt",
      desc: "Sizes, styles, and stock picked for how Egyptians actually walk — from Alexandria to Aswan.",
    },
  ];

  const stats = [
    { value: 6, suffix: "+", label: "Years in business" },
    { value: 120, suffix: "K+", label: "Pairs sold" },
    { value: 27, suffix: "", label: "Governorates reached" },
    { value: 4.8, suffix: "/5", label: "Average rating" },
  ];

  const milestones = [
    {
      year: "2019",
      title: "A small shop in Cairo",
      desc: "One rack, a handful of brands, and a simple rule: try it on before it's for sale.",
    },
    {
      year: "2021",
      title: "We went online",
      desc: "The shop became a website. Orders started coming from cities we'd never shipped to.",
    },
    {
      year: "2023",
      title: "Nationwide delivery",
      desc: "Every governorate, 2–4 days, cash on delivery — no exceptions.",
    },
    {
      year: "2025",
      title: "A bigger store, same standards",
      desc: "More brands, more sizes, but every pair is still checked by hand before it ships.",
    },
  ];

  return (
    <>
      <Navbar />

      {/* ---------- Hero ---------- */}
      <section className="bg-background py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.p
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="text-sm font-semibold text-accent mb-4"
          >
            About Us
          </motion.p>

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary leading-[1.08] overflow-hidden">
            <motion.span
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="block"
            >
              We don't make shoes.
            </motion.span>
            <motion.span
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="block"
            >
              We find the ones that{" "}
              <span className="italic text-accent">fit right</span> the first
              time.
            </motion.span>
          </h2>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="mt-6 text-base md:text-lg text-grayText leading-relaxed max-w-xl mx-auto"
          >
            Every pair on our shelves earned its spot — tried on, walked in, and
            approved before it ever reached you.
          </motion.p>
        </div>
      </section>

      {/* ---------- Story / quality-check card ---------- */}
      <section className="bg-background pb-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-primary mb-5">
              Where it started
            </h2>
            <p className="text-grayText leading-relaxed mb-4">
              It began with a return. Our founder sent back three pairs of shoes
              in one month — all beautiful, all unwearable after an hour on his
              feet. So he opened a small shop with one rule: nothing goes on the
              shelf unless someone here has actually worn it.
            </p>
            <p className="text-grayText leading-relaxed">
              Six years later, the shop is bigger and the racks are fuller, but
              the rule hasn't changed:{" "}
              <span className="text-primary font-semibold">
                if it isn't comfortable by hour three, it doesn't make it to the
                store.
              </span>
            </p>
          </motion.div>

          {/* Signature element: a quality-check card that ticks itself off, then gets stamped */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-2xl bg-surface border border-border p-8 h-72 md:h-80 flex flex-col justify-center overflow-hidden">
              <p className="text-xs font-semibold tracking-widest text-grayText uppercase mb-6">
                Before it hits the shelf
              </p>

              <motion.ul
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={checklistContainer}
                className="space-y-5"
              >
                {checklist.map(({ icon: Icon, text }) => (
                  <motion.li
                    key={text}
                    variants={checklistItem}
                    className="flex items-center gap-4"
                  >
                    <span className="w-9 h-9 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                      <Icon size={16} className="text-accent" />
                    </span>
                    <span className="text-sm text-primary font-medium flex-1">
                      {text}
                    </span>
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 1.4,
                        duration: 0.3,
                        type: "spring",
                        stiffness: 300,
                      }}
                      className="w-6 h-6 shrink-0 rounded-full bg-accent flex items-center justify-center"
                    >
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </motion.span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* Rubber-stamp badge, tilted in at the end */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
              whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
              viewport={{ once: true }}
              transition={{
                delay: 1.7,
                duration: 0.5,
                type: "spring",
                stiffness: 260,
                damping: 15,
              }}
              className="absolute -top-5 -right-5 bg-accent text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2"
            >
              <BadgeCheck size={20} />
              <span className="text-sm font-bold tracking-wide">Approved</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Values ---------- */}
      <section className="bg-surface py-20 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="max-w-xl mb-12"
          >
            <p className="text-sm font-semibold text-accent mb-3">
              What we stand for
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-primary">
              Four rules we don't break
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: (i) => ({
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      delay: i * 0.1,
                      ease: "easeOut",
                    },
                  }),
                  hover: {
                    y: -6,
                    boxShadow: "0 12px 30px -10px rgba(0,0,0,0.12)",
                    transition: { type: "spring", stiffness: 300, damping: 20 },
                  },
                }}
                whileHover="hover"
                className="bg-background border border-border rounded-2xl p-6"
              >
                <motion.div
                  variants={{ hover: { rotate: 8, scale: 1.1 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5"
                >
                  <Icon size={20} className="text-accent" />
                </motion.div>
                <h3 className="text-base font-bold text-primary mb-2">
                  {title}
                </h3>
                <p className="text-sm text-grayText leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="bg-primary py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, suffix, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter">
                  <Counter to={value} suffix={suffix} />
                </div>
                <p className="mt-2 text-sm text-white/60">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Timeline ---------- */}
      <section className="bg-background py-20">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="mb-14 text-center"
          >
            <p className="text-sm font-semibold text-accent mb-3">
              How we got here
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-primary">
              Six years, four chapters
            </h2>
          </motion.div>

          <div className="relative pl-10">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-12">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
                  className="relative"
                >
                  <span className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-accent mb-1">
                    {m.year}
                  </p>
                  <h3 className="text-lg font-bold text-primary mb-1">
                    {m.title}
                  </h3>
                  <p className="text-sm text-grayText leading-relaxed">
                    {m.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="bg-surface border-t border-border py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl mx-auto px-6 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-primary mb-4">
            Ready to find your fit?
          </h2>
          <p className="text-grayText mb-8">
            Every pair ships in 2–4 days, anywhere in Egypt.
          </p>
          <motion.a
            href="/shop"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-7 py-3 rounded-xl transition-colors"
          >
            Shop the collection
            <ArrowRight size={18} />
          </motion.a>
        </motion.div>
      </section>
    </>
  );
}
