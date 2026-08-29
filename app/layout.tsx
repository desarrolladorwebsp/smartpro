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
  title: "SmartPro | Agencia de publicidad y tecnología",
  description:
    "Estrategia, creatividad y tecnología para generar resultados reales y hacer crecer tu negocio.",
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
