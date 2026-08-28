import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Share2 } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { z } from "zod";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar/Navbar";

const contactSchema = z.object({
  fullName: z
    .string()
    .min(3, "من فضلك أدخل اسم صحيح.")
    .max(50, "من فضلك أدخل اسم صحيح.")
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, "الاسم لازم يحتوي على حروف فقط"),
  email: z
    .string()
    .email("من فضلك أدخل بريد إلكتروني صحيح.")
    .refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        return /^[a-zA-Z][a-zA-Z0-9._%+-]*@gmail\.(com|net|org)(\.eg)?$/.test(
          lowerVal,
        );
      },
      { message: "لازم يكون بريد Gmail صحيح" },
    ),
  phone: z
    .string()
    .regex(/^(\+2)?01[0125][0-9]{8}$/, "رقم الهاتف لازم يكون رقم مصري صحيح"),
  message: z
    .string()
    .min(10, "الرسالة لازم تكون 10 حروف على الأقل")
    .max(500, "الرسالة لازم تكون أقل من 500 حرف"),
});

const socialLinks = [
  { Icon: FaFacebookF, href: "#", label: "Facebook" },
  {
    Icon: FaInstagram,
    href: "https://www.instagram.com/",
    label: "Instagram",
  },
  { Icon: FaTiktok, href: "#", label: "TikTok" },
  { Icon: FaWhatsapp, href: "#", label: "WhatsApp" },
];

export default function ContactUs() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null

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

  const infoContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const infoItem = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const infoCards = [
    {
      icon: Mail,
      label: "البريد الإلكتروني",
      value: "hedratalat1717@gmail.com",
      href: "mailto:hedratalat1717@gmail.com",
    },
    {
      icon: MapPin,
      label: "الموقع",
      value: "القاهرة، مصر",
    },
    {
      icon: Phone,
      label: "رقم الهاتف",
      value: "01234567890",
      href: "tel:01234567890",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (status) setStatus(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setErrors({});
    setStatus(null);
    setIsSubmitting(true);

    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, "Messages"), {
        fullName: result.data.fullName,
        email: result.data.email,
        phone: result.data.phone,
        message: result.data.message,
        createdAt: serverTimestamp(),
      });

      setStatus("success");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              تواصل معنا
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
              محتاج تتواصل معانا؟ إحنا في الخدمة.
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
              استفسار عن طلبك، تفاصيل شحن، أو سؤال عن أي منتج — ابعتلنا رسالتك
              وهنرد عليك بسرعة.
            </motion.p>
          </div>
        </section>

        {/* ---------- Info row ---------- */}
        <section className="px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3, margin: "0px 0px -120px 0px" }}
            variants={infoContainer}
            className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            {infoCards.map(({ icon: Icon, label, value, href }) => (
              <motion.div
                key={label}
                variants={infoItem}
                className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-accent hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent">
                  <Icon size={18} />
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-primary text-sm mb-0.5">
                    {label}
                  </p>

                  {href ? (
                    <a
                      href={href}
                      className="text-grayText text-sm leading-snug break-words hover:text-accent transition-colors"
                    >
                      {label === "البريد الإلكتروني" ? (
                        <>
                          <span className="sm:hidden">
                            hedratalat1717@
                            <br />
                            gmail.com
                          </span>

                          <span className="hidden sm:inline">{value}</span>
                        </>
                      ) : (
                        value
                      )}
                    </a>
                  ) : (
                    <p className="text-grayText text-sm leading-snug break-words">
                      {value}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Follow us card — social links live here */}
            <motion.div
              variants={infoItem}
              className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-accent hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent">
                <Share2 size={18} />
              </div>
              <div>
                <p className="font-bold text-primary text-sm mb-2">تابعنا</p>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {socialLinks.map(({ Icon, href, label }) => (
                    <motion.a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-8 h-8 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-colors duration-200"
                    >
                      <Icon size={13} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ---------- Form ---------- */}
        <section className="px-4 pb-20">
          <motion.form
            onSubmit={handleSend}
            noValidate
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-5xl mx-auto bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-10 space-y-5"
          >
            {status === "success" && (
              <div className="rounded-xl border border-success/30 bg-success/10 text-success text-sm font-medium px-4 py-3">
                تم إرسال رسالتك بنجاح — هنرد عليك في أقرب وقت.
              </div>
            )}
            {status === "error" && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm font-medium px-4 py-3">
                حصل خطأ أثناء الإرسال، حاول تاني.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  الاسم بالكامل
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="اكتب اسمك"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-primary placeholder:text-grayText/70 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                    errors.fullName ? "border-danger" : "border-border"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-danger text-xs mt-1.5">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-primary placeholder:text-grayText/70 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                    errors.email ? "border-danger" : "border-border"
                  }`}
                />
                {errors.email && (
                  <p className="text-danger text-xs mt-1.5">{errors.email}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-primary mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-primary placeholder:text-grayText/70 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                    errors.phone ? "border-danger" : "border-border"
                  }`}
                />
                {errors.phone && (
                  <p className="text-danger text-xs mt-1.5">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                رسالتك
              </label>
              <textarea
                rows={5}
                name="message"
                placeholder="اكتب استفسارك عن الدروب شيبينج أو أي سؤال تاني..."
                value={formData.message}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border bg-background text-primary placeholder:text-grayText/70 outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                  errors.message ? "border-danger" : "border-border"
                }`}
              />
              {errors.message && (
                <p className="text-danger text-xs mt-1.5">{errors.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`w-full bg-accent text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 hover:bg-accent-hover ${
                isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
            </motion.button>
          </motion.form>
        </section>
      </main>
    </>
  );
}
