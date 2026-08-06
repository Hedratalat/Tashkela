import { useState } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { collection, serverTimestamp, setDoc, doc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function AddProducts() {
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    category: "",
    order: "",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !productData.name ||
      !productData.description ||
      !productData.price ||
      !productData.category ||
      !productData.imageUrl
    ) {
      return toast.error("Please fill in all required fields.");
    }
    setLoading(true);
    try {
      await setDoc(doc(collection(db, "Products")), {
        ...productData,
        price: parseFloat(productData.price),
        discountPrice: productData.discountPrice
          ? parseFloat(productData.discountPrice)
          : null,
        order: productData.order ? parseInt(productData.order) : null,
        createdAt: serverTimestamp(),
      });

      toast.success("Product added successfully!");
      setProductData({
        name: "",
        description: "",
        price: "",
        discountPrice: "",
        category: "",
        order: "",
        imageUrl: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error adding product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-border bg-background text-dark font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition placeholder:text-grayText";
  const labelClass = "block text-sm font-semibold text-dark font-sans mb-2";

  return (
    <div className="max-w-2xl ml-6">
      {/* Header */}
      <div className="mb-8">
        <motion.h2
          className="text-3xl font-sans font-bold text-dark"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Add New Product
        </motion.h2>
        <p className="text-grayText mt-1 font-sans text-sm">
          Fill in the details below to add a new product.
        </p>
      </div>

      {/* Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className={labelClass}>Product Name</label>
            <input
              type="text"
              name="name"
              value={productData.name}
              onChange={handleChange}
              placeholder="e.g. Nike Air Max 270"
              data-gramm="false"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={productData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter product description..."
              data-gramm="false"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className={labelClass}>Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={productData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className={inputClass}
            />
          </div>

          {/* Price & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Price (EGP)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grayText font-sans text-sm font-semibold">
                  EGP
                </span>
                <input
                  type="number"
                  name="price"
                  value={productData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`${inputClass} pl-14`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Discount Price{" "}
                <span className="text-grayText font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grayText font-sans text-sm font-semibold">
                  EGP
                </span>
                <input
                  type="number"
                  name="discountPrice"
                  value={productData.discountPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`${inputClass} pl-14`}
                />
              </div>
            </div>
          </div>

          {/* Category & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <input
                type="text"
                name="category"
                value={productData.category}
                onChange={handleChange}
                placeholder="e.g. Sneakers"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Display Order{" "}
                <span className="text-grayText font-normal">(optional)</span>
              </label>
              <input
                type="number"
                name="order"
                value={productData.order}
                onChange={handleChange}
                placeholder="e.g. 1, 2, 3..."
                min="1"
                className={inputClass}
              />
              <p className="text-xs text-grayText mt-1 font-sans">
                Lower numbers appear first.
              </p>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-sans font-semibold text-sm
              transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Uploading...
              </>
            ) : (
              "Add Product"
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
