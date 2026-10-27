import type { Metadata } from "next";
import Navbar from "@/section/Navbar";
import Footer from "@/section/Footer";
import TariffExperience from "@/components/tarifario/TariffExperience";

export const metadata: Metadata = {
  title: "Tarifario de modificaciones y nuevas funciones",
  description: "Precios referenciales en UF para secciones, páginas, formularios e integraciones. Confirma tu servicio con un ejecutivo mediante una cotización formal.",
  alternates: { canonical: "/tarifario" },
};

export default function TarifarioPage() {
  return <><Navbar /><main id="inicio" className="flex-1 pt-28 sm:pt-36"><TariffExperience /></main><Footer /></>;
}
