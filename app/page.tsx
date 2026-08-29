import Navbar from "@/section/Navbar";
import HeroSection from "@/section/HeroSection";
import ServicesSection from "@/section/ServicesSection";
import PortfolioSection from "@/section/PortfolioSection";
import PresentersSection from "@/section/PresentersSection";
import TeamSection from "@/section/TeamSection";
import ContactSection from "@/section/ContactSection";
import LocationSection from "@/section/LocationSection";
import Footer from "@/section/Footer";
import WhatsAppFloatingButton from "@/components/rrss/WhatsAppFloatingButton";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <PortfolioSection />
        <PresentersSection />
        <TeamSection />
        <ContactSection />
        <LocationSection />
      </main>
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
}
