import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "../components/Navbar/Navbar";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  onSnapshot,
  getDocs,
  query,
  where,
  documentId,
  setDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import {
  User,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Banknote,
  Zap,
  CheckCircle2,
  Copy,
  X,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
} from "lucide-react";

/* =======================
   Zod Schema (نفس قواعد الفاليديشن الأصلية، الرسائل بس اتترجمت)
======================= */
const checkoutSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "من فضلك أدخل اسم صحيح")
      .max(40, "من فضلك أدخل اسم صحيح")
      .regex(/^[A-Za-z\u0600-\u06FF\s]+$/, "من فضلك أدخل اسم صحيح."),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "يجب إدخال رقم هاتف مصري صحيح"),
    whatsapp: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "من فضلك أدخل رقم واتساب مصري صحيح"),
    city: z.string().min(1, "من فضلك اختر المدينة"),
    area: z
      .string()
      .min(2, "الحي مطلوب")
      .max(50, "الحي طويل جدًا")
      .regex(/^[A-Za-z\u0600-\u06FF0-9\s]+$/, "صيغة الحي غير صحيحة"),
    address: z
      .string()
      .min(10, "العنوان مطلوب")
      .max(200, "العنوان طويل جدًا")
      .regex(/^[A-Za-z0-9\u0600-\u06FF\s,.-]+$/, "صيغة العنوان غير صحيحة"),
    floor: z
      .string()
      .regex(/^\d*$/, "الدور يجب أن يكون أرقامًا فقط")
      .optional(),
    paymentMethod: z.enum(["cash", "instapay", "vodafone"]),
    referenceNumber: z.string().optional(),
    senderPhone: z.string().optional(),
    vodafoneReference: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod !== "instapay") return true;

      const ref = data.referenceNumber?.trim() || "";
      if (ref === "") return false;
      if (!/^\d+$/.test(ref)) return false;
      if (ref.length < 8 || ref.length > 20) return false;

      return true;
    },
    {
      message: "رقم المرجع مطلوب",
      path: ["referenceNumber"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod !== "instapay") return true;
      const phone = data.senderPhone?.trim() || "";
      return phone !== "" && /^01[0125][0-9]{8}$/.test(phone);
    },
    {
      message: "من فضلك أدخل رقم هاتف صحيح",
      path: ["senderPhone"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod !== "vodafone") return true;
      const phone = data.senderPhone?.trim() || "";
      return phone !== "" && /^01[0125][0-9]{8}$/.test(phone);
    },
    {
      message: "من فضلك أدخل رقم هاتف صحيح",
      path: ["senderPhone"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod !== "vodafone") return true;
      const ref = data.vodafoneReference?.trim() || "";
      return ref !== "" && /^\d{6,20}$/.test(ref);
    },
    {
      message: "من فضلك أدخل رقم مرجع صحيح",
      path: ["vodafoneReference"],
    },
  );

// ── مدن مصر ──
const egyptCities = [
  { id: "cairo", label: "القاهرة" },
  { id: "giza", label: "الجيزة" },
  { id: "fayoum", label: "الفيوم" },
  { id: "beni-suef", label: "بني سويف" },
  { id: "minya", label: "المنيا" },
  { id: "assiut", label: "أسيوط" },
  { id: "sohag", label: "سوهاج" },
  { id: "qena", label: "قنا" },
  { id: "nag-hammadi", label: "نجع حمادي" },
  { id: "luxor", label: "الأقصر" },
  { id: "aswan", label: "أسوان" },
  { id: "alexandria", label: "الإسكندرية" },
  { id: "tanta", label: "طنطا" },
  { id: "mahalla", label: "المحلة الكبرى" },
  { id: "mansoura", label: "المنصورة" },
  { id: "suez", label: "السويس" },
  { id: "beheira", label: "البحيرة" },
  { id: "sharqia", label: "الشرقية" },
  { id: "10th-of-ramadan", label: "العاشر من رمضان" },
  { id: "port-said", label: "بورسعيد" },
  { id: "ismailia", label: "الإسماعيلية" },
  { id: "damietta", label: "دمياط" },
  { id: "kafr-elsheikh", label: "كفر الشيخ" },
  { id: "qalyubia", label: "القليوبية" },
  { id: "al-gharbia", label: "الغربية" },
  { id: "monufia", label: "المنوفية" },
  { id: "dakahlia", label: "الدقهلية" },
  { id: "north-coast", label: "الساحل الشمالي" },
  { id: "marsa-matrouh", label: "مرسى مطروح" },
  { id: "hurghada", label: "الغردقة" },
  { id: "sharm-el-sheikh", label: "شرم الشيخ" },
  { id: "marsa-alam", label: "مرسى علم" },
  { id: "banha", label: "بنها" },
  { id: "badrashin", label: "البدرشين" },
  { id: "hawamdeya", label: "الحوامدية" },
  { id: "saqqara", label: "سقارة" },
  { id: "badr-city", label: "مدينة بدر" },
];

