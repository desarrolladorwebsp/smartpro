import type { Metadata } from "next";

import CheckoutResultClient from "@/components/checkout/CheckoutResultClient";

export const metadata: Metadata = {
  title: "Resultado del pago",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutResultPage() {
  return <CheckoutResultClient />;
}
