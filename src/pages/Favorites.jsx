import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AiFillHeart, AiOutlineClose } from "react-icons/ai";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Navbar from "../components/Navbar/Navbar";
import toast from "react-hot-toast";
import { FaShoppingCart } from "react-icons/fa";

export default function Favorites() {
  const [products, setProducts] = useState([]);
  const [favProducts, setFavProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState(() => {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    return localCart.reduce((acc, id) => ({ ...acc, [id]: true }), {});
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Fetch products (for display data: name, image, price...)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "Products"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        image: doc.data().imageUrl,
        price: doc.data().discountPrice
          ? doc.data().discountPrice
          : doc.data().price,
        realPrice: doc.data().price,
        category: doc.data().category,
        details: doc.data().description,
        outOfStock: doc.data().outOfStock || false,
      }));
      setProducts(data);
    });

    return () => unsub();
  }, []);

  // Build favorites list purely from localStorage
  const loadFavorites = (allProducts) => {
    const localFav = JSON.parse(localStorage.getItem("favorites")) || [];
    const filtered = allProducts.filter((p) => localFav.includes(p.id));
    setFavProducts(filtered);
  };

  useEffect(() => {
    loadFavorites(products);
  }, [products]);

  // Stay in sync if favorites change from another page (e.g. Products.jsx)
  useEffect(() => {
    const syncFavorites = () => loadFavorites(products);
    window.addEventListener("favoritesUpdated", syncFavorites);
    return () => window.removeEventListener("favoritesUpdated", syncFavorites);
  }, [products]);

  // Remove from favorites (localStorage only)
  const removeFavorite = (id) => {
    let localFav = JSON.parse(localStorage.getItem("favorites")) || [];
    localFav = localFav.filter((item) => item !== id);
    localStorage.setItem("favorites", JSON.stringify(localFav));
    window.dispatchEvent(new Event("favoritesUpdated"));

    setFavProducts((prev) => prev.filter((p) => p.id !== id));

    toast(`Removed from favorites`, {
      icon: <AiOutlineClose color="red" size={20} />,
    });
  };

  // Toggle cart (localStorage only)
  const toggleCart = (id, name, isOutOfStock) => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    const updatedCart = { ...cart, [id]: !cart[id] };
    const cartIds = Object.keys(updatedCart).filter((key) => updatedCart[key]);

    localStorage.setItem("cart", JSON.stringify(cartIds));
    window.dispatchEvent(new Event("cartUpdated"));

    if (updatedCart[id]) toast.success(`Added ${name} to cart`);
    else
      toast(`Removed ${name} from cart`, {
        icon: <AiOutlineClose color="red" size={20} />,
      });

    setCart(updatedCart);
  };

  // Pagination
  const productsPerPage = 6;
  const totalPages = Math.ceil(favProducts.length / productsPerPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const endIndex = currentPage * productsPerPage;
  const startIndex = endIndex - productsPerPage;

  const currentProducts = favProducts.slice(startIndex, endIndex);

  useEffect(() => {
    const totalPages = Math.ceil(favProducts.length / productsPerPage) || 1;

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [favProducts]);

  return (
    <>
      <Navbar />

      <section className="bg-background min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Title */}
          <motion.h2
            className="font-extrabold text-2xl sm:text-4xl md:text-4xl text-primary text-center leading-tight
            mb-10 md:mb-14 md:mt-7"
            initial={{ opacity: 0, y: -40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            Your Curated Favorite Products
          </motion.h2>

          {currentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-cente mt-24">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-24 w-24 text-grayText/50 mb-6 animate-bounce"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
       2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
       C13.09 3.81 14.76 3 16.5 3
       19.58 3 22 5.42 22 8.5
       c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>

              <h3 className="text-2xl font-semibold text-grayText mb-2">
                No Favorites Yet
              </h3>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {currentProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="group relative bg-surface border border-border rounded-3xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500 ${
                        product.outOfStock ? "opacity-60 grayscale" : ""
                      }`}
                    />

                    {/* Out of Stock Badge */}
                    {product.outOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <div className="bg-danger text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transform rotate-[-15deg]">
                          OUT OF STOCK
                        </div>
                      </div>
                    )}

                    {/* Remove Favorite Button */}
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="absolute top-4 right-4 bg-surface/95 p-2 rounded-full shadow hover:scale-105 transition z-50"
                    >
                      <AiFillHeart className="h-6 w-6 text-accent" />
                    </button>

                    <div className="absolute left-4 bottom-4 bg-accent text-white text-sm font-medium px-3 py-1 rounded-full shadow-md">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-1 sm:h-64">
                    <h3 className="text-2xl font-semibold text-primary">
                      {product.name}
                    </h3>
                    <p className="text-grayText mt-3 italic leading-relaxed">
                      {product.details}
                    </p>

                    <div className="flex items-center justify-between mt-6">
                      <div className="text-lg font-bold text-accent">
                        {product.outOfStock ? (
                          <span className="text-danger">Not Available</span>
                        ) : product.realPrice !== product.price ? (
                          <>
                            <span className="line-through text-grayText/60 mr-2">
                              {product.realPrice} EGP
                            </span>
                            {product.price} EGP
                          </>
                        ) : (
                          `${product.price} EGP`
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
                        className={`
    flex items-center justify-center gap-1 py-2 px-4 rounded-lg font-semibold transition shadow
    ${
      product.outOfStock
        ? "bg-grayText/30 text-grayText cursor-not-allowed"
        : cart[product.id]
          ? "bg-danger hover:bg-danger/90 text-white"
          : "bg-primary hover:bg-primary-hover text-white"
    }
  `}
                      >
                        {product.outOfStock ? (
                          "Out of Stock"
                        ) : cart[product.id] ? (
                          <>
                            Remove <FaShoppingCart size={20} color="white" />
                          </>
                        ) : (
                          "Add To Cart"
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          {/* Pagination */}
          {currentProducts.length > 0 && (
            <div className="flex justify-center mt-10 gap-3 items-center">
              {/* Previous Button */}
              <button
                onClick={() =>
                  currentPage > 1 && setCurrentPage(currentPage - 1)
                }
                disabled={currentPage === 1 || totalPages === 0}
                className={`px-4 py-2 rounded-lg border ${
                  currentPage === 1 || totalPages === 0
                    ? "bg-border text-grayText cursor-not-allowed"
                    : "bg-surface border-border text-primary hover:bg-primary hover:text-white"
                }`}
              >
                Previous
              </button>

              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg border ${
                    page === currentPage
                      ? "bg-primary text-white border-primary"
                      : "bg-surface border-border text-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() =>
                  currentPage < totalPages && setCurrentPage(currentPage + 1)
                }
                disabled={currentPage >= totalPages || totalPages === 0}
                className={`px-4 py-2 rounded-lg border ${
                  currentPage >= totalPages || totalPages === 0
                    ? "bg-border text-grayText cursor-not-allowed"
                    : "bg-surface border-border text-primary hover:bg-primary hover:text-white"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
