import { getAppUrl } from "../app-url";
import { renderCorporateEmail } from "../email/template";
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

function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(date);
}

export function orderNotificationSubject(order: OrderEmailPayload): string {
  return order.paymentStatus === "paid"
    ? `Pago confirmado SmartPro — ${order.id}`
    : `Nueva orden SmartPro — ${order.id}`;
}

export function buildOrderNotificationEmail(order: OrderEmailPayload, appUrl = getAppUrl()) {
  const paid = order.paymentStatus === "paid";
  const services = order.items
    .map((item) => `${item.name} x${item.quantity} — ${formatCurrency(item.unitPrice * item.quantity)}`)
    .join("; ");

  return renderCorporateEmail({
    title: orderNotificationSubject(order),
    preheader: paid ? `Se confirmó el pago de la orden ${order.id}.` : `Entró la orden ${order.id}.`,
    heading: paid ? "Pago confirmado" : "Nueva orden",
    greeting: "Hola,",
    intro: paid
      ? `Se confirmó el pago de la orden ${order.id}.`
      : `Entró una nueva orden ${order.id}.`,
    highlight: {
      label: "Total",
      value: formatCurrency(order.total),
    },
    details: [
      { label: "Orden", value: order.id },
      { label: "Fecha", value: formatOrderDate(order.createdAt) },
      { label: "Cliente", value: order.customer.name },
      { label: "Correo", value: order.customer.email },
      { label: "Teléfono", value: order.customer.phone },
      { label: "Empresa", value: order.customer.company?.trim() || "—" },
      { label: "Servicios", value: services || "—" },
      { label: "Subtotal", value: formatCurrency(order.subtotal) },
      { label: "IVA", value: formatCurrency(order.tax) },
      { label: "Método de pago", value: paymentMethodLabel(order.paymentMethod) },
      { label: "Estado", value: paymentStatusLabel(order.paymentStatus) },
    ],
    closing: "Revisa el panel para continuar con esta venta.",
    appUrl,
  });
}

export async function sendOrderNotification(order: OrderEmailPayload) {
  const to = process.env.EMAIL_TO ?? "contacto@smartpro.cl";
  const { html, text } = buildOrderNotificationEmail(order);

  return sendEmail({
    to,
    subject: orderNotificationSubject(order),
    html,
    text,
  });
}