const shippingFees = {
  cairo: 70,
  giza: 70,
  fayoum: 110,
  "beni-suef": 110,
  minya: 110,
  assiut: 110,
  sohag: 110,
  qena: 110,
  "nag-hammadi": 110,
  luxor: 110,
  aswan: 120,
  alexandria: 90,
  tanta: 100,
  mahalla: 100,
  mansoura: 100,
  suez: 100,
  beheira: 100,
  sharqia: 100,
  "10th-of-ramadan": 100,
  "port-said": 100,
  ismailia: 100,
  damietta: 100,
  "kafr-elsheikh": 100,
  qalyubia: 100,
  "al-gharbia": 100,
  monufia: 100,
  dakahlia: 100,
  "north-coast": 130,
  "marsa-matrouh": 130,
  hurghada: 140,
  "sharm-el-sheikh": 140,
  "marsa-alam": 140,
  banha: 85,
  badrashin: 85,
  hawamdeya: 85,
  saqqara: 90,
  "badr-city": 85,
};

// ── تحويل أي عنصر قديم (string) لصيغة {id, qty} تلقائيًا ──
const normalizeCart = (rawCart) =>
  (rawCart || []).map((item) =>
    typeof item === "string" ? { id: item, qty: 1 } : item,
  );

export default function Checkout() {
  const [showModal, setShowModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // ── حالة تسجيل الدخول + الكارت من Firestore ──
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cart, setCart] = useState([]); // [{ id, qty }]
  const [cartItems, setCartItems] = useState([]); // بيانات المنتجات + الكمية
  const [isCartLoading, setIsCartLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
  });

  const paymentMethod = watch("paymentMethod");
  const selectedCity = watch("city");

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const shippingCost = selectedCity ? shippingFees[selectedCity] || 0 : 0;
  const grandTotal = total + shippingCost;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── تتبع حالة تسجيل الدخول ──
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setAuthChecked(true);

      if (!currentUser) {
        setCart([]);
        setCartItems([]);
        setIsCartLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── قراءة الكارت لحظيًا من Firestore ──
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "Users", user.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCart(normalizeCart(data.cart));
      } else {
        setCart([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // ── جلب بيانات منتجات الكارت (نفس منطق صفحة السلة) ──
  useEffect(() => {
    const fetchCartProducts = async () => {
      if (!authChecked) return;

      if (cart.length === 0) {
        setCartItems([]);
        setIsCartLoading(false);
        return;
      }

      try {
        const cartProductIds = cart.map((item) => item.id);

        const chunks = [];
        for (let i = 0; i < cartProductIds.length; i += 30) {
          chunks.push(cartProductIds.slice(i, i + 30));
        }

        const results = await Promise.all(
          chunks.map(async (chunk) => {
            const q = query(
              collection(db, "Products"),
              where(documentId(), "in", chunk),
            );

            const snap = await getDocs(q);

            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          }),
        );

        const merged = results.flat();

        const ordered = cart
          .map((cartItem) => {
            const productData = merged.find((p) => p.id === cartItem.id);
            if (!productData) return null;

            const unitPrice =
              productData.discountPrice ?? productData.price ?? 0;

            return {
              productId: productData.id,
              productName: productData.name || "منتج غير معروف",
              price: Number(unitPrice),
              quantity: cartItem.qty,
              total: Number(unitPrice) * cartItem.qty,
              image: productData.imageUrl || "",
              category: productData.category || "",
            };
          })
          .filter(Boolean);

        setCartItems(ordered);
      } catch (error) {
        console.error("Error fetching cart products:", error);
      } finally {
        setIsCartLoading(false);
      }
    };

    fetchCartProducts();
  }, [cart, authChecked]);

  const onSubmit = async (data) => {
    if (!user) return;

    try {
      let paymentMethodForDB = data.paymentMethod;
      if (data.paymentMethod === "vodafone") {
        paymentMethodForDB = "vodafone cash";
      }

      const orderData = {
        userId: user.uid,
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city,
        area: data.area,
        address: data.address,
        floor: data.floor || "",
        paymentMethod: paymentMethodForDB,
        ...(data.paymentMethod === "instapay" && {
          referenceNumber: data.referenceNumber,
          senderPhone: data.senderPhone,
        }),
        ...(data.paymentMethod === "vodafone" && {
          senderPhone: data.senderPhone,
          vodafoneReference: data.vodafoneReference,
        }),
        items: cartItems,
        subtotal: total,
        shippingFee: shippingCost,
        grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      await addDoc(collection(db, "Orders"), orderData);

      // ── تفضية الكارت في Firestore بعد نجاح الطلب ──
      const userRef = doc(db, "Users", user.uid);
      await setDoc(userRef, { cart: [] }, { merge: true });

      setPlacedOrder(orderData);
      setOrderPlaced(true);

      toast.success("تم تنفيذ الطلب بنجاح");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("حصل خطأ أثناء تنفيذ الطلب، حاول تاني");
    }
  };

  /* ================= شاشة النجاح ================= */
  if (orderPlaced && placedOrder) {
    return (
      <>
        <Navbar />
        <section
          dir="rtl"
          className="min-h-screen bg-background flex items-center justify-center px-6 py-16 font-sans"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-lg w-full bg-surface border border-border rounded-3xl shadow-xl p-8 md:p-10 text-center relative overflow-hidden"
          >
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-accent/10 rounded-full" />
            <div className="absolute -bottom-20 -right-16 w-52 h-52 bg-primary/5 rounded-full" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.1,
              }}
              className="relative z-10 mx-auto mb-6 w-20 h-20 rounded-full bg-success/10 flex items-center justify-center"
            >
              <CheckCircle2
                className="w-11 h-11 text-success"
                strokeWidth={2}
              />
            </motion.div>

            <h2 className="relative z-10 text-2xl md:text-3xl font-extrabold text-primary mb-2">
              تم تأكيد طلبك
            </h2>
            <p className="relative z-10 text-grayText mb-6">
              شكرًا لك، {placedOrder.fullName.split(" ")[0]} تم استلام طلبك
              وجاري تجهيزه.
            </p>

            <div className="relative z-10 bg-background border border-border rounded-2xl p-5 mb-6 text-right space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-grayText">رقم الطلب</span>
                <span className="text-sm font-bold text-primary">
                  {placedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-grayText">طريقة الدفع</span>
                <span className="text-sm font-bold text-primary">
                  {placedOrder.paymentMethod === "cash"
                    ? "الدفع عند الاستلام"
                    : placedOrder.paymentMethod === "vodafone cash"
                      ? "فودافون كاش"
                      : "Instapay"}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="text-sm font-semibold text-primary">
                  إجمالي المبلغ
                </span>
                <span className="text-lg font-extrabold text-accent">
                  {placedOrder.grandTotal.toFixed(2)} ج.م
                </span>
              </div>
            </div>

            <p className="relative z-10 text-xs text-grayText mb-8">
              هنتواصل معاك على الواتساب ({placedOrder.whatsapp}) لتأكيد تفاصيل
              التوصيل.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <ShoppingBag size={18} />
                تابع التسوق
              </Link>
              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-primary font-semibold py-3.5 rounded-xl hover:bg-background transition-colors"
              >
                الرجوع للرئيسية
              </Link>
            </div>
          </motion.div>
        </section>
      </>
    );
  }

  /* ================= فورم الـ Checkout ================= */
  return (
    <>
      <Navbar />

      <section
        dir="rtl"
        className="min-h-screen bg-background sm:py-12 py-4 font-sans"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <p className="text-sm font-semibold text-accent mb-2 tracking-wide uppercase">
              خطوة أخيرة
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">
              أكمل طلبك
            </h2>
          </motion.div>

          {/* ── لو مش مسجل دخول ── */}
          {!authChecked || isCartLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent mb-4">
                <ShoppingCart size={26} />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">
                سجل الدخول لإتمام الطلب
              </h3>
              <p className="text-grayText max-w-xs mb-5">
                يرجى تسجيل الدخول حتى تتمكن من مراجعة سلتك وإتمام عملية الشراء.
              </p>
              <Link
                to="/login"
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors"
              >
                تسجيل الدخول
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* ---------- يمين: خطوات الفورم ---------- */}
              <div className="lg:col-span-2 space-y-6">
                {/* الخطوة 1 - بيانات التواصل */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                      1
                    </div>
                    <h3 className="font-bold text-primary text-lg">
                      بيانات التواصل
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                        <User size={15} className="text-grayText" />
                        الاسم بالكامل
                      </label>
                      <input
                        {...register("fullName")}
                        placeholder="اكتب اسمك بالكامل"
                        className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                          errors.fullName
                            ? "border-danger focus:ring-danger/30"
                            : "border-border focus:ring-accent/30 focus:border-accent"
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-danger text-xs mt-1.5">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                          <Phone size={15} className="text-grayText" />
                          رقم الهاتف
                        </label>
                        <input
                          {...register("phone")}
                          placeholder="01XXXXXXXXX"
                          dir="ltr"
                          className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 text-right ${
                            errors.phone
                              ? "border-danger focus:ring-danger/30"
                              : "border-border focus:ring-accent/30 focus:border-accent"
                          }`}
                        />
                        {errors.phone && (
                          <p className="text-danger text-xs mt-1.5">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                          <MessageCircle size={15} className="text-grayText" />
                          رقم الواتساب
                        </label>
                        <input
                          {...register("whatsapp")}
                          placeholder="01XXXXXXXXX"
                          dir="ltr"
                          className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 text-right ${
                            errors.whatsapp
                              ? "border-danger focus:ring-danger/30"
                              : "border-border focus:ring-accent/30 focus:border-accent"
                          }`}
                        />
                        {errors.whatsapp && (
                          <p className="text-danger text-xs mt-1.5">
                            {errors.whatsapp.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* الخطوة 2 - عنوان التوصيل */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                      2
                    </div>
                    <h3 className="font-bold text-primary text-lg">
                      عنوان التوصيل
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                          <MapPin size={15} className="text-grayText" />
                          المدينة
                        </label>
                        <select
                          {...register("city")}
                          className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                            errors.city
                              ? "border-danger focus:ring-danger/30"
                              : "border-border focus:ring-accent/30 focus:border-accent"
                          }`}
                        >
                          <option value="">اختر المدينة</option>
                          {egyptCities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.label}
                            </option>
                          ))}
                        </select>
                        {errors.city && (
                          <p className="text-danger text-xs mt-1.5">
                            {errors.city.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                          <Building2 size={15} className="text-grayText" />
                          الحي / المنطقة
                        </label>
                        <input
                          {...register("area")}
                          placeholder="مثال: مدينة نصر"
                          className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                            errors.area
                              ? "border-danger focus:ring-danger/30"
                              : "border-border focus:ring-accent/30 focus:border-accent"
                          }`}
                        />
                        {errors.area && (
                          <p className="text-danger text-xs mt-1.5">
                            {errors.area.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-primary mb-1.5 block">
                        العنوان بالتفصيل
                      </label>
                      <textarea
                        {...register("address")}
                        rows={2}
                        placeholder="الشارع، رقم المبنى، أقرب علامة مميزة..."
                        className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                          errors.address
                            ? "border-danger focus:ring-danger/30"
                            : "border-border focus:ring-accent/30 focus:border-accent"
                        }`}
                      />
                      {errors.address && (
                        <p className="text-danger text-xs mt-1.5">
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    <div className="sm:w-1/2">
                      <label className="text-sm font-semibold text-primary mb-1.5 block">
                        الدور (اختياري)
                      </label>
                      <input
                        {...register("floor")}
                        placeholder="مثال: 3"
                        className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                          errors.floor
                            ? "border-danger focus:ring-danger/30"
                            : "border-border focus:ring-accent/30 focus:border-accent"
                        }`}
                      />
                      {errors.floor && (
                        <p className="text-danger text-xs mt-1.5">
                          {errors.floor.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* الخطوة 3 - طريقة الدفع */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                      3
                    </div>
                    <h3 className="font-bold text-primary text-lg">
                      طريقة الدفع
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        id: "cash",
                        icon: Banknote,
                        label: "الدفع عند الاستلام",
                      },
                      { id: "instapay", icon: Zap, label: "Instapay" },
                      {
                        id: "vodafone",
                        icon: Smartphone,
                        label: "فودافون كاش",
                      },
                    ].map((method) => {
                      const selected = paymentMethod === method.id;
                      const Icon = method.icon;
                      return (
                        <label
                          key={method.id}
                          className={`relative cursor-pointer rounded-2xl border-2 p-5 text-center transition-all ${
                            selected
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/40"
                          }`}
                        >
                          <input
                            type="radio"
                            value={method.id}
                            {...register("paymentMethod")}
                            className="hidden"
                          />
                          {selected && (
                            <span className="absolute top-2.5 right-2.5">
                              <CheckCircle2
                                size={18}
                                className="text-accent"
                                fill="currentColor"
                                fillOpacity={0.15}
                              />
                            </span>
                          )}
                          <Icon
                            className={`mx-auto mb-2 ${
                              selected ? "text-accent" : "text-grayText"
                            }`}
                            size={26}
                          />
                          <p
                            className={`font-semibold text-sm ${
                              selected ? "text-primary" : "text-grayText"
                            }`}
                          >
                            {method.label}
                          </p>
                        </label>
                      );
                    })}
                  </div>

                  {errors.paymentMethod && (
                    <p className="text-danger text-xs mt-3">
                      من فضلك اختر طريقة الدفع
                    </p>
                  )}

                  <AnimatePresence mode="wait">
                    {paymentMethod === "instapay" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mt-5">
                          <p className="font-bold text-primary mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-accent" />
                            تعليمات الدفع عبر Instapay
                          </p>

                          <div className="bg-surface border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-grayText mb-0.5">
                                حوّل على هذا الحساب
                              </p>
                              <p
                                className="font-bold text-primary tracking-wide"
                                dir="ltr"
                              >
                                0123456789
                              </p>
                            </div>
                            <Copy size={16} className="text-grayText" />
                          </div>

                          <div className="bg-surface border border-border rounded-xl p-4 mb-4 space-y-2">
                            <p className="text-sm font-semibold text-primary flex items-start gap-2">
                              <span className="text-accent shrink-0">1.</span>
                              حوّل المبلغ الإجمالي الموضح أدناه باستخدام
                              Instapay
                            </p>
                            <p className="text-sm font-semibold text-primary flex items-start gap-2">
                              <span className="text-accent shrink-0">2.</span>
                              بعد نجاح التحويل، ستحصل على رقم مرجعي للعملية
                            </p>
                            <p className="text-sm font-semibold text-primary flex items-start gap-2">
                              <span className="text-accent shrink-0">3.</span>
                              أدخل هذا الرقم المرجعي في الحقل أدناه
                            </p>
                          </div>

                          <div className="mb-4">
                            <label className="text-sm font-semibold text-primary mb-1.5 block">
                              رقم هاتف المُحوِّل
                            </label>
                            <input
                              {...register("senderPhone")}
                              placeholder="01XXXXXXXXX"
                              dir="ltr"
                              className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 text-right ${
                                errors.senderPhone
                                  ? "border-danger focus:ring-danger/30"
                                  : "border-border focus:ring-accent/30 focus:border-accent"
                              }`}
                            />
                            {errors.senderPhone && (
                              <p className="text-danger text-xs mt-1.5">
                                {errors.senderPhone.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-sm font-semibold text-primary">
                                رقم المرجع
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="text-accent text-xs font-semibold hover:underline"
                              >
                                أين يوجد رقم المرجع؟
                              </button>
                            </div>
                            <input
                              {...register("referenceNumber")}
                              placeholder="أدخل رقم المرجع الخاص بالتحويل"
                              className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                                errors.referenceNumber
                                  ? "border-danger focus:ring-danger/30"
                                  : "border-border focus:ring-accent/30 focus:border-accent"
                              }`}
                            />
                            {errors.referenceNumber && (
                              <p className="text-danger text-xs mt-1.5">
                                {errors.referenceNumber.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentMethod === "vodafone" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mt-5">
                          <p className="font-bold text-primary mb-3 flex items-center gap-2">
                            <Smartphone size={16} className="text-accent" />
                            تعليمات الدفع عبر فودافون كاش
                          </p>

                          <div className="bg-surface border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-grayText mb-0.5">
                                حوّل على رقم فودافون كاش
                              </p>
                              <p
                                className="font-bold text-primary tracking-wide"
                                dir="ltr"
                              >
                                01012345678
                              </p>
                            </div>
                            <Copy size={16} className="text-grayText" />
                          </div>

                          <div className="bg-surface border border-border rounded-xl p-4 mb-4 space-y-2">
                            <p className="text-sm font-semibold text-primary flex items-start gap-2">
                              <span className="text-accent shrink-0">1.</span>
                              أرسل المبلغ الإجمالي باستخدام فودافون كاش
                            </p>
                            <p className="text-sm font-semibold text-primary flex items-start gap-2">
                              <span className="text-accent shrink-0">2.</span>
                              بعد التحويل، احتفظ برقم العملية المرجعي
                            </p>
                            <p className="text-sm font-semibold text-primary flex items-start gap-2">
                              <span className="text-accent shrink-0">3.</span>
                              أدخل رقم هاتفك ورقم العملية المرجعي أدناه
                            </p>
                          </div>

                          <div className="mb-4">
                            <label className="text-sm font-semibold text-primary mb-1.5 block">
                              رقم هاتف المُحوِّل
                            </label>
                            <input
                              {...register("senderPhone")}
                              placeholder="01XXXXXXXXX"
                              dir="ltr"
                              className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 text-right ${
                                errors.senderPhone
                                  ? "border-danger focus:ring-danger/30"
                                  : "border-border focus:ring-accent/30 focus:border-accent"
                              }`}
                            />
                            {errors.senderPhone && (
                              <p className="text-danger text-xs mt-1.5">
                                {errors.senderPhone.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-semibold text-primary mb-1.5 block">
                              رقم العملية المرجعي
                            </label>
                            <input
                              {...register("vodafoneReference")}
                              placeholder="اكتب رقم العملية المرجعي"
                              className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                                errors.vodafoneReference
                                  ? "border-danger focus:ring-danger/30"
                                  : "border-border focus:ring-accent/30 focus:border-accent"
                              }`}
                            />
                            {errors.vodafoneReference && (
                              <p className="text-danger text-xs mt-1.5">
                                {errors.vodafoneReference.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ---------- شمال: ملخص الطلب ---------- */}
              <div className="lg:col-span-1">
                <div className="bg-surface border border-border rounded-2xl shadow-lg p-6 sticky top-24">
                  <h3 className="font-bold text-primary text-lg mb-5 flex items-center gap-2">
                    <PackageCheck size={20} className="text-accent" />
                    ملخص الطلب
                  </h3>

                  {cartItems.length > 0 && (
                    <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                      {cartItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center gap-3"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-12 h-12 rounded-lg object-contain bg-background border border-border shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-grayText">
                              الكمية: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-primary shrink-0">
                            {item.total.toFixed(0)} ج.م
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between text-sm text-grayText">
                      <span>الإجمالي الفرعي</span>
                      <span className="font-semibold text-primary">
                        {total.toFixed(2)} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-grayText">
                      <span>الشحن</span>
                      <span className="font-semibold text-primary">
                        {selectedCity
                          ? `${shippingCost.toFixed(2)} ج.م`
                          : "اختر المدينة"}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-baseline">
                      <span className="font-bold text-primary">الإجمالي</span>
                      <span className="text-2xl font-extrabold text-accent">
                        {grandTotal.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || cartItems.length === 0}
                    className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:bg-grayText/40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                  >
                    {isSubmitting ? "جاري التنفيذ..." : "تأكيد الطلب"}
                  </button>
                  {cartItems.length === 0 && (
                    <p className="text-xs text-danger text-center mt-3">
                      سلتك فارغة
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ================= Modal الشرح ================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              dir="rtl"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="bg-surface rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-primary p-5 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap size={18} />
                  أين يوجد رقم المرجع؟
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {/* موك أب لشاشة الموبايل */}
                <div className="bg-background rounded-[32px] p-3 shadow-inner max-w-xs mx-auto mb-6 border border-border">
                  <div className="bg-surface rounded-[24px] overflow-hidden border border-border">
                    <div className="bg-primary text-white p-5 text-center">
                      <h3 className="text-base font-bold mb-1">
                        تمت عملية التحويل بنجاح
                      </h3>
                      <p className="text-white/70 text-xs">العملية مكتملة</p>
                    </div>

                    <div className="flex justify-center py-5 bg-background">
                      <div className="bg-success w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="text-white" size={32} />
                      </div>
                    </div>

                    <div className="bg-surface p-4 space-y-1 text-sm">
                      <div className="flex justify-between items-center py-2.5 border-b border-border">
                        <span className="text-grayText">المبلغ الإجمالي</span>
                        <span className="font-bold text-primary">
                          قيمة المبلغ
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2.5 border-b border-border">
                        <span className="text-grayText">المستلم</span>
                        <span className="font-bold text-primary">
                          اسم المتجر
                        </span>
                      </div>

                      {/* رقم المرجع - موضّح */}
                      <div className="bg-accent/10 border-2 border-dashed border-accent rounded-xl p-3 my-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Zap size={14} className="text-accent" />
                          <span className="text-primary font-bold text-xs">
                            رقم المرجع
                          </span>
                        </div>
                        <span className="font-black text-primary text-sm tracking-wide bg-accent/15 px-3 py-1.5 rounded-lg block text-center">
                          هنا يوجد رقم المرجع
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-grayText">الحالة</span>
                        <span className="font-bold text-success flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          مكتملة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="font-bold text-primary mb-1.5 text-sm">
                      أين يمكن إيجاده أيضًا؟
                    </p>
                    <p className="text-sm text-grayText">
                      راجع سجل العمليات (Transaction History) داخل تطبيق
                      Instapay أو البنك.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl p-4">
                    <CheckCircle2
                      size={18}
                      className="text-accent shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-primary">
                      انسخه بالظبط زي ما هو، من غير مسافات أو رموز.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl p-4">
                    <span className="text-danger font-bold text-sm shrink-0">
                      !
                    </span>
                    <p className="text-sm text-primary">
                      طلبك مش هيتأكد من غير رقم مرجع صحيح.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  حسنا
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
