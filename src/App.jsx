import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import DeliveryReturns from "./pages/Deliveryreturns";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Products from "./pages/Products";
import AddProducts from "./pages/AddProducts";
import ManageProducts from "./pages/ManageProducts";
import DashBoardLayout from "./components/DashboardLayout/DashboardLayout";
import { Toaster } from "react-hot-toast";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/delivery" element={<DeliveryReturns />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/products" element={<Products />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/Checkout" element={<Checkout />} />

        {/* //dashboard */}
        <Route
          path="/dashboard"
          element={
            // <ProtectedRoute>
            <DashBoardLayout />
            // </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="addProducts" replace />} />
          <Route path="addProducts" element={<AddProducts />} />
          <Route path="productsManagement" element={<ManageProducts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
