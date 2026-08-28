import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { PackageSearch } from "lucide-react";

// ألوان خلفية الفقاعات، بتتكرر بالدور على التصنيفات
const BUBBLE_COLORS = [
  "bg-[#E3F9E5]", // أخضر فاتح
  "bg-[#F3E8FF]", // بنفسجي فاتح
  "bg-[#FEF9E7]", // أصفر فاتح
  "bg-[#E8EEFB]", // أزرق فاتح
  "bg-[#FDEAEA]", // وردي فاتح
  "bg-[#E6F7F5]", // فيروزي فاتح
];

// سرعة السلايدر (بكسل في الثانية) - كل ما رقمها أكبر، السلايدر يجري أسرع
const MARQUEE_SPEED = 55;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const [shouldSlide, setShouldSlide] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  // جلب المنتجات من Firebase واستخراج التصنيفات الفريدة منها
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const snapshot = await getDocs(collection(db, "Products"));

        const map = new Map();

        snapshot.forEach((doc) => {
          const data = doc.data();
          const categoryName = (data.category || "").trim();

          if (!categoryName) return;

          // لو التصنيف اتكرر، بناخد أقل order (لو موجود) عشان الترتيب
          const existing = map.get(categoryName);
          const order =
            data.order !== null && data.order !== undefined
              ? Number(data.order)
              : null;

          if (!existing) {
            map.set(categoryName, {
              name: categoryName,
              imageUrl: data.categoryImageUrl || data.imageUrl || "",
              order,
            });
          } else if (
            order !== null &&
            (existing.order === null || order < existing.order)
          ) {
            existing.order = order;
          }
        });

        const list = Array.from(map.values()).sort((a, b) => {
          if (a.order === null && b.order === null) return 0;
          if (a.order === null) return 1;
          if (b.order === null) return -1;
          return a.order - b.order;
        });

        if (isMounted) setCategories(list);
      } catch (err) {
        console.error("Error fetching categories:", err);
        if (isMounted) setError("حصل خطأ أثناء تحميل التصنيفات.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // تحديد لون كل فقاعة حسب ترتيبها
  const coloredCategories = useMemo(
    () =>
      categories.map((cat, index) => ({
        ...cat,
        color: BUBBLE_COLORS[index % BUBBLE_COLORS.length],
      })),
    [categories],
  );

  // بنقيس عرض صف واحد من التصنيفات (مخفي) مقابل عرض الحاوية
  // لو الصف الحقيقي أعرض من الشاشة، نفعّل السلايدر
  useEffect(() => {
    if (isLoading || coloredCategories.length === 0) return;

    const measure = () => {
      const contentW = measureRef.current?.scrollWidth || 0;
      const containerW = containerRef.current?.offsetWidth || 0;

      setContentWidth(contentW);
      setShouldSlide(contentW > containerW);
    };

    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [coloredCategories, isLoading]);

  const duration = Math.max(contentWidth / MARQUEE_SPEED, 8);

  return (
    <div className="w-full py-6 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {isLoading && (
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 shrink-0 w-40 sm:w-48 animate-pulse"
              >
                <div className="w-36 sm:w-44 h-44 sm:h-52 rounded-full bg-border/60" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!isLoading && !error && coloredCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 text-grayText py-10">
            <PackageSearch size={28} />
            <p className="text-sm">لا توجد تصنيفات لعرضها حاليًا.</p>
          </div>
        )}

        {!isLoading && !error && coloredCategories.length > 0 && (
          <div
            ref={containerRef}
            dir={shouldSlide ? "ltr" : undefined}
            className={`relative overflow-hidden ${shouldSlide ? "cat-marquee-mask" : ""}`}
          >
            {/* صف مخفي بيتقاس بس، مش ظاهر، عشان نعرف هل المحتوى فايض عن الشاشة ولا لأ */}
            <div
              ref={measureRef}
              aria-hidden="true"
              className="flex gap-6 absolute top-0 right-0 opacity-0 pointer-events-none -z-10"
            >
              {coloredCategories.map((cat) => (
                <CategoryBubble key={`measure-${cat.name}`} category={cat} />
              ))}
            </div>

            {/* الصف الظاهر فعليًا */}
            <div
              dir={shouldSlide ? "ltr" : undefined}
              className={`flex gap-6 w-max ${shouldSlide ? "cat-marquee-track" : ""}`}
              style={
                shouldSlide
                  ? {
                      animationDuration: `${duration}s`,
                    }
                  : undefined
              }
            >
              {/* لو محتاجين سلايدر، بنكرر القائمة مرتين بالظبط عشان الحركة تفضل متصلة 100% من غير ما يبان جزء فاضي أو مقطوع */}
              {(shouldSlide
                ? [...coloredCategories, ...coloredCategories]
                : coloredCategories
              ).map((cat, index) => (
                <CategoryBubble key={`${cat.name}-${index}`} category={cat} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cat-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .cat-marquee-track {
          animation-name: cat-marquee-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .cat-marquee-track:hover {
          animation-play-state: paused;
        }
       .cat-marquee-mask {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 12%,
    black 88%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 12%,
    black 88%,
    transparent 100%
  );
}
        @media (prefers-reduced-motion: reduce) {
          .cat-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function CategoryBubble({ category }) {
  return (
    <div
      className={`flex flex-col items-center justify-start gap-3 shrink-0 w-36 sm:w-44 pt-5 pb-5 px-3 rounded-full ${category.color} shadow-sm select-none`}
    >
      {category.imageUrl ? (
        <motion.img
          src={category.imageUrl}
          alt={category.name}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
          initial={{ rotateY: 0 }}
          whileHover={{ rotateY: 180 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        />
      ) : (
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <PackageSearch size={32} className="text-grayText" />
        </div>
      )}

      <p className="text-sm sm:text-base font-bold text-primary text-center leading-tight px-2 w-full break-words whitespace-normal">
        {category.name}
      </p>
    </div>
  );
}
