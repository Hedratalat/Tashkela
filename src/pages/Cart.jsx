import { motion } from "framer-motion";

import Navbar from "../components/Navbar/Navbar";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import {
  AiOutlineClose,
  AiOutlineDelete,
  AiOutlinePlus,
  AiOutlineMinus,
} from "react-icons/ai";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    return localCart.reduce((acc, id) => ({ ...acc, [id]: true }), {});
  });
  const [quantities, setQuantities] = useState(() => {
    const localQuantities =
      JSON.parse(localStorage.getItem("cartQuantities")) || {};
    return localQuantities;
  });

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Fetch products (for display data: name, image, price...)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Products"), (snap) => {
      const data = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          image: d.imageUrl,
          price: d.discountPrice ? d.discountPrice : d.price,
          realPrice: d.price,
          category: d.category,
          description: d.description,
        };
      });
      setProducts(data);
      localStorage.setItem("cartProducts", JSON.stringify(data));
    });
    return () => unsubscribe();
  }, []);

  // Stay in sync if cart changes from another page (e.g. Products.jsx)
  useEffect(() => {
    const syncCart = () => {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      const localQuantities =
        JSON.parse(localStorage.getItem("cartQuantities")) || {};
      setCart(localCart.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
      setQuantities(localQuantities);
    };

    window.addEventListener("cartUpdated", syncCart);
    return () => window.removeEventListener("cartUpdated", syncCart);
  }, []);

  // Update quantity function (localStorage only)
  const updateQuantity = (id, change, name) => {
    const currentQty = quantities[id] || 1;
    const newQty = currentQty + change;

    // If quantity becomes 0 or less, remove item from cart
    if (newQty <= 0) {
      removeFromCart(id, name);
      return;
    }

    const updatedQuantities = { ...quantities, [id]: newQty };
    setQuantities(updatedQuantities);
    localStorage.setItem("cartQuantities", JSON.stringify(updatedQuantities));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Remove from cart function (localStorage only)
  const removeFromCart = (id, name) => {
    const updatedCart = { ...cart };
    delete updatedCart[id];
    const cartIds = Object.keys(updatedCart);

    const updatedQuantities = { ...quantities };
    delete updatedQuantities[id];

    localStorage.setItem("cart", JSON.stringify(cartIds));
    localStorage.setItem("cartQuantities", JSON.stringify(updatedQuantities));
    window.dispatchEvent(new Event("cartUpdated"));

    toast.error(`Removed ${name} from cart`, {
      icon: <AiOutlineClose color="red" size={20} />,
    });

    setCart(updatedCart);
    setQuantities(updatedQuantities);
  };

  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce(
    (acc, item) => acc + Number(item.price || 0) * (quantities[item.id] || 1),
    0,
  );

  return (
    <>
      <Navbar />
      <section className="min-h-screen bg-background py-10 font-sans">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            className="font-extrabold text-2xl sm:text-4xl md:text-4xl text-primary text-center leading-tight
            mb-10 md:mb-14 md:mt-7"
            initial={{ opacity: 0, y: -40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            Your Cart Items
          </motion.h2>

          {/* Empty State */}
          {cartItems.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center mt-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated Icon */}
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-24 w-24 text-grayText/50 mb-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                initial={{ y: 0 }}
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6h15l-1.5 9H6L4 2H2"
                />
                <circle cx="9" cy="21" r="1" />
                <circle cx="18" cy="21" r="1" />
              </motion.svg>

              <h3 className="text-2xl font-semibold text-grayText mb-2">
                Your cart is empty
              </h3>
              <p className="text-grayText/70">
                Add some products to get started
              </p>
            </motion.div>
          )}

          {/* product */}
          {cartItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* left side product list */}
              <div className="lg:col-span-2 space-y-6">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-surface border border-border rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 p-5 relative">
                      {/* Delete Icon - Top Right */}
                      <button
                        onClick={() => removeFromCart(item.id, item.name)}
                        className="absolute top-2 right-2 text-white hover:text-white bg-danger/80 hover:bg-danger
                        p-2 rounded-full transition-all duration-300 border border-danger/80"
                      >
                        <AiOutlineDelete size={18} />
                      </button>

                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full sm:w-40 h-64 sm:h-40 object-cover rounded-xl"
                        />
                      </div>
                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-primary mb-2 pr-8">
                            {item.name}
                          </h3>
                          <p className="text-sm text-grayText mb-2">
                            {item.description}
                          </p>
                          <span className="inline-block bg-accent/10 text-accent text-sm font-medium px-3 py-1 rounded-full">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
                          {/* price */}
                          <div className="text-lg font-bold text-accent">
                            {item.realPrice !== item.price ? (
                              <>
                                <span className="line-through text-grayText/60 text-sm mr-2">
                                  {item.realPrice} EGP
                                </span>
                                <span>{item.price} EGP</span>
                              </>
                            ) : (
                              <span>{item.price} EGP</span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, -1, item.name)
                              }
                              className="p-2 hover:bg-background transition-colors"
                            >
                              <AiOutlineMinus size={16} />
                            </button>
                            <span className="px-4 py-2 font-semibold min-w-[40px] text-center text-primary">
                              {quantities[item.id] || 1}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, 1, item.name)
                              }
                              className="p-2 hover:bg-background transition-colors"
                            >
                              <AiOutlinePlus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* right side order*/}
              <div className="lg:col-span-1">
                {" "}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-surface border border-border rounded-2xl shadow-lg p-6 sticky top:24"
                >
                  <h3 className="text-2xl font-bold text-primary mb-6">
                    Order Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-grayText">
                      <span>
                        items (
                        {cartItems.reduce(
                          (acc, item) => acc + (quantities[item.id] || 1),
                          0,
                        )}
                        )
                      </span>
                      <span>{total.toFixed(2)} EGP</span>
                    </div>
                    <div className="border-t border-border pt-4 flex justify-between items-baseline">
                      <span className="text-lg font-semibold text-primary">
                        Total
                      </span>
                      <span className="text-3xl font-extrabold text-accent">
                        {total.toFixed(2)} EGP
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate("/checkout", {
                        state: { totalPrice: total.toFixed(2) },
                      })
                    }
                    className="w-full bg-primary hover:bg-primary-hover text-white
                  font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Proceed to Checkout
                  </button>
                  <p className="text-xs text-grayText text-center mt-4">
                    Shipping not included yet
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
