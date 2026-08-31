import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  getDocs,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import {
  Heart,
  ShoppingBag,
  Maximize2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar/Navbar";

const priceRanges = [
  { label: "كل الأسعار", value: "all" },
  { label: "0 - 50 ج.م", value: "0-50" },
  { label: "50 - 100 ج.م", value: "50-100" },
  { label: "100 - 200 ج.م", value: "100-200" },
  { label: "200 - 500 ج.م", value: "200-500" },
  { label: "500 ج.م فأكثر", value: "500+" },
];

// ── أنيميشن موحّد مع صفحة "من نحن" ──
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

// ── محتوى الفلاتر ──
function FiltersContent({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  categories,
  selectedPriceValue,
  applyPrice,
  isFiltered,
  resetFilters,
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <span className="font-extrabold text-base text-primary">الفلاتر</span>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="text-xs text-accent underline cursor-pointer"
          >
            إعادة تعيين
          </button>
        )}
      </div>

      <div className="h-px bg-border mb-5" />

      <p className="text-xs font-semibold text-grayText uppercase tracking-wider mb-3">
        بحث
      </p>

      <input
        type="text"
        placeholder="ابحث عن منتج..."
        className="w-full p-3 rounded-xl border border-border bg-background text-primary shadow-sm focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none mb-6 text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="h-px bg-border mb-5" />

      <p className="text-xs font-semibold text-grayText uppercase tracking-wider mb-3">
        التصنيف
      </p>

      <div className="flex flex-col gap-2 mb-6">
        <button
          onClick={() => setCategoryFilter("الكل")}
          className={`text-right text-sm px-4 py-3 rounded-xl border transition-all duration-200 ${
            categoryFilter === "الكل"
              ? "bg-accent text-white border-accent font-medium"
              : "text-primary border-border hover:border-accent/50 hover:bg-background bg-surface"
          }`}
        >
          كل التصنيفات
        </button>

        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => setCategoryFilter(cat)}
            className={`text-right text-sm px-4 py-3 rounded-xl border transition-all duration-200 ${
              categoryFilter === cat
                ? "bg-accent text-white border-accent font-medium"
                : "text-primary border-border hover:border-accent/50 hover:bg-background bg-surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="h-px bg-border mb-5" />

      <p className="text-xs font-semibold text-grayText uppercase tracking-wider mb-3">
        نطاق السعر
      </p>

      <div className="flex flex-col gap-2">
        {priceRanges.map((item) => (
          <button
            key={item.value}
            onClick={() => applyPrice(item.value)}
            className={`w-full text-right text-sm px-4 py-3 rounded-xl border transition-all duration-200 ${
              selectedPriceValue === item.value
                ? "bg-accent text-white border-accent font-medium"
                : "text-primary border-border hover:border-accent/50 hover:bg-background bg-surface"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [priceFilter, setPriceFilter] = useState({
    min: 0,
    max: 1000000,
  });
  const [selectedPriceValue, setSelectedPriceValue] = useState("all");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchParams] = useSearchParams();
  // ── جلب المنتجات ──
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const snap = await getDocs(collection(db, "Products"));

        const cats = [];

        const data = snap.docs.map((d) => {
          const item = d.data();

          if (item.category) cats.push(item.category);

          return {
            id: d.id,
            ...item,
          };
        });

        data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        setProducts(data);
        setCategories([...new Set(cats)]);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentPage]);

  // ── قراءة كلمة البحث من رابط الصفحة (لو جاية من الـ Navbar) ──
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearch(searchFromUrl);
    }
  }, [searchParams]);

  // ── تتبع حالة تسجيل الدخول ──
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);

      if (!currentUser) {
        setFavorites([]);
        setCart([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── قراءة الفيفوريت/الكارت ──
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "Users", user.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        setFavorites(data.favorites || []);
        setCart(data.cart || []);
      } else {
        setFavorites([]);
        setCart([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // ── الفيفوريت ──
  const toggleFavorite = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("سجل دخول الأول عشان تضيف للمفضلة");
      return;
    }

    const isFav = favorites.includes(product.id);
    const userRef = doc(db, "Users", user.uid);

    try {
      await setDoc(
        userRef,
        {
          favorites: isFav ? arrayRemove(product.id) : arrayUnion(product.id),
        },
        { merge: true },
      );

      toast.success(
        isFav
          ? `تم إزالة ${product.name} من المفضلة`
          : `تم إضافة ${product.name} للمفضلة`,
      );
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast.error("حصل خطأ، حاول تاني");
    }
  };

  // ── السلة ──
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

  // ── الفلاتر ──
  const applyPrice = (val) => {
    setSelectedPriceValue(val);

    if (val === "all") {
      setPriceFilter({
        min: 0,
        max: 1000000,
      });
    } else if (val === "500+") {
      setPriceFilter({
        min: 500,
        max: 1000000,
      });
    } else {
      const [min, max] = val.split("-").map(Number);

      setPriceFilter({
        min,
        max,
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("الكل");
    setSelectedPriceValue("all");

    setPriceFilter({
      min: 0,
      max: 1000000,
    });
  };

  const isFiltered =
    search !== "" || categoryFilter !== "الكل" || selectedPriceValue !== "all";

  const getEffectivePrice = (p) =>
    p.discountPrice ? p.discountPrice : p.price;

  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory =
      categoryFilter === "الكل" || product.category === categoryFilter;

    const price = getEffectivePrice(product);

    const matchPrice = price >= priceFilter.min && price <= priceFilter.max;

    return matchSearch && matchCategory && matchPrice;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, priceFilter]);

  const productsPerPage = 9;

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  const filtersProps = {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    categories,
    selectedPriceValue,
    applyPrice,
    isFiltered,
    resetFilters,
  };

  return (
    <>
      <Navbar />

      <section dir="rtl" className="bg-background min-h-screen font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* العنوان - نفس بادينج وأنيميشن صفحة "من نحن" بالظبط */}
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
                تسوق
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
                اكتشف تشكيلة واسعة من المنتجات المختارة بعناية من موردين
                موثوقين، بأفضل الأسعار وأسهل طريقة للتسوق.
              </motion.p>
            </div>
          </div>

          {/* باقي المحتوى - بادينج سفلي منفصل عن العنوان */}
          <div className="pb-9 sm:pb-16">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* زرار الفلاتر على الموبايل */}
                <div className="flex justify-end mb-4 xl:hidden">
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-2 bg-surface border border-border text-primary text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm"
                  >
                    <SlidersHorizontal size={16} />
                    الفلاتر
                    {isFiltered && (
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </button>
                </div>

                <div className="flex gap-8 items-start">
                  {/* Sidebar الديسكتوب */}
                  <aside className="hidden xl:block w-64 shrink-0 bg-surface rounded-2xl border border-border p-6 sticky top-6 shadow-sm">
                    <FiltersContent {...filtersProps} />
                  </aside>

                  <div className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-320px)]">
                    {currentProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <h3 className="text-xl font-bold text-primary mb-2">
                          لا توجد منتجات
                        </h3>

                        <p className="text-grayText max-w-xs">
                          جرب تغيير البحث أو الفلاتر لعرض منتجات أكتر.
                        </p>

                        <button
                          onClick={resetFilters}
                          className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
                        >
                          إعادة تعيين الفلاتر
                        </button>
                      </div>
                    ) : (
                      /* ── تم تقليل الأعمدة إلى 3 في الديسكتوب لتكبير حجم الكروت ── */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentProducts.map((product) => {
                          const isFav = favorites.includes(product.id);
                          const inCart = cart.includes(product.id);

                          return (
                            <motion.div
                              key={product.id}
                              initial={{
                                opacity: 0,
                                y: 20,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                            >
                              <div
                                onClick={() => setSelectedProduct(product)}
                                className="relative aspect-square bg-background cursor-pointer overflow-hidden"
                              >
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-contain p-4"
                                />

                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                  <button
                                    onClick={(e) => toggleFavorite(e, product)}
                                    className="w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition"
                                  >
                                    <Heart
                                      size={18}
                                      className={
                                        isFav
                                          ? "fill-danger text-danger"
                                          : "text-grayText"
                                      }
                                    />
                                  </button>

                                  <button
                                    onClick={(e) => toggleCart(e, product)}
                                    className="w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-105 transition"
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
                                    <Maximize2
                                      size={17}
                                      className="text-grayText"
                                    />
                                  </button>
                                </div>
                              </div>

                              <div className="p-4 flex flex-col flex-1">
                                <h3 className="font-bold text-primary text-lg line-clamp-2">
                                  {product.name}
                                </h3>

                                <div className="flex items-center gap-2 mt-1 mb-4">
                                  {product.discountPrice ? (
                                    <>
                                      <span className="text-grayText text-base line-through">
                                        {product.price} ج.م
                                      </span>

                                      <span className="text-primary font-extrabold text-xl">
                                        {product.discountPrice} ج.م
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-primary font-extrabold text-xl">
                                      {product.price} ج.م
                                    </span>
                                  )}
                                </div>

                                <div className="border-t border-border pt-3 flex items-center justify-between gap-2 h-7 mt-auto">
                                  <span className="text-grayText text-sm font-semibold truncate">
                                    {product.shopName}
                                  </span>

                                  {product.category && (
                                    <span className="text-accent text-sm font-semibold shrink-0">
                                      {product.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                    {/* Pagination */}
                    {currentProducts.length > 0 && totalPages > 1 && (
                      <div className="flex justify-center mt-auto pt-8 gap-3 items-center flex-wrap">
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
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Drawer الفلاتر على الموبايل */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-primary/40 z-40 xl:hidden"
            />

            <motion.div
              key="drawer"
              dir="rtl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 300,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 xl:hidden bg-surface rounded-t-[24px] p-6 max-h-[80vh] overflow-y-auto"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-primary rounded-full hover:bg-background transition"
              >
                <X size={18} />
              </button>

              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              <FiltersContent {...filtersProps} />

              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-3.5 rounded-xl mt-4 transition-colors"
              >
                عرض {filteredProducts.length} نتيجة
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* بوب أب تكبير المنتج */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              dir="rtl"
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
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
