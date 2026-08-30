import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { Heart, ShoppingBag, Maximize2, X, HeartOff } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar/Navbar";

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [cart, setCart] = useState([]);

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentPage]);

  // ── تتبع حالة تسجيل الدخول ──
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setAuthChecked(true);

      if (!currentUser) {
        setFavoriteIds([]);
        setCart([]);
        setProducts([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── قراءة الفيفوريت/الكارت لحظيًا (متزامنة مع باقي الموقع) ──
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "Users", user.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        setFavoriteIds(data.favorites || []);
        setCart(data.cart || []);
      } else {
        setFavoriteIds([]);
        setCart([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // ── جلب بيانات المنتجات المفضلة بناءً على الـ IDs ──
  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!authChecked) return;

      if (favoriteIds.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        // Firestore بيحدد حد أقصى 30 عنصر في "in" query، فبنقسمهم على دفعات
        const chunks = [];

        for (let i = 0; i < favoriteIds.length; i += 30) {
          chunks.push(favoriteIds.slice(i, i + 30));
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

        // ترتيب المنتجات حسب ترتيب إضافتها للمفضلة (الأحدث فوق)
        const ordered = [...favoriteIds]
          .reverse()
          .map((id) => merged.find((p) => p.id === id))
          .filter(Boolean);

        setProducts(ordered);
      } catch (error) {
        console.error("Error fetching favorite products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [favoriteIds, authChecked]);

  // ── إزالة من المفضلة (بتتحدث في Firebase وبالتالي في كل صفحات الموقع) ──
  const removeFavorite = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    const userRef = doc(db, "Users", user.uid);

    try {
      await setDoc(
        userRef,
        { favorites: arrayRemove(product.id) },
        { merge: true },
      );

      toast.success(`تم إزالة ${product.name} من المفضلة`);
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("حصل خطأ، حاول تاني");
    }
  };

  // ── إضافة/إزالة من السلة ──
  const toggleCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("سجل دخول الأول عشان تضيف للسلة");
      return;
    }

    const inCart = cart.includes(product.id);
    const userRef = doc(db, "Users", user.uid);

    try {
      await setDoc(
        userRef,
        {
          cart: inCart ? arrayRemove(product.id) : arrayUnion(product.id),
        },
        { merge: true },
      );

      toast.success(
        inCart
          ? `تم إزالة ${product.name} من السلة`
          : `تم إضافة ${product.name} للسلة`,
      );
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("حصل خطأ، حاول تاني");
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

  // ── حسابات الـ Pagination ──
  const totalPages = Math.ceil(products.length / productsPerPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = products.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  // ── لو الصفحة الحالية بقت فاضية بعد حذف منتج، ارجع للصفحة اللي قبلها ──
  useEffect(() => {
    if (currentPage > 1 && startIndex >= products.length) {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  }, [products.length, currentPage, startIndex]);

  return (
    <>
      <Navbar />

      <section dir="rtl" className="bg-background min-h-screen font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* العنوان - نفس بادينج وأنيميشن باقي صفحات الموقع */}
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
                مفضلتي
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
                المنتجات التي أعجبتك
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
                كل المنتجات اللي ضفتها للمفضلة في مكان واحد
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
              /* ── لو مش مسجل دخول ── */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent mb-4">
                  <Heart size={26} />
                </div>

                <h3 className="text-xl font-bold text-primary mb-2">
                  سجل الدخول للوصول إلى المفضلة
                </h3>

                <p className="text-grayText max-w-xs mb-5">
                  يرجى تسجيل الدخول حتى تتمكن من إضافة المنتجات إلى قائمة
                  المفضلة والوصول إليها في أي وقت.
                </p>

                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </div>
            ) : products.length === 0 ? (
              /* ── لو مفيش منتجات مفضلة ── */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent mb-4">
                  <HeartOff size={26} />
                </div>

                <h3 className="text-xl font-bold text-primary mb-2">
                  لا توجد منتجات في المفضلة بعد
                </h3>

                <p className="text-grayText max-w-xs mb-5">
                  تصفّح متجرنا واكتشف منتجاتك المفضلة، ثم أضفها إلى قائمة
                  المفضلة للعودة إليها في أي وقت.
                </p>

                <Link
                  to="/products"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                >
                  تصفح المتجر
                </Link>
              </div>
            ) : (
              /* ── الكروت - نفس شكل FeaturedProducts بالظبط + Pagination ── */
              <div className="flex flex-col min-h-[calc(100vh-320px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {currentProducts.map((product) => {
                    const inCart = cart.includes(product.id);

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col sm:flex-row"
                      >
                        {/* الصورة */}
                        <div
                          onClick={() => setSelectedProduct(product)}
                          className="relative aspect-square sm:aspect-auto sm:w-2/5 bg-surface cursor-pointer overflow-hidden shrink-0"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-6"
                          />

                          {/* أيقونات القلب و الشنطة و الـ Expand */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <button
                              onClick={(e) => removeFavorite(e, product)}
                              className="w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition"
                              title="إزالة من المفضلة"
                            >
                              <Heart
                                size={18}
                                className="fill-danger text-danger"
                              />
                            </button>

                            <button
                              onClick={(e) => toggleCart(e, product)}
                              className="w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition"
                              title={inCart ? "إزالة من السلة" : "إضافة للسلة"}
                            >
                              <ShoppingBag
                                size={17}
                                className={
                                  inCart ? "text-accent" : "text-grayText"
                                }
                              />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                              }}
                              className="w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition"
                            >
                              <Maximize2 size={17} className="text-grayText" />
                            </button>
                          </div>
                        </div>

                        {/* البيانات */}
                        <div className="p-5 sm:p-6 flex flex-col flex-1">
                          {product.category && (
                            <span className="inline-block w-fit bg-accent/15 text-accent text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                              {product.category}
                            </span>
                          )}

                          <h3 className="font-bold text-primary text-xl line-clamp-2">
                            {product.name}
                          </h3>

                          {product.description && (
                            <p className="text-grayText text-sm leading-relaxed line-clamp-3 mt-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-3 mb-1.5">
                            {product.discountPrice ? (
                              <>
                                <span className="text-grayText text-lg line-through">
                                  {product.price} ج.م
                                </span>
                                <span className="text-primary font-extrabold text-2xl">
                                  {product.discountPrice} ج.م
                                </span>
                              </>
                            ) : (
                              <span className="text-primary font-extrabold text-2xl">
                                {product.price} ج.م
                              </span>
                            )}
                          </div>

                          <div className="border-t border-accent/20 pt-3 flex items-center justify-between gap-2 h-7 mt-auto">
                            <span className="text-grayText text-base font-semibold truncate">
                              {product.shopName}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Pagination - نفس شكل Products.jsx بالظبط */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-auto pt-20 gap-3 items-center flex-wrap">
                    <button
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage === 1
                          ? "bg-border/40 text-grayText cursor-not-allowed border-border"
                          : "bg-surface text-primary border-border hover:bg-accent hover:text-white hover:border-accent"
                      }`}
                    >
                      السابق
                    </button>
                    {pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg border ${
                          page === currentPage
                            ? "bg-accent text-white border-accent"
                            : "bg-surface text-primary border-border hover:bg-accent hover:text-white hover:border-accent"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        currentPage < totalPages &&
                        setCurrentPage(currentPage + 1)
                      }
                      disabled={currentPage >= totalPages}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage >= totalPages
                          ? "bg-border/40 text-grayText cursor-not-allowed border-border"
                          : "bg-surface text-primary border-border hover:bg-accent hover:text-white hover:border-accent"
                      }`}
                    >
                      التالي
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* الـ Popup - نفس شكل FeaturedProducts بالظبط */}
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
    </>
  );
}
