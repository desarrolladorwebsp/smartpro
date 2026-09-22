import type { CustomerOrder } from "../../orders/repository";
import { getSaleByOrderId } from "../../sales/repository";
import { getApiClientById } from "./repository";
import { appendCheckoutResult, isReturnUrlAllowed } from "./return-url";
import { notifyApiClientOfOrder } from "./webhooks";

/// Cuando la orden nació en una subpágina, el comprador vuelve a esa
/// subpágina en lugar de a `/checkout/result` de SmartPro. La URL se vuelve a
/// validar contra la lista blanca por si la credencial cambió después de
/// iniciar el pago.
export async function resolveApiReturnUrl(
  order: CustomerOrder | null | undefined,
  status: string,
): Promise<string | null> {
  if (!order?.apiClientId || !order.apiReturnUrl) {
    return null;
  }

  try {
    const client = await getApiClientById(order.apiClientId);

    if (!client || client.status !== "ACTIVE" || !isReturnUrlAllowed(order.apiReturnUrl, client.allowedReturnUrls)) {
      return null;
    }

    return appendCheckoutResult(order.apiReturnUrl, {
      status,
      orderId: order.id,
      externalReference: order.apiExternalReference ?? null,
    });
  } catch (error) {
    console.error("[smartpro:api:v1:return]", error);
    return null;
  }
}

/// Notifica el resultado del pago a la subpágina y devuelve la URL a la que
/// debe volver el comprador, o `null` para mantener el flujo de SmartPro.
export async function finalizeApiCheckoutReturn(
  order: CustomerOrder | null | undefined,
  status: string,
): Promise<string | null> {
  if (!order?.apiClientId) {
    return null;
  }

  try {
    const sale = order.paymentStatus === "paid" ? await getSaleByOrderId(order.id) : null;
    await notifyApiClientOfOrder(order, { saleNumber: sale?.number ?? null });
  } catch (error) {
    console.error("[smartpro:api:v1:return:webhook]", error);
  }

  return resolveApiReturnUrl(order, status);
}
