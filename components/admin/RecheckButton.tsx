"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RecheckButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
    >
      <RefreshCw size={16} className={pending ? "animate-spin" : ""} />
      {pending ? "Comprobando..." : "Comprobar de nuevo"}
    </button>
  );
}
