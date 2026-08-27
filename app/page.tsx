import Navbar from "@/section/Navbar";
import HeroSection from "@/section/HeroSection";
import ServicesSection from "@/section/ServicesSection";
import PortfolioSection from "@/section/PortfolioSection";
import PresentersSection from "@/section/PresentersSection";
import TeamSection from "@/section/TeamSection";
import ContactSection from "@/section/ContactSection";
import LocationSection from "@/section/LocationSection";
import Footer from "@/section/Footer";

export default function Home() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <PortfolioSection />
      <PresentersSection />
      <TeamSection />
      <ContactSection />
      <LocationSection />
      <Footer />
    </div>
  );
}
