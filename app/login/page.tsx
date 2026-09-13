import type { Metadata } from "next";
import { Suspense } from "react";

import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Acceso administrativo",
  robots: {
    index: false,
    follow: false,
  },
};

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08081a] p-5 text-white">
      <p className="text-sm text-white/50">Cargando acceso...</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
