import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  Mail,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase";

const navLinks = [
  { label: "الرئيسية", path: "/" },
  { label: "من نحن", path: "/about" },
  { label: "المتجر", path: "/products" },
  { label: "تتبع الطلب", path: "/track-order" },
  { label: "تواصل معنا", path: "/contact" },
];

export default function Navbar({ overlay = false }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [user, setUser] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const mobileAccountMenuRef = useRef(null);

  // Track auth state so the account icon can reflect logged-in / logged-out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ── قراءة عدد المفضلة والسلة لحظيًا (متزامنة مع باقي الموقع) ──
  useEffect(() => {
    if (!user) {
      setFavoritesCount(0);
      setCartCount(0);
      return;
    }

    const userRef = doc(db, "Users", user.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        setFavoritesCount((data.favorites || []).length);
        setCartCount((data.cart || []).length);
      } else {
        setFavoritesCount(0);
        setCartCount(0);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Close either account dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target)
      ) {
        setAccountMenuOpen(false);
      }
      if (
        mobileAccountMenuRef.current &&
        !mobileAccountMenuRef.current.contains(e.target)
      ) {
        setMobileAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // First letter of the user's name (or email as fallback) for the avatar
  const firstLetter =
    user?.displayName?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    null;

  const handleLogout = async () => {
    await signOut(auth);
    setAccountMenuOpen(false);
    setMobileAccountMenuOpen(false);
    navigate("/");
  };

  const handleLoginClick = () => {
    setAccountMenuOpen(false);
    setMobileAccountMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="relative w-full bg-background">
      {/* ---------- Top row: logo + search + support ---------- */}
      {/* Fixed row height (h-20 / h-24) so a large logo doesn't push or misalign the search bar and support info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between gap-4">
        {/* Logo — replace with your own logo image */}
        <a href="/" className="shrink-0 h-full flex items-center py-2">
          <img
            src="/imagee.png"
            alt="الشعار"
            className="h-full w-auto max-w-[160px] sm:max-w-[200px] object-contain"
          />
        </a>

        {/* Search bar — hidden on small screens */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="flex w-full rounded-xl overflow-hidden border border-border">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="flex-1 bg-background px-4 py-2.5 text-sm text-primary placeholder:text-grayText outline-none"
            />
            <button
              type="button"
              aria-label="بحث"
              className="bg-primary hover:bg-primary-hover transition-colors duration-200 px-5 flex items-center justify-center"
            >
              <Search size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Support info — hidden on small screens */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-primary shrink-0">
            <Phone size={18} />
          </div>
          <div className="leading-snug text-sm whitespace-nowrap">
            <p className="text-primary font-bold" dir="ltr">
              +800 856 800 604
            </p>
            <p className="text-grayText flex items-center gap-1">
              <Mail size={13} />
              <span dir="ltr">info@tashkeela.com</span>
            </p>
          </div>
        </div>

        {/* Icons — visible on mobile too, next to the menu toggle, so they're not hidden inside the dropdown */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {/* Account icon — avatar letter if logged in, login/logout dropdown on click */}
          <div className="relative" ref={mobileAccountMenuRef}>
            <button
              type="button"
              aria-label="حسابي"
              onClick={() => setMobileAccountMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-colors duration-200 font-bold text-sm"
            >
              {firstLetter ? firstLetter : <User size={16} />}
            </button>

            <AnimatePresence>
              {mobileAccountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-40 bg-white border border-border rounded-xl shadow-md overflow-hidden z-50"
                >
                  {user ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-3 text-sm font-semibold text-danger hover:bg-background transition-colors duration-200"
                    >
                      تسجيل خروج
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLoginClick}
                      className="w-full text-right px-4 py-3 text-sm font-semibold text-primary hover:bg-background transition-colors duration-200"
                    >
                      تسجيل دخول
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => navigate("/favorites")}
            aria-label="المفضلة"
            className="relative w-9 h-9 rounded-full bg-background flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-colors duration-200"
          >
            <Heart size={16} />

            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
                {favoritesCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/cart")}
            aria-label="السلة"
            className="relative w-9 h-9 rounded-full bg-background flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-colors duration-200"
          >
            <ShoppingCart size={16} />

            {cartCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="القائمة"
          className="md:hidden w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shrink-0"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ---------- Bottom row: links + icons, orange line nested inside the white pill ---------- */}
      {/* In overlay mode, negative bottom margin + higher z-index makes this row visually float over the Hero section that follows, while the top row above stays in normal static flow */}
      <div
        className={
          overlay
            ? "relative z-20 max-w-7xl mx-auto px-4 sm:px-6 md:-mb-8 lg:-mb-10"
            : "max-w-7xl mx-auto px-4 sm:px-6 pb-0"
        }
      >
        <nav className="relative hidden md:flex items-center justify-between bg-white rounded-full shadow-md ring-1 ring-border/70 px-6 py-4">
          {/* Top & bottom orange bars — inset from all sides (top/bottom AND left/right) so they read as nested inside the white pill, not as its outer edge */}
          <span className="absolute top-0 right-6 left-6 h-[3px] bg-accent rounded-full" />
          <span className="absolute bottom-0 right-6 left-6 h-[3px] bg-accent rounded-full" />

          <ul className="flex items-center gap-8">
            {navLinks.map(({ label, path }) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => navigate(path)}
                  className="text-sm font-semibold text-primary hover:text-accent transition-colors duration-200"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {/* Account icon — avatar letter if logged in, login/logout dropdown on click */}
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                aria-label="حسابي"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-colors duration-200 font-bold text-sm"
              >
                {firstLetter ? firstLetter : <User size={16} />}
              </button>

              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-40 bg-white border border-border rounded-xl shadow-md overflow-hidden z-50"
                  >
                    {user ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-3 text-sm font-semibold text-danger hover:bg-background transition-colors duration-200"
                      >
                        تسجيل خروج
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLoginClick}
                        className="w-full text-right px-4 py-3 text-sm font-semibold text-primary hover:bg-background transition-colors duration-200"
                      >
                        تسجيل دخول
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => navigate("/favorites")}
              aria-label="المفضلة"
              className="relative w-9 h-9 rounded-full bg-background flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-colors duration-200"
            >
              <Heart size={16} />

              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
                  {favoritesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/cart")}
              aria-label="السلة"
              className="relative w-9 h-9 rounded-full bg-background flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-colors duration-200"
            >
              <ShoppingCart size={16} />

              {cartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* ---------- Mobile menu ---------- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-border"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Search on mobile */}
              <div className="flex rounded-xl overflow-hidden border border-border">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="flex-1 bg-background px-4 py-2.5 text-sm text-primary placeholder:text-grayText outline-none"
                />
                <button
                  type="button"
                  aria-label="بحث"
                  className="bg-primary px-5 flex items-center justify-center"
                >
                  <Search size={18} className="text-white" />
                </button>
              </div>

              {/* Links */}
              <ul className="space-y-1">
                {navLinks.map(({ label, path }) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(path);
                        setMenuOpen(false);
                      }}
                      className="block w-full text-right px-3 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-background transition-colors duration-200"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
              {/* Icons moved to the always-visible top bar on mobile — see header row above */}

              {/* Support on mobile */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shrink-0">
                  <Phone size={16} />
                </div>
                <div className="leading-snug text-sm">
                  <p className="text-primary font-bold">
                    <span dir="ltr">(+800) 856 800 604</span>
                  </p>
                  <p className="text-grayText" dir="ltr">
                    info@tashkeela.com
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
