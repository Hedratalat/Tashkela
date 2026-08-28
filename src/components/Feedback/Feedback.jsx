import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaChevronRight,
  FaChevronLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaQuoteRight,
} from "react-icons/fa";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const feedbackSchema = z.object({
  name: z
    .string()
    .nonempty("من فضلك املأ جميع الحقول")
    .min(3, "الاسم يجب أن يكون 3 أحرف على الأقل")
    .max(30)
    .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, "حروف ومسافات فقط"),
  email: z
    .string()
    .nonempty("من فضلك املأ جميع الحقول")
    .email("بريد إلكتروني غير صالح")
    .refine((val) => val.endsWith("@gmail.com"), {
      message: "بريد إلكتروني غير صالح",
    }),
  message: z
    .string()
    .nonempty("من فضلك املأ جميع الحقول")
    .min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل")
    .max(400),
});

const VISIBLE = 3;
const AUTO_ADVANCE_MS = 4000;
const RESUME_AFTER_CLICK_MS = 6000;

export default function Feedback() {
  const [approvedFeedbacks, setApprovedFeedbacks] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [statusMsg, setStatusMsg] = useState(null);
  const statusRef = useRef(null);
  const autoTimerRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(feedbackSchema),
    mode: "onChange",
  });

  useEffect(() => {
    const q = query(collection(db, "Feedbacks"), where("approved", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setApprovedFeedbacks(all);
    });
    return () => unsubscribe();
  }, []);

  const advance = useCallback(
    (dir = 1) => {
      setStartIndex((prev) => {
        const len = approvedFeedbacks.length;
        if (len === 0) return 0;
        return (prev + dir + len) % len;
      });
    },
    [approvedFeedbacks.length],
  );

  // التبديل التلقائي: بيتحرك خطوة كل AUTO_ADVANCE_MS، طول ما فيه أكتر من 3 آراء
  useEffect(() => {
    clearInterval(autoTimerRef.current);
    if (approvedFeedbacks.length > VISIBLE) {
      autoTimerRef.current = setInterval(() => advance(1), AUTO_ADVANCE_MS);
    }
    return () => clearInterval(autoTimerRef.current);
  }, [approvedFeedbacks.length, advance]);

  // لما المستخدم يضغط سهم يدوي: نوقف التلقائي شوية ونرجعه تاني
  const manualAdvance = (dir) => {
    clearInterval(autoTimerRef.current);
    clearTimeout(pauseTimeoutRef.current);
    advance(dir);
    pauseTimeoutRef.current = setTimeout(() => {
      if (approvedFeedbacks.length > VISIBLE) {
        autoTimerRef.current = setInterval(() => advance(1), AUTO_ADVANCE_MS);
      }
    }, RESUME_AFTER_CLICK_MS);
  };

  useEffect(() => {
    return () => {
      clearInterval(autoTimerRef.current);
      clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (statusMsg && statusRef.current) {
      statusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [statusMsg]);

  const len = approvedFeedbacks.length;
  const visibleFeedbacks = Array.from(
    { length: Math.min(VISIBLE, len) },
    (_, i) => approvedFeedbacks[(startIndex + i) % len],
  );

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(db, "Feedbacks"), {
        ...data,
        approved: false,
        createdAt: serverTimestamp(),
      });
      setStatusMsg({
        type: "success",
        text: "تم استلام رأيك بنجاح هيتم مراجعته ونشره قريبًا.",
      });
      reset();
    } catch {
      setStatusMsg({
        type: "error",
        text: "حصل خطأ أثناء الإرسال، من فضلك حاول مرة تانية.",
      });
    }
  };

  return (
    <section
      id="feedback"
      dir="rtl"
      className="min-h-screen py-16 font-sans bg-background"
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-3"
        >
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary whitespace-nowrap">
            آراء عملائنا
          </h2>
          <div className="h-px flex-1 bg-border" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-grayText text-center mb-14 max-w-xl mx-auto"
        >
          تجارب حقيقية وآراء صادقة من عملائنا اللي جربوا منتجاتنا.
        </motion.p>

        {/* الفيدباك */}
        <div className="relative mb-16">
          <button
            onClick={() => manualAdvance(1)}
            disabled={len <= VISIBLE}
            className="absolute -right-4 sm:right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-primary disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:bg-accent hover:text-white hover:border-accent transition-colors"
          >
            <FaChevronRight size={14} />
          </button>
          <button
            onClick={() => manualAdvance(-1)}
            disabled={len <= VISIBLE}
            className="absolute -left-4 sm:left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-primary disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:bg-accent hover:text-white hover:border-accent transition-colors"
          >
            <FaChevronLeft size={14} />
          </button>

          {len === 0 ? (
            <p className="text-grayText text-center">
              لا توجد آراء متاحة حاليًا.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 px-6">
              <AnimatePresence mode="popLayout">
                {visibleFeedbacks.map((fb) => (
                  <motion.div
                    key={fb.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-accent transition-colors"
                  >
                    <FaQuoteRight className="text-accent text-2xl mb-4" />
                    <p className="text-dark leading-relaxed mb-6 line-clamp-4">
                      {fb.message}
                    </p>
                    <div className="mt-auto pt-4 border-t border-border">
                      <p className="font-semibold text-primary">{fb.name}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Feedback Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-xl mx-auto bg-surface border border-border rounded-2xl p-8"
        >
          <h3 className="text-xl font-bold text-dark mb-6 text-center">
            شاركنا رأيك
          </h3>

          <AnimatePresence>
            {statusMsg && (
              <motion.div
                ref={statusRef}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  statusMsg.type === "success"
                    ? "bg-success/10 text-success border border-success/30"
                    : "bg-danger/10 text-danger border border-danger/30"
                }`}
              >
                {statusMsg.type === "success" ? (
                  <FaCheckCircle />
                ) : (
                  <FaExclamationCircle />
                )}
                <span>{statusMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div>
              <input
                type="text"
                placeholder="الاسم بالكامل"
                {...register("name")}
                className={`w-full border rounded-xl px-4 py-2.5 bg-background text-dark placeholder:text-grayText focus:outline-none focus:ring-2 transition-colors ${
                  errors.name
                    ? "border-danger focus:ring-danger/30"
                    : "border-border focus:ring-accent/40 focus:border-accent"
                }`}
              />
              {errors.name && (
                <p className="text-danger text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                {...register("email")}
                className={`w-full border rounded-xl px-4 py-2.5 bg-background text-dark placeholder:text-grayText focus:outline-none focus:ring-2 transition-colors ${
                  errors.email
                    ? "border-danger focus:ring-danger/30"
                    : "border-border focus:ring-accent/40 focus:border-accent"
                }`}
              />
              {errors.email && (
                <p className="text-danger text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <textarea
                placeholder="اكتب رأيك هنا..."
                {...register("message")}
                className={`w-full border rounded-xl px-4 py-2.5 bg-background text-dark placeholder:text-grayText focus:outline-none focus:ring-2 resize-none h-32 transition-colors ${
                  errors.message
                    ? "border-danger focus:ring-danger/30"
                    : "border-border focus:ring-accent/40 focus:border-accent"
                }`}
              ></textarea>
              {errors.message && (
                <p className="text-danger text-sm mt-1">
                  {errors.message.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال الرأي"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
