import { notFound } from "next/navigation";

import { SaleDetail } from "@/components/admin/SaleDetail";
import { requireAdminSession } from "@/lib/auth";
import { getSaleCollection } from "@/lib/sales/collection-repository";
import { getSaleById } from "@/lib/sales/repository";

export const dynamic = "force-dynamic";

type SalePageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ abono?: string; cobro?: string; origen?: string }> };

export default async function SalePage({ params, searchParams }: SalePageProps) {
  const [session, { id }, { abono, cobro, origen }] = await Promise.all([requireAdminSession(), params, searchParams]);
  const [sale, collection] = await Promise.all([getSaleById(id), getSaleCollection(id, session)]);
  if (!sale) notFound();
  const paymentAvailable = collection?.canSchedule && sale.balanceDue > 0 && !sale.archivedAt && sale.status !== "CANCELLED";
  const openPaymentOnLoad = abono === "1" && Boolean(paymentAvailable);
  return <SaleDetail key={id} initialSale={sale} collection={collection} openPaymentOnLoad={openPaymentOnLoad}
    openCollectionOnLoad={!openPaymentOnLoad && cobro === "1" && Boolean(paymentAvailable) && !collection?.mode} fromCalendar={origen === "calendario"} />;
}
