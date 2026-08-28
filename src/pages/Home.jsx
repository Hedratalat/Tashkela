import Categories from "../components/Categories/Categories";
import FeaturedProducts from "../components/FeaturedProducts/FeaturedProducts";
import Feedback from "../components/Feedback/Feedback";
import HeroSection from "../components/HeroSection/HeroSection";
import Navbar from "../components/Navbar/Navbar";
import NewArrivle from "../components/NewArrivle/NewArrivle";

export default function Home() {
  return (
    <>
      <Navbar overlay />
      <HeroSection />
      <Categories />
      <NewArrivle />
      <FeaturedProducts />
      <Feedback />
    </>
  );
}
