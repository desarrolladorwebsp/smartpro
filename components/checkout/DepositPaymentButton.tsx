"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { redirectToWebpay } from "@/lib/webpay/client-redirect";
import { isAllowedWebpayRedirectUrl } from "@/lib/webpay/redirect";

export function DepositPaymentButton({ token, processing }: { token: string; processing: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/abonos/${token}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo abrir Webpay.");
      if (data.status === "paid") {
        router.refresh();
        return;
      }
      if (!data.token || !isAllowedWebpayRedirectUrl(data.url)) throw new Error("Webpay no está disponible. Intenta nuevamente.");
      redirectToWebpay(data.url, data.token);
      return;
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo abrir Webpay.");
    }
    setBusy(false);
  }

  return <div className="mt-5 space-y-2">
    <button type="button" disabled={busy} onClick={() => void pay()} className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60">
      {busy ? "Consultando Webpay…" : processing ? "Consultar o continuar en Webpay" : "Pagar con Webpay"}
    </button>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
  </div>;
}
