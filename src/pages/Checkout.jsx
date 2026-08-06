import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "../components/Navbar/Navbar";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import {
  User,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Banknote,
  Zap,
  CheckCircle2,
  Copy,
  X,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";

/* =======================
   Zod Schema
======================= */
const checkoutSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Please enter a valid name")
      .max(40, "Please enter a valid name")
      .regex(/^[A-Za-z\u0600-\u06FF\s]+$/, "Please enter a valid name."),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "Phone must be a valid Egyptian number"),
    whatsapp: z
      .string()
      .regex(
        /^01[0125][0-9]{8}$/,
        "Please enter a valid Egyptian WhatsApp number",
      ),
    city: z.string().min(1, "Please select a city"),
    area: z
      .string()
      .min(2, "Area is required")
      .max(50, "Area is too long")
      .regex(/^[A-Za-z\u0600-\u06FF0-9\s]+$/, "Invalid area format"),
    address: z
      .string()
      .min(10, "Address is required")
      .max(200, "Address is too long")
      .regex(/^[A-Za-z0-9\u0600-\u06FF\s,.-]+$/, "Invalid address format"),
    floor: z.string().regex(/^\d*$/, "Floor must be numbers only").optional(),
    paymentMethod: z.enum(["cash", "instapay"]),
    referenceNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod !== "instapay") return true;

      const ref = data.referenceNumber?.trim() || "";
      if (ref === "") return false;
      if (!/^\d+$/.test(ref)) return false;
      if (ref.length < 8 || ref.length > 20) return false;

      return true;
    },
    {
      message: "Reference number is required",
      path: ["referenceNumber"],
    },
  );

//    Egypt Cities
const egyptCities = [
  { id: "cairo", label: "Cairo" },
  { id: "giza", label: "Giza" },
  { id: "fayoum", label: "Fayoum" },
  { id: "beni-suef", label: "Beni Suef" },
  { id: "minya", label: "Minya" },
  { id: "assiut", label: "Assiut" },
  { id: "sohag", label: "Sohag" },
  { id: "qena", label: "Qena" },
  { id: "nag-hammadi", label: "Nag Hammadi" },
  { id: "luxor", label: "Luxor" },
  { id: "aswan", label: "Aswan" },
  { id: "alexandria", label: "Alexandria" },
  { id: "tanta", label: "Tanta" },
  { id: "mahalla", label: "Mahalla" },
  { id: "mansoura", label: "Mansoura" },
  { id: "suez", label: "Suez" },
  { id: "beheira", label: "Beheira" },
  { id: "sharqia", label: "Sharqia" },
  { id: "10th-of-ramadan", label: "10th of Ramadan" },
  { id: "port-said", label: "Port Said" },
  { id: "ismailia", label: "Ismailia" },
  { id: "damietta", label: "Damietta" },
  { id: "kafr-elsheikh", label: "Kafr El Sheikh" },
  { id: "qalyubia", label: "Qalyubia" },
  { id: "al-gharbia", label: "Al Gharbia" },
  { id: "monufia", label: "Monufia" },
  { id: "dakahlia", label: "Dakahlia" },
  { id: "north-coast", label: "North Coast" },
  { id: "marsa-matrouh", label: "Marsa Matrouh" },
  { id: "hurghada", label: "Hurghada" },
  { id: "sharm-el-sheikh", label: "Sharm El Sheikh" },
  { id: "marsa-alam", label: "Marsa Alam" },
  { id: "banha", label: "Banha" },
  { id: "badrashin", label: "Badrashin" },
  { id: "hawamdeya", label: "Hawamdeya" },
  { id: "saqqara", label: "Saqqara" },
  { id: "badr-city", label: "Badr City" },
];

const shippingFees = {
  cairo: 70,
  giza: 70,
  fayoum: 110,
  "beni-suef": 110,
  minya: 110,
  assiut: 110,
  sohag: 110,
  qena: 110,
  "nag-hammadi": 110,
  luxor: 110,
  aswan: 120,
  alexandria: 90,
  tanta: 100,
  mahalla: 100,
  mansoura: 100,
  suez: 100,
  beheira: 100,
  sharqia: 100,
  "10th-of-ramadan": 100,
  "port-said": 100,
  ismailia: 100,
  damietta: 100,
  "kafr-elsheikh": 100,
  qalyubia: 100,
  "al-gharbia": 100,
  monufia: 100,
  dakahlia: 100,
  "north-coast": 130,
  "marsa-matrouh": 130,
  hurghada: 140,
  "sharm-el-sheikh": 140,
  "marsa-alam": 140,
  banha: 85,
  badrashin: 85,
  hawamdeya: 85,
  saqqara: 90,
  "badr-city": 85,
};

