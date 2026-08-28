import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Trash2,
  Pencil,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const emptyForm = {
  badge: "",
  title: "",
  price: "",
  buttonText: "تسوق الآن",
  buttonLink: "/shop",
  imageUrl: "",
  order: 0,
  active: true,
};

export default function HeroDashboard() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Toast notification — replaces browser alert()
  const [toast, setToast] = useState(null); // { type: "success" | "error", message: string }

  // Delete confirmation — replaces window.confirm()
  const [deleteTarget, setDeleteTarget] = useState(null); // slide id pending deletion

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const q = query(collection(db, "heroSlides"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSlides(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching hero slides:", error);
        setLoading(false);
        showToast("error", "حصل خطأ أثناء تحميل الشرائح.");
      },
    );
    return () => unsubscribe();
  }, [showToast]);

  const openNewForm = () => {
    setFormData({ ...emptyForm, order: slides.length });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (slide) => {
    setFormData({
      badge: slide.badge || "",
      title: slide.title || "",
      price: slide.price || "",
      buttonText: slide.buttonText || "تسوق الآن",
      buttonLink: slide.buttonLink || "/shop",
      imageUrl: slide.imageUrl || "",
      order: slide.order ?? 0,
      active: slide.active ?? true,
    });
    setEditingId(slide.id);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "heroSlides", editingId), {
          ...formData,
          order: Number(formData.order),
          updatedAt: serverTimestamp(),
        });
        showToast("success", "تم تحديث الشريحة بنجاح.");
      } else {
        await addDoc(collection(db, "heroSlides"), {
          ...formData,
          order: Number(formData.order),
          createdAt: serverTimestamp(),
        });
        showToast("success", "تم إضافة الشريحة بنجاح.");
      }
      closeForm();
    } catch (err) {
      console.error("Error saving hero slide:", err);
      showToast("error", "حصل خطأ أثناء الحفظ، حاول تاني.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "heroSlides", deleteTarget));
      showToast("success", "تم حذف الشريحة.");
    } catch (err) {
      console.error("Error deleting hero slide:", err);
      showToast("error", "حصل خطأ أثناء الحذف.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans p-4 sm:p-8">
      {/* ---------- Toast notification (top of screen) ---------- */}
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
                <CheckCircle2 size={18} className="shrink-0" />
              ) : (
                <AlertCircle size={18} className="shrink-0" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-primary">
              إعدادات العرض الرئيسي
            </h2>
            <p className="text-grayText text-sm mt-1">
              أضف وعدّل الشرائح اللي بتظهر في أعلى الصفحة الرئيسية
            </p>
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors duration-200"
          >
            <Plus size={16} />
            شريحة جديدة
          </button>
        </div>

        {/* Slides list */}
        {loading ? (
          <p className="text-grayText text-sm">جاري التحميل...</p>
        ) : slides.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="text-grayText text-sm">
              لسه مفيش شرائح مضافة. دوس "شريحة جديدة" عشان تبدأ.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-background overflow-hidden shrink-0">
                  {slide.imageUrl ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-grayText text-xs">
                      لا توجد صورة
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-primary text-sm truncate">
                      {slide.title || "بدون عنوان"}
                    </p>
                    {!slide.active && (
                      <span className="text-[10px] font-semibold bg-danger/10 text-danger px-2 py-0.5 rounded-full shrink-0">
                        غير مفعّلة
                      </span>
                    )}
                  </div>
                  <p className="text-grayText text-xs truncate">
                    {slide.badge} • {slide.price ? `$${slide.price}` : ""} •
                    ترتيب: {slide.order}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditForm(slide)}
                    aria-label="تعديل"
                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-colors duration-200"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(slide.id)}
                    aria-label="حذف"
                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-danger hover:bg-danger hover:text-white transition-colors duration-200"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Form modal ---------- */}
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
              className="bg-surface rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-primary">
                  {editingId ? "تعديل الشريحة" : "شريحة جديدة"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="إغلاق"
                  className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  نص الـ Badge (مثال: عرض نهاية الأسبوع)
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  العنوان الرئيسي *
                </label>
                <textarea
                  name="title"
                  required
                  rows={2}
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  السعر (رقم بس)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    نص الزرار
                  </label>
                  <input
                    type="text"
                    name="buttonText"
                    value={formData.buttonText}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    رابط الزرار
                  </label>
                  <input
                    type="text"
                    name="buttonLink"
                    value={formData.buttonLink}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-1.5">
                  رابط صورة المنتج (URL) *
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  required
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-primary outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>
                <label className="flex items-center gap-2 pb-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="text-sm font-semibold text-primary">
                    مفعّلة (تظهر للزوار)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors duration-200 ${
                  isSaving ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isSaving ? "جاري الحفظ..." : "حفظ الشريحة"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Delete confirmation modal — replaces window.confirm() ---------- */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl shadow-lg w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-bold text-primary mb-2">
                حذف الشريحة؟
              </h3>
              <p className="text-grayText text-sm mb-6">
                متأكد إنك عايز تحذف الشريحة دي؟ الإجراء ده مش قابل للتراجع.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-background text-primary font-semibold text-sm py-2.5 rounded-xl hover:bg-border/50 transition-colors duration-200"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 bg-danger text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity duration-200"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
