import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Tag } from "lucide-react";
import { AiFillHeart, AiOutlineHeart, AiOutlineClose } from "react-icons/ai";
import { FaShoppingCart } from "react-icons/fa";
import Navbar from "../components/Navbar/Navbar";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";

const PAGE_SIZE = 9;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query_, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // favorites state (localStorage only)
  const [favorites, setFavorites] = useState(() => {
    const local = JSON.parse(localStorage.getItem("favorites")) || [];
    return local.reduce((acc, id) => ({ ...acc, [id]: true }), {});
  });

  // cart state (localStorage only)
  const [cart, setCart] = useState(() => {
    const local = JSON.parse(localStorage.getItem("cart")) || [];
    return local.reduce((acc, id) => ({ ...acc, [id]: true }), {});
  });

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
  };

  // Fetch products from Firestore in real time
  useEffect(() => {
    const q = query(collection(db, "Products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(data);
        // Keep a full products cache for Cart.jsx display
        localStorage.setItem("cartProducts", JSON.stringify(data));
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Keep favorites/cart in sync if changed from another page/component
  useEffect(() => {
    const syncFavorites = () => {
      const local = JSON.parse(localStorage.getItem("favorites")) || [];
      setFavorites(local.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
    };
    const syncCart = () => {
      const local = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(local.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
    };

    window.addEventListener("favoritesUpdated", syncFavorites);
    window.addEventListener("cartUpdated", syncCart);
    return () => {
      window.removeEventListener("favoritesUpdated", syncFavorites);
      window.removeEventListener("cartUpdated", syncCart);
    };
  }, []);

  // Categories built dynamically from the actual products
  const categories = useMemo(() => {
    const set = new Set(
      products.map((p) => p.category).filter((c) => c && c.trim() !== ""),
    );
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesQuery = product.name
        ?.toLowerCase()
        .includes(query_.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, query_, activeCategory]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query_, activeCategory]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Toggle favorite (localStorage only)
  const toggleFavorite = (id, name) => {
    const localFav = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFav = localFav.includes(id);

    const updated = isFav
      ? localFav.filter((item) => item !== id)
      : [...localFav, id];

    localStorage.setItem("favorites", JSON.stringify(updated));
    window.dispatchEvent(new Event("favoritesUpdated"));

    setFavorites((prev) => ({ ...prev, [id]: !isFav }));

    if (!isFav) {
      toast.success(`Added ${name} to favorites`);
    } else {
      toast(`Removed ${name} from favorites`, {
        icon: <AiOutlineClose color="red" size={20} />,
      });
    }
  };

  // Toggle cart (localStorage only)
  const toggleCart = (id, name, isOutOfStock) => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const inCart = localCart.includes(id);

    const updatedCart = inCart
      ? localCart.filter((item) => item !== id)
      : [...localCart, id];

    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // Handle quantities alongside the cart list
    const quantities = JSON.parse(localStorage.getItem("cartQuantities")) || {};
    if (inCart) {
      delete quantities[id];
    } else {
      quantities[id] = 1;
    }
    localStorage.setItem("cartQuantities", JSON.stringify(quantities));

    window.dispatchEvent(new Event("cartUpdated"));

    setCart((prev) => ({ ...prev, [id]: !inCart }));

    if (!inCart) {
      toast.success(`Added ${name} to cart`);
    } else {
      toast(`Removed ${name} from cart`, {
        icon: <AiOutlineClose color="red" size={20} />,
      });
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
              Shop
            </motion.p>

            <motion.h2
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary leading-[1.08]"
            >
              Find the Perfect Pair for You.
            </motion.h2>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="mt-6 text-base md:text-lg text-grayText leading-relaxed max-w-xl mx-auto"
            >
              Every model tried, checked, and approved before it reaches the
              shelf.
            </motion.p>
          </div>
        </section>

        {/* ---------- Search + Categories ---------- */}
        <section className="px-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
          >
            <div className="relative w-full md:max-w-xs">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-grayText"
              />
              <input
                type="text"
                value={query_}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sneakers..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface text-primary placeholder:text-grayText/70 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors duration-200 ${
                    activeCategory === category
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-grayText border-border hover:text-primary hover:border-primary"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ---------- Product Grid ---------- */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-10 h-10 rounded-full border-4 border-border border-t-accent"
                />
                <p className="text-grayText text-sm">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-primary font-semibold mb-1">
                  No sneakers found
                </p>
                <p className="text-grayText text-sm">
                  Try a different name or category.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((product, i) => (
                      <motion.div
                        key={product.id}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -20 }}
                        variants={{
                          hidden: { opacity: 0, y: 30 },
                          visible: (i) => ({
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.5,
                              delay: (i % 3) * 0.1,
                              ease: "easeOut",
                            },
                          }),
                          hover: {
                            y: -6,
                            boxShadow: "0 12px 30px -10px rgba(0,0,0,0.12)",
                            transition: {
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            },
                          },
                        }}
                        whileHover="hover"
                        className="relative bg-surface border border-border rounded-2xl overflow-hidden"
                      >
                        <div className="relative w-full aspect-square overflow-hidden bg-background">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="w-full h-full block"
                            aria-label={`Enlarge ${product.name}`}
                          >
                            <motion.img
                              src={product.imageUrl}
                              alt={product.name}
                              whileHover={{ scale: 1.06 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className={`w-full h-full object-cover cursor-zoom-in ${
                                product.outOfStock ? "opacity-60 grayscale" : ""
                              }`}
                            />
                          </button>

                          {product.outOfStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                              <div className="bg-danger text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transform rotate-[-15deg]">
                                OUT OF STOCK
                              </div>
                            </div>
                          )}

                          {/* Favorite Heart Button */}
                          <button
                            onClick={() =>
                              toggleFavorite(product.id, product.name)
                            }
                            aria-label="Toggle favorite"
                            className="absolute top-3 right-3 bg-surface/95 p-2 rounded-full shadow hover:scale-105 transition z-10"
                          >
                            {favorites[product.id] ? (
                              <AiFillHeart className="h-6 w-6 text-accent" />
                            ) : (
                              <AiOutlineHeart className="h-6 w-6 text-primary" />
                            )}
                          </button>
                        </div>

                        <div className="p-5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-2">
                            <Tag size={12} />
                            {product.category}
                          </div>
                          <h3 className="text-base font-bold text-primary mb-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-grayText leading-relaxed mb-4 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-extrabold text-primary">
                                {Number(product.price).toLocaleString()} EGP
                              </p>
                              {product.discountPrice && (
                                <p className="text-sm text-grayText line-through">
                                  {Number(
                                    product.discountPrice,
                                  ).toLocaleString()}{" "}
                                  EGP
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                toggleCart(
                                  product.id,
                                  product.name,
                                  product.outOfStock,
                                )
                              }
                              disabled={product.outOfStock}
                              className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg font-semibold text-sm transition shadow ${
                                product.outOfStock
                                  ? "bg-grayText/40 text-white cursor-not-allowed"
                                  : cart[product.id]
                                    ? "bg-danger hover:bg-danger/90 text-white"
                                    : "bg-primary hover:bg-primary-hover text-white"
                              }`}
                            >
                              {product.outOfStock ? (
                                "Out of Stock"
                              ) : cart[product.id] ? (
                                <>
                                  Remove <FaShoppingCart size={16} />
                                </>
                              ) : (
                                <>
                                  Add <FaShoppingCart size={16} />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* ---------- Pagination ---------- */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-full border border-border bg-surface text-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary transition-colors duration-200"
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors duration-200 ${
                            currentPage === page
                              ? "bg-primary text-white border border-primary"
                              : "bg-surface border border-border text-primary hover:border-primary"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-full border border-border bg-surface text-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary transition-colors duration-200"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* ---------- Image Lightbox ---------- */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 z-50 bg-primary/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-surface rounded-2xl overflow-hidden max-w-lg w-full"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Close"
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-surface/90 text-primary hover:bg-primary hover:text-white transition-colors duration-200"
              >
                <X size={18} />
              </button>

              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full aspect-square object-cover"
              />

              <div className="p-6">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-2">
                  <Tag size={12} />
                  {selectedProduct.category}
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">
                  {selectedProduct.name}
                </h3>
                <p className="text-sm text-grayText leading-relaxed mb-4">
                  {selectedProduct.description}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-extrabold text-primary">
                    {Number(selectedProduct.price).toLocaleString()} EGP
                  </p>
                  {selectedProduct.discountPrice && (
                    <p className="text-sm text-grayText line-through">
                      {Number(selectedProduct.discountPrice).toLocaleString()}{" "}
                      EGP
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
