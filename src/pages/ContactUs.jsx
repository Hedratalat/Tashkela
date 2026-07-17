import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { z } from "zod";

import Navbar from "../components/Navbar/Navbar";

const contactSchema = z.object({
  fullName: z
    .string()
    .min(3, "Please enter a valid name.")
    .max(50, "Please enter a valid name.")
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, "Name should only contain letters"),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        return /^[a-zA-Z][a-zA-Z0-9._%+-]*@gmail\.(com|net|org)(\.eg)?$/.test(
          lowerVal,
        );
      },
      { message: "Email must be a valid Gmail address" },
    ),
  phone: z
    .string()
    .regex(/^(\+2)?01[0125][0-9]{8}$/, "Phone must be a valid Egyptian number"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be less than 500 characters"),
});

// Decorative barcode strip for the "shipping label" info card.
function Barcode() {
  const bars = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 1, 2];
  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map((w, i) => (
        <div
          key={i}
          className="bg-primary"
          style={{ width: `${w}px`, height: i % 5 === 0 ? "100%" : "70%" }}
        />
      ))}
    </div>
  );
}

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

  // Same fadeUp pattern used on AboutUs
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
  };

  const checklistContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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

  const infoRows = [
    { icon: MapPin, label: "Location", value: "Cairo, Egypt" },
    { icon: Phone, label: "Phone", value: "010 2753 9203" },
    { icon: Mail, label: "Email", value: "support@teamstore.egy" },
    { icon: Clock, label: "Hours", value: "Sat – Thu, 10am – 9pm" },
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
      // TODO: replace with your real submission call (Firebase, REST API, etc.)
      // Example:
      // await addDoc(collection(db, "ContactMessages"), {
      //   ...result.data,
      //   createdAt: new Date().toISOString(),
      // });
      await new Promise((resolve) => setTimeout(resolve, 900));

      setStatus("success");
      setFormData({ fullName: "", email: "", phone: "", message: "" });
    } catch (err) {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background font-sans">
        {/* ---------- Header ---------- */}
        <section className="bg-background py-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.p
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="text-sm font-semibold text-accent mb-4"
            >
              Contact
            </motion.p>

            <motion.h2
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary leading-[1.08]"
            >
              Every Step Starts with a Conversation.
            </motion.h2>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="mt-6 text-base md:text-lg text-grayText leading-relaxed max-w-xl mx-auto"
            >
              Sizing questions, order help, or just want to talk sneakers — send
              us a message and we'll get back to you.
            </motion.p>
          </div>
        </section>

        {/* ---------- Content ---------- */}
        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <motion.form
              onSubmit={handleSend}
              noValidate
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="order-2 md:order-1 bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8 space-y-5"
            >
              {status === "success" && (
                <div className="rounded-xl border border-success/30 bg-success/10 text-success text-sm font-medium px-4 py-3">
                  Message sent — we'll get back to you shortly.
                </div>
              )}
              {status === "error" && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm font-medium px-4 py-3">
                  Something went wrong. Please try again.
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Your name"
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
                  Email Address
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

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Phone Number
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

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Message
                </label>
                <textarea
                  rows={5}
                  name="message"
                  placeholder="Tell us what you need..."
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
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`w-full bg-primary text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 hover:bg-primary-hover ${
                  isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </motion.button>
            </motion.form>

            {/* Info panel — shipping-label styled, ties into the sneaker/packaging theme */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="order-1 md:order-2 relative bg-surface border-2 border-dashed border-border rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-8">
                  <span className="italic font-bold text-2xl text-primary tracking-tight">
                    TS.
                  </span>
                  <Barcode />
                </div>

                <p className="text-xs font-semibold tracking-[0.2em] text-grayText uppercase mb-6">
                  Shipping To — Team Store HQ
                </p>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={checklistContainer}
                  className="space-y-5"
                >
                  {infoRows.map(({ icon: Icon, label, value }) => (
                    <motion.div
                      key={label}
                      variants={checklistItem}
                      className="flex gap-3"
                    >
                      <Icon size={18} className="text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-grayText">
                          {label}
                        </p>
                        <p className="text-primary font-medium">{value}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex gap-3">
                {[
                  { Icon: FaFacebookF, href: "#", label: "Facebook" },
                  {
                    Icon: FaInstagram,
                    href: "https://www.instagram.com/teamstore.egy/",
                    label: "Instagram",
                  },
                  { Icon: FaTiktok, href: "#", label: "TikTok" },
                  { Icon: FaWhatsapp, href: "#", label: "WhatsApp" },
                ].map(({ Icon, href, label }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-2.5 rounded-full border border-border text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                  >
                    <Icon size={15} />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
