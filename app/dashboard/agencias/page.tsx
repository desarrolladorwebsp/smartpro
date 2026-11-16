import { redirect } from "next/navigation";

import { AgencySettings } from "@/components/admin/AgencySettings";
import { requireAdminSession } from "@/lib/auth";
import { listAgencyProfiles } from "@/lib/agencies/repository";

export const dynamic = "force-dynamic";

export default async function AgenciesPage() {
  const session = await requireAdminSession();
  if (session.role !== "ADMIN") redirect("/dashboard");

  const agencies = await listAgencyProfiles();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Gestión comercial</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.05em]">Agencias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Administra la identidad, los datos de contacto y las cuentas bancarias que se usarán en nuevas cotizaciones.</p>
      </header>
      <AgencySettings initialAgencies={agencies} />
    </div>
  );
}
