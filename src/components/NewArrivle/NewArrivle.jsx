import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Heart, ShoppingBag, Maximize2, X } from "lucide-react";
import toast from "react-hot-toast";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function NewArrivle() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "Products"),
          where("isNewArrival", "==", true),
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // الترتيب بالكود بدل orderBy (تفادي الحاجة لـ composite index)
        data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        setProducts(data);
      } catch (error) {
        console.error("Error fetching new arrivals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  // ── قراءة الفيفوريت/الكارت لحظيًا (متزامنة مع باقي الموقع) ──
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

  return (
    <section
      dir="rtl"
      className="bg-background font-sans py-10 px-4 sm:px-8 mt-16 "
    >
      <div className="max-w-7xl mx-auto ">
        {/* العنوان */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary whitespace-nowrap">
            وصل حديثًا
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-grayText py-10">
            لا توجد منتجات جديدة حاليًا.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.slice(0, 8).map((product) => {
                const isFav = favorites.includes(product.id);
                const inCart = cart.includes(product.id);

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                  >
                    {/* الصورة */}
                    <div
                      onClick={() => setSelectedProduct(product)}
                      className="relative aspect-square bg-background cursor-pointer overflow-hidden"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain p-4"
                      />

                      {/* أيقونات القلب و الشوب و الـ Expand */}
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
                            className={inCart ? "text-accent" : "text-grayText"}
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

                      {/* اسم المحل + التصنيف - ارتفاع ثابت عشان الكروت متتفرقش لو الاسم طويل */}
                      <div className="border-t border-border pt-3 flex items-center justify-between gap-2 h-7 mt-auto">
                        <span className="text-grayText text-base font-semibold truncate">
                          {product.shopName}
                        </span>
                        {product.category && (
                          <span className="text-accent text-base font-semibold shrink-0">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* زرار عرض المزيد */}
            <div className="flex justify-center mt-10">
              <Link
                to="/shop"
                className="px-8 py-3 rounded-xl border border-primary text-primary font-bold hover:bg-accent hover:text-white hover:border-accent transition"
              >
                عرض المزيد
              </Link>
            </div>
          </>
        )}
      </div>

      {/* الـ Popup */}
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
    </section>
  );
}
