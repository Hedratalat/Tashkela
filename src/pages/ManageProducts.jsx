import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";

const PAGE_SIZE = 6;

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-border bg-background text-dark font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition placeholder:text-grayText";
  const labelClass = "block text-sm font-semibold text-dark font-sans mb-2";

  // Fetch products in real time
  useEffect(() => {
    const q = query(collection(db, "Products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Failed to load products.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Unique categories for the select filter
  const categories = useMemo(() => {
    const set = new Set(
      products.map((p) => p.category).filter((c) => c && c.trim() !== ""),
    );
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filtering by search + category
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        term === "" ||
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term);
      const matchesCategory =
        categoryFilter === "All" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Edit handlers
  const openEdit = (product) => {
    setEditingProduct(product);
    setEditData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      discountPrice: product.discountPrice ?? "",
      category: product.category || "",
      order: product.order ?? "",
      imageUrl: product.imageUrl || "",
    });
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setEditData(null);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
    if (
      !editData.name ||
      !editData.description ||
      !editData.price ||
      !editData.category ||
      !editData.imageUrl
    ) {
      return toast.error("Please fill in all required fields.");
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "Products", editingProduct.id), {
        name: editData.name,
        description: editData.description,
        price: parseFloat(editData.price),
        discountPrice: editData.discountPrice
          ? parseFloat(editData.discountPrice)
          : null,
        category: editData.category,
        order: editData.order ? parseInt(editData.order) : null,
        imageUrl: editData.imageUrl,
      });
      toast.success("Product updated successfully!");
      closeEdit();
    } catch (error) {
      console.error(error);
      toast.error("Error updating product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteConfirm = (product) => {
    setDeletingProduct(product);
  };

  const closeDeleteConfirm = () => {
    setDeletingProduct(null);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "Products", deletingProduct.id));
      toast.success("Product deleted successfully!");
      closeDeleteConfirm();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting product. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl ml-6">
      {/* Header */}
      <div className="mb-8">
        <motion.h2
          className="text-3xl font-sans font-bold text-dark"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Manage Products
        </motion.h2>
        <p className="text-grayText mt-1 font-sans text-sm">
          View, edit, or delete your products.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className={labelClass}>Search</label>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:w-56">
          <label className={labelClass}>Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputClass}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="text-center py-16 text-grayText font-sans text-sm">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-grayText font-sans text-sm">
          No products found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {paginatedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col"
                >
                  {product.imageUrl && (
                    <div className="w-full h-40 bg-background overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-sans font-semibold text-dark text-base line-clamp-1">
                          {product.name}
                        </h3>
                        {product.category && (
                          <span className="shrink-0 text-xs font-sans font-semibold px-2 py-1 rounded-lg bg-background text-grayText border border-border">
                            {product.category}
                          </span>
                        )}
                      </div>

                      <p className="text-grayText text-sm font-sans mt-2 line-clamp-3">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-accent font-sans font-bold text-sm">
                          EGP {product.price}
                        </span>
                        {product.discountPrice && (
                          <span className="text-grayText font-sans text-xs line-through">
                            EGP {product.discountPrice}
                          </span>
                        )}
                      </div>

                      {product.order !== null &&
                        product.order !== undefined && (
                          <p className="text-xs text-grayText font-sans mt-1">
                            Order: {product.order}
                          </p>
                        )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <button
                        onClick={() => openEdit(product)}
                        className="flex-1 py-2 rounded-xl bg-background hover:bg-border text-dark font-sans font-semibold text-sm transition-all duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(product)}
                        className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-sans font-semibold text-sm transition-all duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-border bg-surface text-dark font-sans text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl font-sans text-sm font-semibold transition ${
                      currentPage === page
                        ? "bg-accent text-white"
                        : "bg-surface border border-border text-dark hover:bg-background"
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
                className="px-4 py-2 rounded-xl border border-border bg-surface text-dark font-sans text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={closeEdit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl shadow-lg border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-sans font-bold text-dark mb-4">
                Edit Product
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={editData.imageUrl}
                    onChange={handleEditChange}
                    placeholder="https://example.com/image.jpg"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Price (EGP)</label>
                    <input
                      type="number"
                      name="price"
                      value={editData.price}
                      onChange={handleEditChange}
                      min="0"
                      step="0.01"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Discount Price{" "}
                      <span className="text-grayText font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="number"
                      name="discountPrice"
                      value={editData.discountPrice}
                      onChange={handleEditChange}
                      min="0"
                      step="0.01"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Category</label>
                    <input
                      type="text"
                      name="category"
                      value={editData.category}
                      onChange={handleEditChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Display Order{" "}
                      <span className="text-grayText font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={editData.order}
                      onChange={handleEditChange}
                      min="1"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeEdit}
                  className="flex-1 py-3 rounded-xl border border-border bg-background text-dark font-sans font-semibold text-sm hover:bg-border transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-sans font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={closeDeleteConfirm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl shadow-lg border border-border p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-sans font-bold text-dark mb-2">
                Delete Product
              </h3>
              <p className="text-grayText font-sans text-sm mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-dark">
                  {deletingProduct.name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeDeleteConfirm}
                  className="flex-1 py-3 rounded-xl border border-border bg-background text-dark font-sans font-semibold text-sm hover:bg-border transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-sans font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
