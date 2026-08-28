import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";
import Navbar from "../components/Navbar/Navbar";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // لو اليوزر جديد، احفظه في collection "users"
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          fullName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
        });
      }

      navigate("/");
    } catch (err) {
      console.error("Google login error:", err);
      setError("حصل خطأ أثناء تسجيل الدخول، حاول تاني.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-surface font-sans flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-sm p-8 text-center"
        >
          <h2 className="text-2xl font-extrabold text-primary mb-2">
            أهلاً بيك
          </h2>
          <p className="text-grayText text-sm mb-8">
            سجّل دخولك بحساب Google للمتابعة
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm font-medium px-4 py-3">
              {error}
            </div>
          )}

          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`w-full flex items-center justify-center gap-3 bg-white border border-border text-primary font-semibold py-3.5 rounded-xl hover:bg-background transition-colors duration-200 ${
              isLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16 4 9.1 8.5 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.3C29.5 34.9 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9 39.5 15.9 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.3C41.5 35.9 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z"
              />
            </svg>
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول بحساب Google"}
          </motion.button>
        </motion.div>
      </main>
    </>
  );
}
