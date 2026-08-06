import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Heart, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const [favCount, setFavCount] = useState(() => {
    const local = JSON.parse(localStorage.getItem("favorites")) || [];
    return local.length;
  });
  const [cartCount, setCartCount] = useState(() => {
    const local = JSON.parse(localStorage.getItem("cart")) || [];
    return local.length;
  });

  const links = [
    { label: "Home", href: "/" },
    { label: "Delivery", href: "/delivery" },
    { label: "About", href: "/about" },
    { label: "Products", href: "/products" },
    { label: "Contact", href: "/contact" },
  ];

  // Keep counters in sync with localStorage across the whole app
  useEffect(() => {
    const syncFavCount = () => {
      const local = JSON.parse(localStorage.getItem("favorites")) || [];
      setFavCount(local.length);
    };
    const syncCartCount = () => {
      const local = JSON.parse(localStorage.getItem("cart")) || [];
      setCartCount(local.length);
    };

    window.addEventListener("favoritesUpdated", syncFavCount);
    window.addEventListener("cartUpdated", syncCartCount);
    return () => {
      window.removeEventListener("favoritesUpdated", syncFavCount);
      window.removeEventListener("cartUpdated", syncCartCount);
    };
  }, []);

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 shrink-0">
            <span className="text-4xl font-extrabold tracking-tighter -space-x-1 text-primary leading-none">
              <span className="italic">TS</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 rounded-md text-base font-bold text-primary hover:text-accent  transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-md text-base font-bold text-primary hover:text-accent  transition-colors"
                >
                  {link.label}
                </a>
              ),
            )}
          </div>

          {/* Icons + mobile menu button */}
          <div className="flex items-center gap-3">
            <Link
              to="/favorites"
              aria-label="Wishlist"
              className="relative inline-flex p-2 rounded-md text-primary hover:text-accent transition-colors"
            >
              <Heart size={22} />
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              aria-label="Shop"
              className="relative inline-flex p-2 rounded-md text-primary hover:text-accent transition-colors"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="md:hidden p-2 rounded-md text-dark hover:bg-background transition-colors"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border py-3 flex flex-col gap-1">
            {links.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-md text-base font-bold text-primary hover:text-accent  transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-md text-base font-bold text-primary hover:text-accent  transition-colors"
                >
                  {link.label}
                </a>
              ),
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
