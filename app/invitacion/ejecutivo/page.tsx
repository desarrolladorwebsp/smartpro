import type { Metadata } from "next";
import { Suspense } from "react";

import { ExecutiveInvitationForm } from "@/components/auth/ExecutiveInvitationForm";

export const metadata: Metadata = {
  title: "Completar invitación de ejecutivo",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExecutiveInvitationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-5">
          <p className="text-sm text-muted-foreground">Cargando invitación...</p>
        </main>
      }
    >
      <ExecutiveInvitationForm />
    </Suspense>
  );
}
