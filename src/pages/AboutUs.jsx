import { useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, Clock, Tag, Users, Package } from "lucide-react";

import Navbar from "../components/Navbar/Navbar";

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
  };

  const cardsContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const cardItem = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const whyUsCards = [
    {
      icon: Truck,
      title: "شحن لكل مصر",
      desc: "بنوصل طلبك لباب البيت في أي محافظة، بمتابعة كاملة من أول ما تطلب لحد ما يوصلك.",
    },
    {
      icon: ShieldCheck,
      title: "منتجات موثوقة",
      desc: "بنختار كل منتج بعناية من موردين موثوقين قبل ما يوصلك، عشان تستلم اللي شفته بالظبط.",
    },
    {
      icon: Clock,
      title: "دعم سريع",
      desc: "فريقنا موجود يرد على استفساراتك ويحل أي مشكلة في أسرع وقت ممكن.",
    },
    {
      icon: Tag,
      title: "أسعار مناسبة",
      desc: "بنجيبلك كل اللي محتاجه بأفضل سعر، من غير ما تضحي بالجودة.",
    },
  ];

  const stats = [
    { icon: Users, value: "+1000", label: "عميل راضي" },
    { icon: Package, value: "+200", label: "منتج متنوع" },
    { icon: Truck, value: "27", label: "محافظة بنوصلها" },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-surface font-sans">
        {/* ---------- Header ---------- */}
        <section className="bg-surface py-4 md:py-10">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.3,
                margin: "0px 0px -120px 0px",
              }}
              custom={0}
              variants={fadeUp}
              className="text-sm font-semibold text-accent mb-4"
            >
              من نحن
            </motion.p>

            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.3,
                margin: "0px 0px -120px 0px",
              }}
              custom={1}
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-[1.15]"
            >
              كل اللي محتاجه، في مكان واحد.
            </motion.h2>

            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.3,
                margin: "0px 0px -120px 0px",
              }}
              custom={2}
              variants={fadeUp}
              className="mt-6 text-base md:text-lg text-grayText leading-relaxed max-w-xl mx-auto"
            >
              تشكيلة منصة تسوق إلكتروني بتجمعلك أفضل المنتجات من مصادر موثوقة،
              وتوصلها لباب بيتك بسهولة وأمان — من غير ما تدور كتير أو تقلق على
              الجودة.
            </motion.p>
          </div>
        </section>

        {/* ---------- Stats row ---------- */}
        <section className="px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3, margin: "0px 0px -120px 0px" }}
            variants={cardsContainer}
            className="max-w-4xl mx-auto grid grid-cols-3 gap-4 mb-14"
          >
            {stats.map(({ icon: Icon, value, label }) => (
              <motion.div
                key={label}
                variants={cardItem}
                className="bg-surface border border-border rounded-2xl p-5 flex flex-col items-center text-center gap-2 hover:border-accent hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent">
                  <Icon size={18} />
                </div>
                <p className="font-extrabold text-primary text-xl">{value}</p>
                <p className="text-grayText text-xs">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ---------- Story ---------- */}
        <section className="px-4 mb-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3, margin: "0px 0px -120px 0px" }}
            variants={cardsContainer}
            className="max-w-3xl mx-auto bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-10 text-center"
          >
            <motion.h3
              variants={cardItem}
              className="text-2xl md:text-3xl font-extrabold text-primary mb-4"
            >
              قصتنا
            </motion.h3>
            <motion.p
              variants={cardItem}
              className="text-grayText text-sm md:text-base leading-relaxed"
            >
              بدأنا "تشكيلة" بفكرة بسيطة: ليه العميل يتعب في الدور على منتجات من
              مواقع مختلفة، ويقلق من الجودة أو التأخير؟ جمعنالك كل حاجة محتاجها
              في مكان واحد، واخترنا الموردين بعناية عشان تستلم منتج يستاهل ثقتك.
              رحلتنا لسه في البداية، وهدفنا إننا نبقى وجهتك الأولى للتسوق
              الإلكتروني في مصر.
            </motion.p>
          </motion.div>
        </section>

        {/* ---------- Why us ---------- */}
        <section className="px-4 pb-20">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3, margin: "0px 0px -120px 0px" }}
            custom={0}
            variants={fadeUp}
            className="text-center text-sm font-semibold text-accent mb-2"
          >
            ليه تختار تشكيلة
          </motion.p>

          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3, margin: "0px 0px -120px 0px" }}
            custom={1}
            variants={fadeUp}
            className="text-center text-2xl md:text-3xl font-extrabold text-primary mb-10"
          >
            تجربة تسوق مختلفة
          </motion.h3>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2, margin: "0px 0px -40px 0px" }}
            variants={cardsContainer}
            className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {whyUsCards.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={cardItem}
                className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-accent hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-bold text-primary text-sm mb-1">{title}</p>
                  <p className="text-grayText text-sm leading-snug">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
    </>
  );
}
