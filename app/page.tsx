import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";
import WhatsAppFloatingButton from "@/components/rrss/WhatsAppFloatingButton";
import ContactSection from "@/section/ContactSection";
import Footer from "@/section/Footer";
import HeroSection from "@/section/HeroSection";
import LocationSection from "@/section/LocationSection";
import Navbar from "@/section/Navbar";
import PortfolioSection from "@/section/PortfolioSection";
import PresentersSection from "@/section/PresentersSection";
import ServicesSection from "@/section/ServicesSection";
import TeamSection from "@/section/TeamSection";

export const metadata: Metadata = {
  title: "Agencia de marketing digital y desarrollo web en Chile",
  description:
    "SmartPro ofrece estrategia digital, sitios web, campañas, redes sociales, automatización y producción audiovisual para marcas que quieren crecer.",
  alternates: {
    canonical: "/",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "SmartPro",
  image: "https://smartpro.cl/images/seo/og-smartpro.jpg",
  description:
    "Agencia de marketing digital, desarrollo web y creatividad para empresas que quieren crecer en internet.",
  url: "https://smartpro.cl",
  telephone: "+56949773707",
  email: "contacto@smartpro.cl",
  areaServed: "CL",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Santa Elena 941 B",
    addressLocality: "Santiago",
    addressRegion: "Región Metropolitana",
    addressCountry: "CL",
  },
  sameAs: [
    "https://www.instagram.com/smartpro.chile/",
    "https://www.facebook.com/profile.php?id=61568563559545",
    "https://x.com/smartpro2025",
  ],
  priceRange: "$$",
  makesOffer: [
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Desarrollo Web",
        description: "Landing pages, sitios web y experiencias digitales para empresas y marcas.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Campañas Publicitarias",
        description: "Estrategia y ejecución publicitaria para captar leads y mejorar conversiones.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Redes Sociales & Contenido",
        description: "Contenido, gestión y posicionamiento para redes sociales y comunidades digitales.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Automatización & Conversión",
        description: "Flujos automatizados para mejorar atención, ventas y procesos internos.",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Producción Audiovisual",
        description: "Contenido visual y audiovisual para comunicar mejor y generar conexión con la audiencia.",
      },
    },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SmartPro",
  url: "https://smartpro.cl",
  description:
    "Agencia de marketing digital, estrategia, diseño web y automatización para marcas y negocios en Chile.",
  inLanguage: "es-CL",
};

export default function Home() {
  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
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
    </>
  );
}
