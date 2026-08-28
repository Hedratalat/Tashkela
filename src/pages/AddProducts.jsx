import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Store,
  Package,
  Image as ImageIcon,
  Tag,
  Star,
} from "lucide-react";

const emptyForm = {
  shopName: "",
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  category: "",
  categoryImageUrl: "",
  order: "",
  imageUrl: "",
  isNewArrival: false,
  isFeatured: false,
};

export default function AddProducts() {
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.shopName.trim() ||
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.price ||
      !formData.category.trim() ||
      !formData.categoryImageUrl.trim() ||
      !formData.imageUrl.trim()
    ) {
      showToast("error", "من فضلك املأ جميع الحقول المطلوبة.");
      return;
    }

    if (Number(formData.price) < 0) {
      showToast("error", "السعر يجب أن يكون أكبر من أو يساوي صفر.");
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
      await addDoc(collection(db, "Products"), {
        shopName: formData.shopName.trim(),

        name: formData.name.trim(),

        description: formData.description.trim(),

        price: Number(formData.price),

        discountPrice: formData.discountPrice
          ? Number(formData.discountPrice)
          : null,

        category: formData.category.trim(),

        categoryImageUrl: formData.categoryImageUrl.trim(),

        order: formData.order ? Number(formData.order) : null,

        imageUrl: formData.imageUrl.trim(),

        isNewArrival: Boolean(formData.isNewArrival),

        isFeatured: Boolean(formData.isFeatured),

        createdAt: serverTimestamp(),
      });

      showToast("success", "تمت إضافة المنتج بنجاح.");

      setFormData(emptyForm);
    } catch (error) {
      console.error("Error adding product:", error);

      showToast("error", "حصل خطأ أثناء إضافة المنتج، حاول مرة أخرى.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-sans p-4 sm:p-8">
      {/* Toast */}
      <div className="fixed top-4 inset-x-0 flex justify-center z-[60] px-4 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Package size={22} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
              إضافة منتج جديد
            </h2>
          </div>

          <p className="text-grayText text-sm">
            أضف بيانات المنتج ليظهر في المتجر أمام العملاء.
          </p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl shadow-sm p-5 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* اسم المحل */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                اسم المحل *
              </label>

              <div className="relative">
                <Store
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-grayText"
                />

                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="مثال: متجر الأمل"
                  className="w-full pr-11 pl-4 py-3 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>

            {/* اسم المنتج */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                اسم المنتج *
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="مثال: سماعة لاسلكية"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            {/* الوصف */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                وصف المنتج *
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="اكتب وصفًا واضحًا ومفصلًا عن المنتج..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary outline-none resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            {/* صورة المنتج */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                رابط صورة المنتج *
              </label>

              <div className="relative">
                <ImageIcon
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-grayText"
                />

                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/product.jpg"
                  className="w-full pr-11 pl-4 py-3 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>

            {/* الأسعار */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  السعر الأصلي *
                </label>

                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 pl-16 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grayText text-sm font-semibold">
                    ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  سعر الخصم{" "}
                  <span className="text-grayText font-normal">(اختياري)</span>
                </label>

                <div className="relative">
                  <input
                    type="number"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 pl-16 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grayText text-sm font-semibold">
                    ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* التصنيف */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  التصنيف *
                </label>

                <div className="relative">
                  <Tag
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-grayText"
                  />

                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="مثال: إلكترونيات"
                    className="w-full pr-11 pl-4 py-3 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
              </div>

              {/* صورة التصنيف */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  صورة التصنيف *
                </label>

                <div className="relative">
                  <ImageIcon
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-grayText"
                  />

                  <input
                    type="url"
                    name="categoryImageUrl"
                    value={formData.categoryImageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/category.jpg"
                    className="w-full pr-11 pl-4 py-3 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* الترتيب */}
            <div>
              <label className="block text-sm font-semibold text-primary mb-2">
                ترتيب العرض{" "}
                <span className="text-grayText font-normal">(اختياري)</span>
              </label>

              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min="1"
                placeholder="مثال: 1"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />

              <p className="text-xs text-grayText mt-1.5">
                الأرقام الأصغر تظهر أولًا.
              </p>
            </div>

            {/* الخيارات */}
            <div className="border border-border rounded-2xl p-5 bg-background">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-accent" />

                <h3 className="font-bold text-primary">خيارات ظهور المنتج</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    formData.isNewArrival
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="isNewArrival"
                    checked={formData.isNewArrival}
                    onChange={handleChange}
                    className="w-5 h-5 accent-accent"
                  />

                  <div>
                    <p className="font-bold text-primary text-sm">وصل حديثًا</p>

                    <p className="text-xs text-grayText mt-1">
                      يظهر ضمن المنتجات الجديدة.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    formData.isFeatured
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="w-5 h-5 accent-accent"
                  />

                  <div>
                    <p className="font-bold text-primary text-sm">منتج مميز</p>

                    <p className="text-xs text-grayText mt-1">
                      يظهر ضمن المنتجات المميزة.
                    </p>
                  </div>
                </label>
              </div>

              <p className="text-xs text-grayText mt-4">
                يمكنك اختيار واحد منهما أو الاثنين معًا.
              </p>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSaving}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold transition ${
                isSaving ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? (
                "جاري إضافة المنتج..."
              ) : (
                <>
                  <Plus size={18} />
                  إضافة المنتج
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
