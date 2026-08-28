import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_DELAY = 5000;

export default function HeroSection() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "heroSlides"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((slide) => slide.active !== false);
      setSlides(data);
    });
    return () => unsubscribe();
  }, []);

  // Reset to a valid index if slides shrink
  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides, current]);

  const goTo = (index) => setCurrent(index);
  const goNext = () =>
    setCurrent((prev) => (slides.length ? (prev + 1) % slides.length : 0));
  const goPrev = () =>
    setCurrent((prev) =>
      slides.length ? (prev - 1 + slides.length) % slides.length : 0,
    );

  // Auto-rotate every 5 seconds — restarts whenever the slide changes,
  // so manual navigation via arrows/dots also resets the timer
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goNext, AUTOPLAY_DELAY);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    // Small top padding just clears the floating pill nav (from the overlay Navbar)
    // that sits partially over this section's top edge — the top navbar row above
    // it already pushes this section down normally, so no large offset is needed here
    <section className="relative bg-primary overflow-hidden pt-0 sm:pt-8 ">
      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Text — right side (RTL reading order) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id + "-text"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="order-1 md:order-2 text-center md:text-right"
            >
              {slide.badge && (
                <span className="inline-block bg-accent text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
                  {slide.badge}
                </span>
              )}

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.15] mb-5">
                {slide.title}
              </h1>

              {slide.price && (
                <p className="text-2xl sm:text-3xl font-bold text-white mb-8">
                  {slide.price} ج.م
                </p>
              )}

              {slide.buttonText && (
                <a
                  href={slide.buttonLink || "#"}
                  className="inline-block bg-accent hover:bg-accent-hover text-white font-bold px-8 py-3.5 rounded-full transition-colors duration-200"
                >
                  {slide.buttonText}
                </a>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Image — left side (RTL reading order) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id + "-image"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="order-2 md:order-1 flex justify-center"
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="max-h-72 sm:max-h-96 w-auto object-contain drop-shadow-2xl"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Side arrows — desktop only, vertically centered on the content row, sitting at the outer edges */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="السابق"
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-accent items-center justify-center text-white transition-colors duration-200"
            >
              <ChevronRight size={24} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="التالي"
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 rounded-full bg-white/10 hover:bg-accent items-center justify-center text-white transition-colors duration-200"
            >
              <ChevronLeft size={24} />
            </button>
          </>
        )}

        {/* Dots — always visible (mobile too), centered below the content */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {slides.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`الشريحة ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-6 bg-accent"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
