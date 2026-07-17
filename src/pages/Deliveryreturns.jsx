import { motion } from "framer-motion";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Ruler,
  MessageCircle,
} from "lucide-react";
import Navbar from "../components/Navbar/Navbar";

export default function DeliveryReturns() {
  const items = [
    {
      icon: Truck,
      title: "Delivery",
      points: [
        "Delivery to all governorates within 2–4 business days",
        "Free shipping on orders over EGP 1,500",
        "Cash on delivery available everywhere",
      ],
    },
    {
      icon: RotateCcw,
      title: "Returns & Exchanges",
      points: [
        "Wrong size? Exchange within 3 days of delivery",
        "Item must be unworn, in original box with tags",
        "Free size exchange — we cover the return shipping",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Warranty",
      points: [
        "6-month warranty against manufacturing defects",
        "100% original products, or your money back",
        "Quality checked before it leaves our warehouse",
      ],
    },
    {
      icon: CreditCard,
      title: "Payment",
      points: [
        "Cash on delivery",
        "Visa / Mastercard accepted online",
        "Mobile wallets supported",
      ],
    },
    {
      icon: Ruler,
      title: "Size Guide",
      points: [
        "Not sure about your size? Check our size chart",
        "Message us your usual size for a recommendation",
        "Half sizes available on select models",
      ],
    },
    {
      icon: MessageCircle,
      title: "Need Help?",
      points: [
        "Our team replies within the hour on WhatsApp",
        "Order tracking sent straight to your phone",
        "Real people, real answers — no bots",
      ],
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: i * 0.08,
        ease: "easeOut",
      },
    }),
    hover: {
      y: -6,
      scale: 1.02,
      boxShadow: "0 12px 30px -10px rgba(0,0,0,0.15)",
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  const iconVariants = {
    hover: {
      rotate: 8,
      scale: 1.1,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.12,
        ease: "easeOut",
      },
    }),
  };

  return (
    <>
      <Navbar />
      <section id="delivery" className="bg-background py-12 ">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-14">
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              variants={headingVariants}
              className="text-sm font-semibold text-accent mb-3"
            >
              Delivery & Returns
            </motion.p>

            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary leading-[1.1] overflow-hidden">
              <motion.span
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={1}
                variants={headingVariants}
                className="block"
              >
                Shop with confidence,
              </motion.span>
              <motion.span
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={2}
                variants={headingVariants}
                className="block"
              >
                <span className="italic text-accent">every</span> time.
              </motion.span>
            </h2>

            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={3}
              variants={headingVariants}
              className="mt-5 text-base text-grayText leading-relaxed"
            >
              From the moment you order to the moment it's on your feet — here's
              exactly what to expect.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(({ icon: Icon, title, points }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover="hover"
                variants={cardVariants}
                className="bg-surface border border-border rounded-2xl p-7 hover:border-accent/40 transition-colors"
              >
                <motion.div
                  variants={iconVariants}
                  className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5"
                >
                  <Icon size={22} className="text-accent" />
                </motion.div>
                <h3 className="text-lg font-bold text-primary mb-3">{title}</h3>
                <ul className="space-y-2">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="text-sm text-grayText leading-relaxed flex gap-2"
                    >
                      <span className="text-accent mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
