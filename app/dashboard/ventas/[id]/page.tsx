import { notFound } from "next/navigation";

import { SaleDetail } from "@/components/admin/SaleDetail";
import { requireAdminSession } from "@/lib/auth";
import { getSaleById } from "@/lib/sales/repository";

export const dynamic = "force-dynamic";

type SalePageProps = { params: Promise<{ id: string }> };

export default async function SalePage({ params }: SalePageProps) {
  await requireAdminSession();
  const { id } = await params;
  const sale = await getSaleById(id);
  if (!sale) notFound();
  return <SaleDetail initialSale={sale} />;
}
