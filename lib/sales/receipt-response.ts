import type { getSaleReceiptMedia } from "./receipt";

type ReceiptRequestDependencies = {
  requireSession: () => Promise<unknown>;
  loadReceipt: typeof getSaleReceiptMedia;
};

export async function saleReceiptResponse(
  params: Promise<{ id: string }>,
  dependencies: ReceiptRequestDependencies,
): Promise<Response> {
  try {
    await dependencies.requireSession();
  } catch {
    return Response.json({ error: "No autorizado." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  try {
    const { id } = await params;
    const receipt = await dependencies.loadReceipt(id);
    if (!receipt) return Response.json({ error: "Comprobante no encontrado." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    const filename = receipt.fileName.replace(/[^\w.\-() ]/g, "_").slice(0, 120) || "comprobante";
    return new Response(new Uint8Array(receipt.bytes), {
      headers: {
        "Content-Type": receipt.mimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch (error) {
    console.error("[smartpro:sales:receipt]", error);
    return Response.json({ error: "No se pudo cargar el comprobante." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
