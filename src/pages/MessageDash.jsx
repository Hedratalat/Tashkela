import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Trash2,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function MessageDash() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 6;

  // Delete popup
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messagesQuery = query(
          collection(db, "Messages"),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(messagesQuery);

        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "غير محدد";

    return timestamp.toDate().toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ---------------- Pagination ----------------

  const totalPages = Math.ceil(messages.length / messagesPerPage);

  const startIndex = (currentPage - 1) * messagesPerPage;

  const currentMessages = messages.slice(
    startIndex,
    startIndex + messagesPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ---------------- Delete ----------------

  const openDeletePopup = (message) => {
    setMessageToDelete(message);
  };

  const closeDeletePopup = () => {
    if (!isDeleting) {
      setMessageToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (!messageToDelete) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, "Messages", messageToDelete.id));

      // حذف الرسالة من الشاشة مباشرة
      setMessages((prev) =>
        prev.filter((message) => message.id !== messageToDelete.id),
      );

      setMessageToDelete(null);

      // لو الصفحة الحالية بقت فاضية بعد الحذف
      const newTotalPages = Math.ceil((messages.length - 1) / messagesPerPage);

      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">الرسائل</h1>

        <p className="mt-2 text-grayText">الرسائل المرسلة من نموذج التواصل</p>
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

      {/* لا توجد رسائل */}
      {!loading && messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface border border-border rounded-2xl p-10 text-center"
        >
          <MessageSquare size={45} className="mx-auto text-grayText mb-4" />

          <h2 className="text-xl font-bold text-primary">لا توجد رسائل</h2>

          <p className="text-grayText mt-2">لم يتم إرسال أي رسائل حتى الآن.</p>
        </motion.div>
      )}

      {/* الرسائل */}
      {!loading && messages.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {currentMessages.map((item, index) => (
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
                {/* الاسم + الحذف */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent font-bold">
                      {item.fullName?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <h2 className="font-bold text-primary text-lg">
                        {item.fullName}
                      </h2>

                      <p className="text-grayText text-xs">رسالة جديدة</p>
                    </div>
                  </div>

                  {/* زر الحذف */}
                  <button
                    type="button"
                    onClick={() => openDeletePopup(item)}
                    aria-label="حذف الرسالة"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-danger bg-danger/10 hover:bg-danger hover:text-white transition-all duration-200"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {/* البيانات */}
                <div className="space-y-3 border-t border-border pt-4">
                  {/* البريد */}
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-accent mt-0.5 shrink-0" />

                    <a
                      href={`mailto:${item.email}`}
                      className="text-grayText text-sm break-all hover:text-accent transition-colors"
                    >
                      {item.email}
                    </a>
                  </div>

                  {/* الهاتف */}
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-accent mt-0.5 shrink-0" />

                    <a
                      href={`tel:${item.phone}`}
                      className="text-grayText text-sm hover:text-accent transition-colors"
                    >
                      {item.phone}
                    </a>
                  </div>

                  {/* التاريخ */}
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

                {/* الرسالة */}
                <div className="mt-5 bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={17} className="text-accent" />

                    <span className="font-semibold text-primary text-sm">
                      محتوى الرسالة
                    </span>
                  </div>

                  <p className="text-grayText text-sm leading-7 whitespace-pre-wrap">
                    {item.message}
                  </p>
                </div>
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

      {/* ================= Delete Popup ================= */}
      <AnimatePresence>
        {messageToDelete && (
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
              {/* أيقونة التحذير */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                  <AlertTriangle size={28} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-primary text-center">
                حذف الرسالة؟
              </h2>

              <p className="text-grayText text-center mt-3 leading-7">
                هل أنت متأكد أنك تريد حذف رسالة
                <span className="font-bold text-primary mx-1">
                  {messageToDelete.fullName}
                </span>
                ؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </p>

              {/* الأزرار */}
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

              {/* زر إغلاق */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
