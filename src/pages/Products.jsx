import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Tag } from "lucide-react";
import Navbar from "../components/Navbar/Navbar";

// ---------------------------------------------------------------------------
// Product data — images below are real sneaker photos pulled by keyword
// (via loremflickr) so the grid looks right immediately. Swap the `image`
// values for your own product photography whenever it's ready
// (e.g. /assets/products/air-max.png).
// ---------------------------------------------------------------------------
const PRODUCTS = [
  {
    id: 1,
    name: "Air Stride Runner",
    category: "Running",
    price: 2450,
    image: "/OIP (1).jfif",
    details:
      "Lightweight mesh upper with responsive cushioning, built for daily mileage.",
  },
  {
    id: 2,
    name: "Urban Classic Low",
    category: "Lifestyle",
    price: 1950,
    image: "/OIP (8).jfif",
    details: "A clean everyday low-top with a leather finish and soft insole.",
  },
  {
    id: 3,
    name: "Trail Grip XT",
    category: "Training",
    price: 2800,
    image: "/OIP (2).jfif",
    details:
      "Aggressive lugged outsole and a locked-down fit for off-road training.",
  },
  {
    id: 4,
    name: "Velocity Knit",
    category: "Running",
    price: 2650,
    image: "/OIP (9).jfif",
    details:
      "Sock-like knit construction that moves with your foot, not against it.",
  },
  {
    id: 5,
    name: "Heritage Canvas",
    category: "Lifestyle",
    price: 1450,
    image: "/OIP (4).jfif",
    details:
      "A timeless canvas silhouette — simple, durable, goes with everything.",
  },
  {
    id: 6,
    name: "Power Lift Trainer",
    category: "Training",
    price: 2990,
    image: "/OIP (5).jfif",
    details:
      "Flat, stable base built for lifting days and short interval work.",
  },
  {
    id: 7,
    name: "Skyline Pro",
    category: "Training",
    price: 3350,
    image: "/OIP (6).jfif",
    details: "Extra cushioning and a supportive fit for long, active days.",
  },
  {
    id: 8,
    name: "Court Force High",
    category: "Lifestyle",
    price: 3100,
    image: "/OIP (7).jfif",
    details: "High-top silhouette with a bold profile for everyday streetwear.",
  },
];

const CATEGORIES = ["All", "Running", "Lifestyle", "Training"];

export default function Products() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesQuery = product.name
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sneakers..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-surface text-primary placeholder:text-grayText/70 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
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
            {filteredProducts.length === 0 ? (
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
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
                    className="bg-surface border border-border rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-full aspect-square overflow-hidden bg-background block"
                      aria-label={`Enlarge ${product.name}`}
                    >
                      <motion.img
                        src={product.image}
                        alt={product.name}
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full h-full object-cover cursor-zoom-in"
                      />
                    </button>

                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-2">
                        <Tag size={12} />
                        {product.category}
                      </div>
                      <h3 className="text-base font-bold text-primary mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-grayText leading-relaxed mb-4">
                        {product.details}
                      </p>
                      <p className="text-lg font-extrabold text-primary">
                        {product.price.toLocaleString()} EGP
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                src={selectedProduct.image}
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
                  {selectedProduct.details}
                </p>
                <p className="text-lg font-extrabold text-primary">
                  {selectedProduct.price.toLocaleString()} EGP
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