//  Get Cart Data with Products Details
const getCartData = () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const quantities = JSON.parse(localStorage.getItem("cartQuantities")) || {};
  const products = JSON.parse(localStorage.getItem("cartProducts")) || [];

  return products
    .filter((p) => cart.includes(p.id))
    .map((item) => ({
      productId: item.id,
      productName: item.name || "Unknown Product",
      price: Number(item.price || 0),
      quantity: quantities[item.id] || 1,
      total: Number(item.price || 0) * (quantities[item.id] || 1),
      image: item.image || "",
      category: item.category || "",
    }));
};

//    Get Total From Cart
const getCartTotal = () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const quantities = JSON.parse(localStorage.getItem("cartQuantities")) || {};
  const products = JSON.parse(localStorage.getItem("cartProducts")) || [];

  return products
    .filter((p) => cart.includes(p.id))
    .reduce(
      (acc, item) => acc + Number(item.price || 0) * (quantities[item.id] || 1),
      0,
    );
};

export default function Checkout() {
  const [showModal, setShowModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const cartItems = getCartData();
  const total = getCartTotal();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
  });

  const paymentMethod = watch("paymentMethod");
  const selectedCity = watch("city");

  const shippingCost = selectedCity ? shippingFees[selectedCity] || 0 : 0;
  const grandTotal = total + shippingCost;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const guestId = localStorage.getItem("guestId") || crypto.randomUUID();
  localStorage.setItem("guestId", guestId);

  const onSubmit = async (data) => {
    try {
      const items = getCartData();

      const orderData = {
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city,
        area: data.area,
        address: data.address,
        floor: data.floor || "",
        paymentMethod: data.paymentMethod,
        ...(data.paymentMethod === "instapay" && {
          referenceNumber: data.referenceNumber,
        }),
        items,
        subtotal: total,
        shippingFee: shippingCost,
        grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
        orderNumber: `ORD-${Date.now()}`,
        guestId,
      };

      await addDoc(collection(db, "Orders"), orderData);

      localStorage.removeItem("cart");
      localStorage.removeItem("cartQuantities");
      localStorage.removeItem("cartProducts");
      window.dispatchEvent(new Event("cartUpdated"));

      setPlacedOrder(orderData);
      setOrderPlaced(true);

      toast.success("Order placed successfully");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error(error?.message || "Failed to place order. Please try again.");
    }
  };

  /* ================= Success Screen ================= */
  if (orderPlaced && placedOrder) {
    return (
      <>
        <Navbar />
        <section className="min-h-screen bg-background flex items-center justify-center px-6 py-16 font-sans">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-lg w-full bg-surface border border-border rounded-3xl shadow-xl p-8 md:p-10 text-center relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/10 rounded-full" />
            <div className="absolute -bottom-20 -left-16 w-52 h-52 bg-primary/5 rounded-full" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.1,
              }}
              className="relative z-10 mx-auto mb-6 w-20 h-20 rounded-full bg-success/10 flex items-center justify-center"
            >
              <CheckCircle2
                className="w-11 h-11 text-success"
                strokeWidth={2}
              />
            </motion.div>

            <h2 className="relative z-10 text-2xl md:text-3xl font-extrabold text-primary mb-2">
              Order Confirmed
            </h2>
            <p className="relative z-10 text-grayText mb-6">
              Thank you, {placedOrder.fullName.split(" ")[0]} Your order has
              been received and is being processed.
            </p>

            <div className="relative z-10 bg-background border border-border rounded-2xl p-5 mb-6 text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-grayText">Order Number</span>
                <span className="text-sm font-bold text-primary">
                  {placedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-grayText">Payment Method</span>
                <span className="text-sm font-bold text-primary capitalize">
                  {placedOrder.paymentMethod === "cash"
                    ? "Cash on Delivery"
                    : "Instapay"}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="text-sm font-semibold text-primary">
                  Total Paid
                </span>
                <span className="text-lg font-extrabold text-accent">
                  {placedOrder.grandTotal.toFixed(2)} EGP
                </span>
              </div>
            </div>

            <p className="relative z-10 text-xs text-grayText mb-8">
              We'll reach out to you on WhatsApp ({placedOrder.whatsapp}) to
              confirm delivery details.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/products"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <ShoppingBag size={18} />
                Continue Shopping
              </Link>
              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center gap-2 border border-border text-primary font-semibold py-3.5 rounded-xl hover:bg-background transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </section>
      </>
    );
  }

  /* ================= Checkout Form ================= */
  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-background py-12 font-sans">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <p className="text-sm font-semibold text-accent mb-2 tracking-wide uppercase">
              Almost there
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">
              Complete Your Order
            </h2>
          </motion.div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* ---------- Left: Form Steps ---------- */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1 - Contact */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <h3 className="font-bold text-primary text-lg">
                    Contact Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                      <User size={15} className="text-grayText" />
                      Full Name
                    </label>
                    <input
                      {...register("fullName")}
                      placeholder="Your full name"
                      className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                        errors.fullName
                          ? "border-danger focus:ring-danger/30"
                          : "border-border focus:ring-accent/30 focus:border-accent"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-danger text-xs mt-1.5">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                        <Phone size={15} className="text-grayText" />
                        Phone
                      </label>
                      <input
                        {...register("phone")}
                        placeholder="01XXXXXXXXX"
                        className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                          errors.phone
                            ? "border-danger focus:ring-danger/30"
                            : "border-border focus:ring-accent/30 focus:border-accent"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-danger text-xs mt-1.5">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                        <MessageCircle size={15} className="text-grayText" />
                        WhatsApp
                      </label>
                      <input
                        {...register("whatsapp")}
                        placeholder="01XXXXXXXXX"
                        className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                          errors.whatsapp
                            ? "border-danger focus:ring-danger/30"
                            : "border-border focus:ring-accent/30 focus:border-accent"
                        }`}
                      />
                      {errors.whatsapp && (
                        <p className="text-danger text-xs mt-1.5">
                          {errors.whatsapp.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 - Address */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <h3 className="font-bold text-primary text-lg">
                    Delivery Address
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                        <MapPin size={15} className="text-grayText" />
                        City
                      </label>
                      <select
                        {...register("city")}
                        className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                          errors.city
                            ? "border-danger focus:ring-danger/30"
                            : "border-border focus:ring-accent/30 focus:border-accent"
                        }`}
                      >
                        <option value="">Select city</option>
                        {egyptCities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.label}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="text-danger text-xs mt-1.5">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-1.5">
                        <Building2 size={15} className="text-grayText" />
                        Area
                      </label>
                      <input
                        {...register("area")}
                        placeholder="e.g. Nasr City"
                        className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                          errors.area
                            ? "border-danger focus:ring-danger/30"
                            : "border-border focus:ring-accent/30 focus:border-accent"
                        }`}
                      />
                      {errors.area && (
                        <p className="text-danger text-xs mt-1.5">
                          {errors.area.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-primary mb-1.5 block">
                      Full Address
                    </label>
                    <textarea
                      {...register("address")}
                      rows={2}
                      placeholder="Street, building number, landmarks..."
                      className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                        errors.address
                          ? "border-danger focus:ring-danger/30"
                          : "border-border focus:ring-accent/30 focus:border-accent"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-danger text-xs mt-1.5">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:w-1/2">
                    <label className="text-sm font-semibold text-primary mb-1.5 block">
                      Floor (Optional)
                    </label>
                    <input
                      {...register("floor")}
                      placeholder="e.g. 3"
                      className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                        errors.floor
                          ? "border-danger focus:ring-danger/30"
                          : "border-border focus:ring-accent/30 focus:border-accent"
                      }`}
                    />
                    {errors.floor && (
                      <p className="text-danger text-xs mt-1.5">
                        {errors.floor.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3 - Payment */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <h3 className="font-bold text-primary text-lg">
                    Payment Method
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "cash", icon: Banknote, label: "Cash on Delivery" },
                    { id: "instapay", icon: Zap, label: "Instapay" },
                  ].map((method) => {
                    const selected = paymentMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.id}
                        className={`relative cursor-pointer rounded-2xl border-2 p-5 text-center transition-all ${
                          selected
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <input
                          type="radio"
                          value={method.id}
                          {...register("paymentMethod")}
                          className="hidden"
                        />
                        {selected && (
                          <span className="absolute top-2.5 right-2.5">
                            <CheckCircle2
                              size={18}
                              className="text-accent"
                              fill="currentColor"
                              fillOpacity={0.15}
                            />
                          </span>
                        )}
                        <Icon
                          className={`mx-auto mb-2 ${
                            selected ? "text-accent" : "text-grayText"
                          }`}
                          size={26}
                        />
                        <p
                          className={`font-semibold text-sm ${
                            selected ? "text-primary" : "text-grayText"
                          }`}
                        >
                          {method.label}
                        </p>
                      </label>
                    );
                  })}
                </div>

                {errors.paymentMethod && (
                  <p className="text-danger text-xs mt-3">
                    Please select a payment method
                  </p>
                )}

                <AnimatePresence mode="wait">
                  {paymentMethod === "instapay" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mt-5">
                        <p className="font-bold text-primary mb-3 flex items-center gap-2">
                          <Zap size={16} className="text-accent" />
                          Instapay Instructions
                        </p>

                        <div className="bg-surface border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-grayText mb-0.5">
                              Transfer to
                            </p>
                            <p className="font-bold text-primary tracking-wide">
                              0123456789
                            </p>
                          </div>
                          <Copy size={16} className="text-grayText" />
                        </div>

                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-semibold text-primary">
                            Reference Number
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="text-accent text-xs font-semibold hover:underline"
                          >
                            Where do I find this?
                          </button>
                        </div>
                        <input
                          {...register("referenceNumber")}
                          placeholder="Enter your Instapay reference number"
                          className={`w-full border rounded-xl px-4 py-2.5 bg-background outline-none transition-all focus:ring-2 ${
                            errors.referenceNumber
                              ? "border-danger focus:ring-danger/30"
                              : "border-border focus:ring-accent/30 focus:border-accent"
                          }`}
                        />
                        {errors.referenceNumber && (
                          <p className="text-danger text-xs mt-1.5">
                            {errors.referenceNumber.message}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ---------- Right: Order Summary ---------- */}
            <div className="lg:col-span-1">
              <div className="bg-surface border border-border rounded-2xl shadow-lg p-6 sticky top-24">
                <h3 className="font-bold text-primary text-lg mb-5 flex items-center gap-2">
                  <PackageCheck size={20} className="text-accent" />
                  Order Summary
                </h3>

                {cartItems.length > 0 && (
                  <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-grayText">
                            Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-primary shrink-0">
                          {item.total.toFixed(0)} EGP
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm text-grayText">
                    <span>Subtotal</span>
                    <span className="font-semibold text-primary">
                      {total.toFixed(2)} EGP
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-grayText">
                    <span>Shipping</span>
                    <span className="font-semibold text-primary">
                      {selectedCity
                        ? `${shippingCost.toFixed(2)} EGP`
                        : "Select city"}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-primary">Total</span>
                    <span className="text-2xl font-extrabold text-accent">
                      {grandTotal.toFixed(2)} EGP
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:bg-grayText/40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                >
                  {isSubmitting ? "Processing..." : "Confirm Order"}
                </button>
                {cartItems.length === 0 && (
                  <p className="text-xs text-danger text-center mt-3">
                    Your cart is empty
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ================= Modal للشرح ================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="bg-surface rounded-3xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-primary p-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap size={18} />
                  Finding Your Reference Number
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-background border border-border rounded-xl p-4">
                  <p className="text-sm text-grayText mb-1">
                    After your Instapay transfer succeeds, open your transaction
                    receipt.
                  </p>
                  <p className="text-sm text-grayText">
                    The reference number is usually a long numeric code shown
                    under "Transaction ID" or "Reference".
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl p-4">
                  <CheckCircle2
                    size={18}
                    className="text-accent shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-primary">
                    Copy it exactly as shown, without spaces or symbols.
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl p-4">
                  <span className="text-danger font-bold text-sm shrink-0">
                    !
                  </span>
                  <p className="text-sm text-primary">
                    Your order won't be confirmed without a valid reference
                    number.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
