import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smartpro.cl"),
  title: {
    default: "SmartPro | Agencia de publicidad y tecnología",
    template: "%s | SmartPro",
  },
  description:
    "SmartPro es una agencia de marketing digital, diseño web y automatización para empresas que quieren crecer con estrategia, creatividad y resultados reales.",
  applicationName: "SmartPro",
  authors: [{ name: "SmartPro" }],
  keywords: [
    "agencia de marketing digital",
    "desarrollo web",
    "landing pages",
    "sitios web",
    "ecommerce",
    "redes sociales",
    "campañas publicitarias",
    "automatización",
    "producción audiovisual",
    "SmartPro Chile",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SmartPro | Agencia de publicidad y tecnología",
    description:
      "Estrategia, creatividad y tecnología para impulsar marcas y negocios en Chile.",
    url: "https://smartpro.cl",
    siteName: "SmartPro",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/images/logo/logo-smartpro-01.png",
        width: 1200,
        height: 630,
        alt: "SmartPro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartPro | Agencia de publicidad y tecnología",
    description:
      "Estrategia, creatividad y tecnología para generar resultados reales y hacer crecer tu negocio.",
    images: ["/images/logo/logo-smartpro-01.png"],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6d28d9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#inicio"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Saltar al contenido
        </a>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
