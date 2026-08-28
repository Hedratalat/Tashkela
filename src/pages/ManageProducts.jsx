import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Trash2,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  category: "",
  categoryImageUrl: "",
  shopName: "",
  order: "",
  imageUrl: "",
  isNewArrival: false,
  isFeatured: false,
};

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Products"),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        data.sort((a, b) => {
          const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

          return orderA - orderB;
        });

        setProducts(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
        showToast("error", "حصل خطأ أثناء تحميل المنتجات.");
      },
    );

    return () => unsubscribe();
  }, [showToast]);

  // ================= Pagination =================

  const totalPages = Math.ceil(products.length / productsPerPage);

  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = products.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ================= Edit =================

  const openEditForm = (product) => {
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      discountPrice: product.discountPrice ?? "",
      category: product.category || "",
      categoryImageUrl: product.categoryImageUrl || "",
      shopName: product.shopName || "",
      order: product.order ?? "",
      imageUrl: product.imageUrl || "",
      isNewArrival: product.isNewArrival ?? false,
      isFeatured: product.isFeatured ?? false,
    });

    setEditingId(product.id);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= Save =================

  const handleSave = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.price ||
      !formData.category.trim() ||
      !formData.categoryImageUrl.trim() ||
      !formData.shopName.trim() ||
      !formData.imageUrl.trim()
    ) {
      showToast("error", "من فضلك املأ جميع الحقول المطلوبة.");
      return;
    }

    if (
      formData.discountPrice &&
      Number(formData.discountPrice) > Number(formData.price)
    ) {
      showToast("error", "سعر الخصم يجب أن يكون أقل من السعر الأصلي.");
      return;
    }

    setIsSaving(true);

    try {
      await updateDoc(doc(db, "Products", editingId), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        discountPrice: formData.discountPrice
          ? Number(formData.discountPrice)
          : null,
        category: formData.category.trim(),
        categoryImageUrl: formData.categoryImageUrl.trim(),
        shopName: formData.shopName.trim(),
        order: formData.order ? Number(formData.order) : null,
        imageUrl: formData.imageUrl.trim(),
        isNewArrival: Boolean(formData.isNewArrival),
        isFeatured: Boolean(formData.isFeatured),
        updatedAt: serverTimestamp(),
      });

      showToast("success", "تم تحديث المنتج بنجاح.");
      closeForm();
    } catch (error) {
      console.error("Error updating product:", error);
      showToast("error", "حصل خطأ أثناء تحديث المنتج.");
    } finally {
      setIsSaving(false);
    }
  };

  // ================= Delete =================

  const openDeletePopup = (product) => {
    setDeleteTarget(product);
  };

  const closeDeletePopup = () => {
    if (!isDeleting) {
      setDeleteTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, "Products", deleteTarget.id));

      setProducts((prev) =>
        prev.filter((product) => product.id !== deleteTarget.id),
      );

      showToast("success", "تم حذف المنتج بنجاح.");

      const newTotalPages = Math.ceil((products.length - 1) / productsPerPage);

      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("error", "حصل خطأ أثناء حذف المنتج.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-sans p-4 sm:p-8">
      {/* ================= Toast ================= */}

      <div className="fixed top-4 inset-x-0 flex justify-center z-[60] px-4 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className={`pointer-events-auto flex items-center gap-2.5 max-w-md w-full sm:w-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
                toast.type === "success"
                  ? "bg-success/10 border-success/30 text-success"
                  : "bg-danger/10 border-danger/30 text-danger"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}

              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* ================= Header ================= */}

        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-primary">
            إدارة المنتجات
          </h2>

          <p className="text-grayText text-sm mt-1">
            عدّل بيانات المنتجات أو احذف أي منتج من المتجر.
          </p>
        </div>

        {/* ================= Products ================= */}

        {loading ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="text-grayText text-sm">جاري تحميل المنتجات...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="text-grayText text-sm">
              لا توجد منتجات مضافة حتى الآن.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                  className="bg-surface border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  {/* Images */}

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Product Image */}

                    <div className="w-20 h-20 rounded-xl bg-background overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name || "صورة المنتج"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-grayText text-xs text-center p-1">
                          لا توجد صورة
                        </div>
                      )}
                    </div>

                    {/* Category Image */}

                    <div className="w-16 h-16 rounded-xl bg-background overflow-hidden border border-border">
                      {product.categoryImageUrl ? (
                        <img
                          src={product.categoryImageUrl}
                          alt={product.category || "صورة التصنيف"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-grayText">
                          <ImageIcon size={18} />

                          <span className="text-[9px] mt-1">التصنيف</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-primary text-sm">
                        {product.name || "بدون اسم"}
                      </p>

                      {product.isNewArrival && (
                        <span className="text-[10px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          وصل حديثًا
                        </span>
                      )}

                      {product.isFeatured && (
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          منتج مميز
                        </span>
                      )}
                    </div>

                    <p className="text-grayText text-xs mb-1">
                      {product.shopName || "بدون اسم محل"} •{" "}
                      {product.category || "بدون تصنيف"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-primary">
                        {product.discountPrice
                          ? `${product.discountPrice} ج.م`
                          : `${product.price ?? 0} ج.م`}
                      </span>

                      {product.discountPrice && product.price && (
                        <span className="text-grayText line-through">
                          {product.price} ج.م
                        </span>
                      )}

                      {product.order !== null &&
                        product.order !== undefined && (
                          <span className="text-grayText">
                            • الترتيب: {product.order}
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Actions */}

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-primary hover:bg-accent hover:text-white transition"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openDeletePopup(product)}
                      className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-danger hover:bg-danger hover:text-white transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ================= Pagination ================= */}

            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-2 mt-8"
              >
                {/* السابق */}

                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="w-10 h-10 rounded-lg border border-border bg-surface text-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent hover:text-white hover:border-accent transition-all"
                >
                  <ChevronRight size={18} />
                </button>

                {/* أرقام الصفحات */}

                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center font-semibold transition-all ${
                        currentPage === page
                          ? "bg-accent text-white border-accent"
                          : "bg-surface text-primary border-border hover:bg-accent hover:text-white hover:border-accent"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* التالي */}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="w-10 h-10 rounded-lg border border-border bg-surface text-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent hover:text-white hover:border-accent transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ================= Edit Modal ================= */}

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={closeForm}
          >
            <motion.form
              onSubmit={handleSave}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary">تعديل المنتج</h2>

                <button
                  type="button"
                  onClick={closeForm}
                  className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              {/* اسم المنتج */}

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  اسم المنتج *
                </label>

                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* اسم المحل */}

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  اسم المحل *
                </label>

                <input
                  type="text"
                  name="shopName"
                  required
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* الوصف */}

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  وصف المنتج *
                </label>

                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none resize-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* صورة المنتج */}

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  رابط صورة المنتج *
                </label>

                <input
                  type="url"
                  name="imageUrl"
                  required
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* الأسعار */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    السعر *
                  </label>

                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    سعر الخصم
                  </label>

                  <input
                    type="number"
                    name="discountPrice"
                    min="0"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary"
                  />
                </div>
              </div>

              {/* التصنيف + صورة التصنيف */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    التصنيف *
                  </label>

                  <input
                    type="text"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    صورة التصنيف *
                  </label>

                  <div className="relative">
                    <ImageIcon
                      size={17}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-grayText"
                    />

                    <input
                      type="url"
                      name="categoryImageUrl"
                      required
                      value={formData.categoryImageUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-background text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* معاينة صورة التصنيف */}

              {formData.categoryImageUrl && (
                <div className="bg-background border border-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary mb-3">
                    معاينة صورة التصنيف
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-border bg-surface">
                      <img
                        src={formData.categoryImageUrl}
                        alt={formData.category || "صورة التصنيف"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {formData.category || "بدون تصنيف"}
                      </p>

                      <p className="text-xs text-grayText mt-1">
                        صورة التصنيف الحالية
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* الترتيب */}

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  ترتيب العرض
                </label>

                <input
                  type="number"
                  name="order"
                  min="1"
                  value={formData.order}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary"
                />
              </div>

              {/* خيارات المنتج */}

              <div className="bg-background border border-border rounded-xl p-4">
                <p className="text-sm font-semibold text-primary mb-3">
                  خيارات ظهور المنتج
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isNewArrival"
                      checked={formData.isNewArrival}
                      onChange={handleChange}
                      className="w-5 h-5 accent-accent"
                    />

                    <div>
                      <p className="text-sm font-semibold text-primary">
                        وصل حديثًا
                      </p>

                      <p className="text-xs text-grayText">
                        يظهر ضمن المنتجات الجديدة.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="w-5 h-5 accent-accent"
                    />

                    <div>
                      <p className="text-sm font-semibold text-primary">
                        منتج مميز
                      </p>

                      <p className="text-xs text-grayText">
                        يظهر ضمن المنتجات المميزة.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl ${
                  isSaving ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isSaving ? "جاري حفظ التعديلات..." : "حفظ التعديلات"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= Delete Popup ================= */}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeDeletePopup}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6"
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                  <Trash2 size={28} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-primary text-center">
                حذف المنتج؟
              </h2>

              <p className="text-grayText text-center mt-3 leading-7">
                هل أنت متأكد أنك تريد حذف المنتج
                <span className="font-bold text-primary mx-1">
                  {deleteTarget.name}
                </span>
                ؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeDeletePopup}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl border border-border text-primary font-semibold hover:bg-background transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                      />
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      حذف
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
