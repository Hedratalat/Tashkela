import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  onSnapshot,
  getDocs,
  collection,
  query,
  where,
  documentId,
  setDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import {
  Maximize2,
  X,
  Trash2,
  ShoppingCart,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar/Navbar";

// ── تحويل أي عنصر قديم (string) لصيغة {id, qty} تلقائيًا ──
const normalizeCart = (rawCart) =>
  (rawCart || []).map((item) =>
    typeof item === "string" ? { id: item, qty: 1 } : item,
  );

export default function Cart() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [cart, setCart] = useState([]); // [{ id, qty }]

  const [products, setProducts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // ── Popup تأكيد الحذف ──
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();
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
        setProducts([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── قراءة الكارت لحظيًا ──
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

  // ── جلب بيانات المنتجات الموجودة في السلة ──
  useEffect(() => {
    const fetchCartProducts = async () => {
      if (!authChecked) return;

      if (cart.length === 0) {
        setProducts([]);
        setIsLoading(false);
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

        // دمج بيانات المنتج مع الكمية + ترتيب الأحدث فوق
        const ordered = [...cart]
          .reverse()
          .map((cartItem) => {
            const productData = merged.find((p) => p.id === cartItem.id);
            return productData ? { ...productData, qty: cartItem.qty } : null;
          })
          .filter(Boolean);

        setProducts(ordered);
      } catch (error) {
        console.error("Error fetching cart products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartProducts();
  }, [cart, authChecked]);

  // ── زيادة الكمية ──
  const increaseQty = async (product) => {
    if (!user) return;

    const userRef = doc(db, "Users", user.uid);
    const updatedCart = cart.map((item) =>
      item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
    );

    try {
      await setDoc(userRef, { cart: updatedCart }, { merge: true });
    } catch (error) {
      console.error("Error increasing qty:", error);
      toast.error("حصل خطأ، حاول تاني");
    }
  };

  // ── إنقاص الكمية (لو وصلت لـ 1 مبتقلش عن كده من هنا، لازم يستخدم زرار الحذف) ──
  const decreaseQty = async (product) => {
    if (!user) return;

    if (product.qty <= 1) {
      // لو عايز ينقص عن 1 لازم يأكد الحذف بدل ما يتشال فجأة
      setProductToDelete(product);
      return;
    }

    const userRef = doc(db, "Users", user.uid);
    const updatedCart = cart.map((item) =>
      item.id === product.id ? { ...item, qty: item.qty - 1 } : item,
    );

    try {
      await setDoc(userRef, { cart: updatedCart }, { merge: true });
    } catch (error) {
      console.error("Error decreasing qty:", error);
      toast.error("حصل خطأ، حاول تاني");
    }
  };

  // ── فتح Popup تأكيد الحذف ──
  const askDeleteProduct = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setProductToDelete(product);
  };

  // ── تنفيذ الحذف الفعلي بعد التأكيد ──
  const confirmDeleteProduct = async () => {
    if (!user || !productToDelete) return;

    const userRef = doc(db, "Users", user.uid);
    const updatedCart = cart.filter((item) => item.id !== productToDelete.id);

    try {
      await setDoc(userRef, { cart: updatedCart }, { merge: true });
      toast.success(`تم إزالة ${productToDelete.name} من السلة`);
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("حصل خطأ، حاول تاني");
    } finally {
      setProductToDelete(null);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
  };

  // ── حسابات الملخص ──
  const totalItemsCount = products.reduce((sum, p) => sum + p.qty, 0);
  const totalPrice = products.reduce((sum, p) => {
    const price = p.discountPrice ?? p.price ?? 0;
    return sum + Number(price) * p.qty;
  }, 0);

  return (
    <>
      <Navbar />

      <section dir="rtl" className="bg-background min-h-screen font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* العنوان */}
          <div className="py-4 md:py-10">
            <div className="max-w-3xl mx-auto text-center">
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
                سلة المشتريات
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
                منتجات سلتك
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
                راجع منتجاتك وكمياتك قبل إتمام الطلب
              </motion.p>
            </div>
          </div>

          {/* المحتوى */}
          <div className="pb-9 sm:pb-16">
            {!authChecked || isLoading ? (
              <div className="flex justify-center items-center py-32">
                <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : !user ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent mb-4">
                  <ShoppingCart size={26} />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  سجل الدخول للوصول إلى السلة
                </h3>
                <p className="text-grayText max-w-xs mb-5">
                  يرجى تسجيل الدخول حتى تتمكن من إضافة المنتجات إلى السلة
                  والوصول إليها في أي وقت.
                </p>
                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent mb-4">
                  <ShoppingCart size={26} />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  السلة فارغة حاليًا
                </h3>
                <p className="text-grayText max-w-xs mb-5">
                  تصفّح متجرنا وأضف المنتجات اللي عجبتك إلى السلة عشان تكمل
                  عملية الشراء.
                </p>
                <Link
                  to="/products"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                >
                  تصفح المتجر
                </Link>
              </div>
            ) : (
              /* ── Layout: قائمة المنتجات + ملخص الطلب Sticky ── */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* قائمة المنتجات */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {products.map((product) => {
                    const unitPrice =
                      product.discountPrice ?? product.price ?? 0;
                    const lineTotal = Number(unitPrice) * product.qty;

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition"
                      >
                        {/* الصورة */}
                        <div
                          onClick={() => setSelectedProduct(product)}
                          className="relative w-full sm:w-32 h-32 shrink-0 rounded-xl bg-background overflow-hidden cursor-pointer"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-3"
                          />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition"
                          >
                            <Maximize2 size={14} className="text-grayText" />
                          </button>
                        </div>

                        {/* البيانات */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {product.category && (
                                <span className="inline-block w-fit bg-accent/15 text-accent text-xs font-bold px-2.5 py-1 rounded-full mb-1.5">
                                  {product.category}
                                </span>
                              )}
                              <h3 className="font-bold text-primary text-lg truncate">
                                {product.name}
                              </h3>
                              <p className="text-grayText text-sm truncate">
                                {product.shopName}
                              </p>
                            </div>

                            {/* حذف مباشر (اختصار سريع) */}
                            <button
                              onClick={(e) => askDeleteProduct(e, product)}
                              className="shrink-0 w-9 h-9 rounded-full hover:bg-danger/10 flex items-center justify-center transition"
                              title="إزالة من السلة"
                            >
                              <Trash2 size={18} className="text-danger" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
                            {/* السعر */}
                            <div className="flex items-center gap-2">
                              {product.discountPrice ? (
                                <>
                                  <span className="text-grayText text-sm line-through">
                                    {product.price} ج.م
                                  </span>
                                  <span className="text-primary font-extrabold text-lg">
                                    {product.discountPrice} ج.م
                                  </span>
                                </>
                              ) : (
                                <span className="text-primary font-extrabold text-lg">
                                  {product.price} ج.م
                                </span>
                              )}
                            </div>

                            {/* عداد الكمية */}
                            <div className="flex items-center border border-border rounded-lg overflow-hidden">
                              <button
                                onClick={() => decreaseQty(product)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-background text-primary transition"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center font-semibold text-primary text-sm">
                                {product.qty}
                              </span>
                              <button
                                onClick={() => increaseQty(product)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-background text-primary transition"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-grayText">
                            الإجمالي:{" "}
                            <span className="font-bold text-primary">
                              {lineTotal} ج.م
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ملخص الطلب - Sticky */}
                <aside className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24 bg-surface border border-border rounded-2xl p-6">
                    <h3 className="font-bold text-primary text-lg mb-5">
                      ملخص الطلب
                    </h3>

                    <div className="flex justify-between text-sm text-grayText mb-2.5">
                      <span>عدد القطع</span>
                      <span className="font-semibold text-primary">
                        {totalItemsCount}
                      </span>
                    </div>

                    <div className="border-t border-border my-4" />

                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-primary">الإجمالي</span>
                      <span className="font-extrabold text-accent text-2xl">
                        {totalPrice} ج.م
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/checkout");
                      }}
                      className="w-full px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                    >
                      إتمام الطلب
                    </button>

                    <p className="text-center text-xs text-grayText mt-3">
                      تكلفة الشحن غير محسوبة بعد
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Popup تفاصيل المنتج ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-lg"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition"
              >
                <X size={18} className="text-primary" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="bg-background flex items-center justify-center p-6">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain max-h-80"
                  />
                </div>

                <div className="p-6 flex flex-col">
                  {selectedProduct.category && (
                    <span className="inline-block w-fit bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                      {selectedProduct.category}
                    </span>
                  )}

                  <h3 className="text-xl font-extrabold text-primary mb-2">
                    {selectedProduct.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    {selectedProduct.discountPrice ? (
                      <>
                        <span className="text-grayText text-base line-through">
                          {selectedProduct.price} ج.م
                        </span>
                        <span className="text-primary font-extrabold text-xl">
                          {selectedProduct.discountPrice} ج.م
                        </span>
                      </>
                    ) : (
                      <span className="text-primary font-extrabold text-xl">
                        {selectedProduct.price} ج.م
                      </span>
                    )}
                  </div>

                  <p className="text-grayText text-sm leading-relaxed flex-1">
                    {selectedProduct.description}
                  </p>

                  <div className="border-t border-border mt-4 pt-4">
                    <span className="text-sm text-grayText">
                      البائع:{" "}
                      <span className="font-bold text-primary">
                        {selectedProduct.shopName}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Popup تأكيد الحذف ── */}
      <AnimatePresence>
        {productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProductToDelete(null)}
            className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl overflow-hidden max-w-sm w-full shadow-lg p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center text-danger mb-4">
                  <AlertTriangle size={28} />
                </div>

                <h3 className="text-lg font-bold text-primary mb-2">
                  تأكيد إزالة المنتج
                </h3>

                <p className="text-grayText text-sm mb-5">
                  هل أنت متأكد من إزالة{" "}
                  <span className="font-bold text-primary">
                    {productToDelete.name}
                  </span>{" "}
                  من السلة؟
                </p>

                <div className="flex items-center gap-3 bg-background border border-border rounded-xl p-3 w-full mb-6">
                  <img
                    src={productToDelete.imageUrl}
                    alt={productToDelete.name}
                    className="w-12 h-12 object-contain shrink-0"
                  />
                  <div className="min-w-0 text-right flex-1">
                    <p className="font-semibold text-primary text-sm truncate">
                      {productToDelete.name}
                    </p>
                    <p className="text-grayText text-xs">
                      الكمية: {productToDelete.qty}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setProductToDelete(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-primary text-sm font-medium hover:bg-background transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDeleteProduct}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-medium hover:opacity-90 transition-colors"
                  >
                    تأكيد الحذف
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
