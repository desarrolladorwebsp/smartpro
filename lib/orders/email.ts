import { sendEmail } from "../email/resend";
import { formatCurrency } from "./service";
import type { CustomerOrder } from "./repository";

export type OrderEmailPayload = {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal?: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: CustomerOrder["paymentMethod"];
  paymentStatus?: CustomerOrder["paymentStatus"];
};

function paymentMethodLabel(method: CustomerOrder["paymentMethod"] | undefined) {
  if (method === "mercadopago") return "Mercado Pago";
  if (method === "transbank") return "Webpay";
  if (method === "simulated") return "Simulado";
  return method ?? "No informado";
}

function paymentStatusLabel(status: CustomerOrder["paymentStatus"] | undefined) {
  if (status === "paid") return "Pagada";
  if (status === "pending") return "Pendiente";
  if (status === "failed") return "Fallida";
  if (status === "cancelled") return "Cancelada";
  return status ?? "Pendiente";
}

export function buildOrderNotificationText(order: OrderEmailPayload) {
  return [
    `Nueva orden SmartPro — ${order.id}`,
    "",
    `Fecha: ${new Date(order.createdAt).toLocaleString("es-CL")}`,
    `Cliente: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `Teléfono: ${order.customer.phone}`,
    order.customer.company ? `Empresa: ${order.customer.company}` : "Empresa: —",
    "",
    "Servicios:",
    ...order.items.map(
      (item) => `- ${item.name} x${item.quantity} — ${formatCurrency(item.unitPrice * (item.quantity ?? 1))}`,
    ),
    "",
    `Subtotal: ${formatCurrency(order.subtotal)}`,
    `IVA: ${formatCurrency(order.tax)}`,
    `Total: ${formatCurrency(order.total)}`,
    `Método de pago: ${paymentMethodLabel(order.paymentMethod)}`,
    `Estado: ${paymentStatusLabel(order.paymentStatus)}`,
  ].join("\n");
}

export async function sendOrderNotification(order: OrderEmailPayload) {
  const to = process.env.EMAIL_TO ?? "contacto@smartpro.cl";

  return sendEmail({
    to,
    subject:
      order.paymentStatus === "paid"
        ? `Pago confirmado SmartPro — ${order.id}`
        : `Nueva orden SmartPro — ${order.id}`,
    text: buildOrderNotificationText(order),
  });
}
