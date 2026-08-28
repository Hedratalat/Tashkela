import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  MessageSquare,
  Calendar,
  Trash2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function FeedbackDash() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Delete popup
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling approve/reject
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const feedbacksQuery = query(
          collection(db, "Feedbacks"),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(feedbacksQuery);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFeedbacks(data);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "غير محدد";

    return timestamp.toDate().toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ---------------- Pagination ----------------

  const totalPages = Math.ceil(feedbacks.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentFeedbacks = feedbacks.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ---------------- Approve / Reject ----------------

  const toggleApproved = async (item) => {
    setUpdatingId(item.id);

    try {
      await updateDoc(doc(db, "Feedbacks", item.id), {
        approved: !item.approved,
      });

      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, approved: !f.approved } : f,
        ),
      );
    } catch (error) {
      console.error("Error updating feedback status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // ---------------- Delete ----------------

  const openDeletePopup = (item) => {
    setFeedbackToDelete(item);
  };

  const closeDeletePopup = () => {
    if (!isDeleting) {
      setFeedbackToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, "Feedbacks", feedbackToDelete.id));

      setFeedbacks((prev) =>
        prev.filter((item) => item.id !== feedbackToDelete.id),
      );

      setFeedbackToDelete(null);

      const newTotalPages = Math.ceil((feedbacks.length - 1) / itemsPerPage);

      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 font-sans"
    >
      {/* العنوان */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          آراء العملاء
        </h1>

        <p className="mt-2 text-grayText">
          مراجعة الفيدباك ووافق أو ارفض عرضه للعملاء
        </p>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full"
          />
        </div>
      )}

      {/* لا يوجد فيدباك */}
      {!loading && feedbacks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface border border-border rounded-2xl p-10 text-center"
        >
          <MessageSquare size={45} className="mx-auto text-grayText mb-4" />

          <h2 className="text-xl font-bold text-primary">لا يوجد فيدباك</h2>

          <p className="text-grayText mt-2">لم يتم إرسال أي آراء حتى الآن.</p>
        </motion.div>
      )}

      {/* الفيدباك */}
      {!loading && feedbacks.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {currentFeedbacks.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                whileHover={{ y: -4 }}
                className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-accent transition-all duration-200"
              >
                {/* الاسم + الحالة + الحذف */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent font-bold">
                      {item.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <h2 className="font-bold text-primary text-lg">
                        {item.name}
                      </h2>

                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          item.approved
                            ? "bg-success/10 text-success"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {item.approved ? "منشور" : "بانتظار المراجعة"}
                      </span>
                    </div>
                  </div>

                  {/* زر الحذف */}
                  <button
                    type="button"
                    onClick={() => openDeletePopup(item)}
                    aria-label="حذف الفيدباك"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-danger bg-danger/10 hover:bg-danger hover:text-white transition-all duration-200 shrink-0"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {/* البيانات */}
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-accent mt-0.5 shrink-0" />

                    <span className="text-grayText text-sm break-all">
                      {item.email}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar
                      size={18}
                      className="text-accent mt-0.5 shrink-0"
                    />

                    <p className="text-grayText text-sm">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                {/* نص الفيدباك */}
                <div className="mt-5 bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={17} className="text-accent" />

                    <span className="font-semibold text-primary text-sm">
                      نص الرأي
                    </span>
                  </div>

                  <p className="text-grayText text-sm leading-7 whitespace-pre-wrap">
                    {item.message}
                  </p>
                </div>

                {/* زر الموافقة / الرفض */}
                <button
                  type="button"
                  onClick={() => toggleApproved(item)}
                  disabled={updatingId === item.id}
                  className={`mt-5 w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${
                    item.approved
                      ? "border border-danger text-danger hover:bg-danger hover:text-white"
                      : "bg-success text-white hover:bg-success/90"
                  }`}
                >
                  {updatingId === item.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full"
                    />
                  ) : item.approved ? (
                    <>
                      <XCircle size={17} />
                      إلغاء النشر
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      نشر الرأي
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center justify-center gap-2 mt-8"
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-10 h-10 rounded-lg border border-border bg-surface text-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent hover:text-white hover:border-accent transition-all"
              >
                <ChevronRight size={18} />
              </button>

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

      {/* ================= Delete Popup ================= */}
      <AnimatePresence>
        {feedbackToDelete && (
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
                  <AlertTriangle size={28} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-primary text-center">
                حذف الرأي؟
              </h2>

              <p className="text-grayText text-center mt-3 leading-7">
                هل أنت متأكد أنك تريد حذف رأي
                <span className="font-bold text-primary mx-1">
                  {feedbackToDelete.name}
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
                  onClick={handleDelete}
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
    </main>
  );
}
